import express from 'express';
import {
  calculateShippingRates,
  createShipment,
  updateShipmentTracking,
  getTrackingInfo,
  getOrderShipments,
  getShipments,
  getShippingProviders,
  createShippingProvider,
  updateShippingProvider,
  deleteShippingProvider,
  getProviderRates,
  createShippingRate,
  updateShippingRate,
  deleteShippingRate,
  getShippingAnalytics,
  bulkUpdateShipmentStatus,
  getShipmentById
} from '../controllers/shippingController';
import { authenticateToken, requireVerification, authenticateUserOrAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const calculateRatesSchema = Joi.object({
  weight: Joi.number().min(0.1).max(1000).required(),
  dimensions: Joi.object({
    length: Joi.number().min(1).max(200).required(),
    width: Joi.number().min(1).max(200).required(),
    height: Joi.number().min(1).max(200).required()
  }).required(),
  value: Joi.number().min(1).required(),
  fromPincode: Joi.string().pattern(/^[0-9]{6}$/).required(),
  toPincode: Joi.string().pattern(/^[0-9]{6}$/).required(),
  serviceType: Joi.string().valid('standard', 'express', 'overnight', 'same_day').optional(),
  providerId: Joi.string().optional()
});

const createShipmentSchema = Joi.object({
  orderNumber: Joi.string().required(),
  providerId: Joi.string().required(),
  serviceType: Joi.string().valid('standard', 'express', 'overnight', 'same_day').required(),
  packageDetails: Joi.object({
    weight: Joi.number().min(0.1).max(1000).required(),
    dimensions: Joi.object({
      length: Joi.number().min(1).max(200).required(),
      width: Joi.number().min(1).max(200).required(),
      height: Joi.number().min(1).max(200).required()
    }).required(),
    value: Joi.number().min(1).required(),
    description: Joi.string().min(1).max(500).required()
  }).required(),
  notes: Joi.string().max(1000).optional()
});

const updateTrackingSchema = Joi.object({
  status: Joi.string().valid(
    'pending', 'picked_up', 'in_transit', 'out_for_delivery', 
    'delivered', 'failed_delivery', 'returned'
  ).required(),
  location: Joi.string().min(1).max(200).required(),
  description: Joi.string().min(1).max(500).required(),
  estimatedDelivery: Joi.date().optional()
});

const createProviderSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  code: Joi.string().min(2).max(10).uppercase().required(),
  description: Joi.string().max(500).optional(),
  logo: Joi.string().uri().optional(),
  contactInfo: Joi.object({
    phone: Joi.string().optional(),
    email: Joi.string().email().optional(),
    website: Joi.string().uri().optional(),
    supportUrl: Joi.string().uri().optional()
  }).optional(),
  apiConfig: Joi.object({
    baseUrl: Joi.string().uri().optional(),
    apiKey: Joi.string().optional(),
    secretKey: Joi.string().optional(),
    trackingUrl: Joi.string().uri().optional(),
    webhookUrl: Joi.string().uri().optional()
  }).optional(),
  capabilities: Joi.object({
    tracking: Joi.boolean().default(true),
    realTimeRates: Joi.boolean().default(false),
    pickupScheduling: Joi.boolean().default(false),
    insurance: Joi.boolean().default(false),
    codSupport: Joi.boolean().default(false)
  }).optional(),
  serviceAreas: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      pincodes: Joi.array().items(Joi.string().pattern(/^[0-9]{6}$/)).required(),
      isActive: Joi.boolean().default(true)
    })
  ).optional(),
  priority: Joi.number().min(0).default(0)
});

const createRateSchema = Joi.object({
  providerId: Joi.string().required(),
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  serviceType: Joi.string().valid('standard', 'express', 'overnight', 'same_day').required(),
  deliveryTime: Joi.object({
    min: Joi.number().min(0).required(),
    max: Joi.number().min(Joi.ref('min')).required()
  }).required(),
  rateStructure: Joi.object({
    type: Joi.string().valid('flat', 'weight_based', 'distance_based', 'value_based').required(),
    baseRate: Joi.number().min(0).required(),
    weightRanges: Joi.array().items(
      Joi.object({
        minWeight: Joi.number().min(0).required(),
        maxWeight: Joi.number().min(Joi.ref('minWeight')).required(),
        rate: Joi.number().min(0).required()
      })
    ).optional(),
    distanceRanges: Joi.array().items(
      Joi.object({
        minDistance: Joi.number().min(0).required(),
        maxDistance: Joi.number().min(Joi.ref('minDistance')).required(),
        rate: Joi.number().min(0).required()
      })
    ).optional(),
    valuePercentage: Joi.number().min(0).max(100).optional()
  }).required(),
  zones: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      pincodes: Joi.array().items(Joi.string().pattern(/^[0-9]{6}$/)).required(),
      multiplier: Joi.number().min(0.1).default(1)
    })
  ).optional(),
  freeShippingThreshold: Joi.number().min(0).optional(),
  maxWeight: Joi.number().min(0.1).required(),
  maxValue: Joi.number().min(1).required()
});

const bulkUpdateSchema = Joi.object({
  updates: Joi.array().items(
    Joi.object({
      shipmentId: Joi.string().required(),
      status: Joi.string().valid(
        'pending', 'picked_up', 'in_transit', 'out_for_delivery', 
        'delivered', 'failed_delivery', 'returned'
      ).required(),
      location: Joi.string().min(1).max(200).required(),
      description: Joi.string().min(1).max(500).required(),
      estimatedDelivery: Joi.date().optional()
    })
  ).min(1).required()
});

// Public routes

/**
 * @route POST /api/shipping/calculate-rates
 * @desc Calculate shipping rates for given parameters
 * @access Public
 */
router.post(
  '/calculate-rates',
  validateRequest(calculateRatesSchema),
  calculateShippingRates
);

/**
 * @route GET /api/shipping/track/:trackingNumber
 * @desc Get tracking information for a shipment
 * @access Public
 */
router.get('/track/:trackingNumber', getTrackingInfo);

/**
 * @route GET /api/shipping/providers
 * @desc Get list of shipping providers
 * @access Public
 */
router.get('/providers', getShippingProviders);

/**
 * @route GET /api/shipping/providers/:providerId/rates
 * @desc Get shipping rates for a specific provider
 * @access Public
 */
router.get('/providers/:providerId/rates', getProviderRates);

// Authenticated user routes

/**
 * @route GET /api/shipping/orders/:orderNumber/shipments
 * @desc Get shipments for a specific order
 * @access Private (User)
 */
router.get(
  '/orders/:orderNumber/shipments',
  authenticateToken,
  requireVerification,
  getOrderShipments
);

// Admin routes

/**
 * @route POST /api/shipping/shipments
 * @desc Create a new shipment
 * @access Private (Admin)
 */
router.post(
  '/shipments',
  authenticateUserOrAdmin,
  validateRequest(createShipmentSchema),
  createShipment
);

/**
 * @route GET /api/shipping/shipments
 * @desc Get all shipments with filters
 * @access Private (Admin)
 */
router.get('/shipments', authenticateUserOrAdmin, getShipments);

/**
 * @route GET /api/shipping/shipments/:shipmentId
 * @desc Get shipment by ID
 * @access Private (Admin)
 */
router.get('/shipments/:shipmentId', authenticateUserOrAdmin, getShipmentById);

/**
 * @route PUT /api/shipping/shipments/:shipmentId/tracking
 * @desc Update shipment tracking information
 * @access Private (Admin)
 */
router.put(
  '/shipments/:shipmentId/tracking',
  authenticateUserOrAdmin,
  validateRequest(updateTrackingSchema),
  updateShipmentTracking
);

/**
 * @route POST /api/shipping/shipments/bulk-update
 * @desc Bulk update shipment status
 * @access Private (Admin)
 */
router.post(
  '/shipments/bulk-update',
  authenticateUserOrAdmin,
  validateRequest(bulkUpdateSchema),
  bulkUpdateShipmentStatus
);

/**
 * @route POST /api/shipping/providers
 * @desc Create a new shipping provider
 * @access Private (Admin)
 */
router.post(
  '/providers',
  authenticateUserOrAdmin,
  validateRequest(createProviderSchema),
  createShippingProvider
);

/**
 * @route PUT /api/shipping/providers/:providerId
 * @desc Update shipping provider
 * @access Private (Admin)
 */
router.put(
  '/providers/:providerId',
  authenticateUserOrAdmin,
  validateRequest(createProviderSchema),
  updateShippingProvider
);

/**
 * @route DELETE /api/shipping/providers/:providerId
 * @desc Delete (deactivate) shipping provider
 * @access Private (Admin)
 */
router.delete('/providers/:providerId', authenticateUserOrAdmin, deleteShippingProvider);

/**
 * @route POST /api/shipping/rates
 * @desc Create a new shipping rate
 * @access Private (Admin)
 */
router.post(
  '/rates',
  authenticateUserOrAdmin,
  validateRequest(createRateSchema),
  createShippingRate
);

/**
 * @route PUT /api/shipping/rates/:rateId
 * @desc Update shipping rate
 * @access Private (Admin)
 */
router.put(
  '/rates/:rateId',
  authenticateUserOrAdmin,
  validateRequest(createRateSchema),
  updateShippingRate
);

/**
 * @route DELETE /api/shipping/rates/:rateId
 * @desc Delete (deactivate) shipping rate
 * @access Private (Admin)
 */
router.delete('/rates/:rateId', authenticateUserOrAdmin, deleteShippingRate);

/**
 * @route GET /api/shipping/analytics
 * @desc Get shipping analytics
 * @access Private (Admin)
 */
router.get('/analytics', authenticateUserOrAdmin, getShippingAnalytics);

export default router;