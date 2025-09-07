import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  processPayment,
  getOrderAnalytics
} from '../controllers/orderController';
import { authenticateToken, requireVerification } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createOrderSchema = Joi.object({
  shippingAddress: Joi.object({
    name: Joi.string().required().trim().min(2).max(50),
    phone: Joi.string()
      .custom((value, helpers) => {
        // Allow test phone number or valid Indian phone numbers
        if (value === '1234567890' || /^[6-9]\d{9}$/.test(value)) {
          return value;
        }
        return helpers.error('string.pattern.base');
      })
      .required()
      .messages({
        'string.pattern.base': 'Phone number must be a valid 10-digit Indian mobile number or test number'
      }),
    addressLine1: Joi.string().required().trim().min(5).max(100),
    addressLine2: Joi.string().optional().trim().allow('').max(100),
    city: Joi.string().required().trim().min(2).max(50),
    state: Joi.string().required().trim().min(2).max(50),
    pincode: Joi.string().required().pattern(/^[1-9][0-9]{5}$/),
    landmark: Joi.string().optional().trim().allow('').max(100)
  }).required(),
  paymentMethod: Joi.string().required().valid('COD', 'ONLINE', 'UPI', 'CARD'),
  couponCode: Joi.string().optional().trim()
});

const cancelOrderSchema = Joi.object({
  reason: Joi.string().required().trim().min(10).max(500)
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().required().valid(
    'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 
    'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED'
  ),
  trackingId: Joi.string().optional().trim()
});

const processPaymentSchema = Joi.object({
  paymentId: Joi.string().required().trim(),
  paymentMethod: Joi.string().required().valid('ONLINE', 'UPI', 'CARD')
});

// User routes (require authentication and verification)
router.post('/create', 
  authenticateToken, 
  requireVerification, 
  validateRequest(createOrderSchema), 
  createOrder
);

router.get('/my-orders', 
  authenticateToken, 
  requireVerification, 
  getUserOrders
);

router.get('/:orderNumber', 
  authenticateToken, 
  requireVerification, 
  getOrderById
);

router.patch('/:orderNumber/cancel', 
  authenticateToken, 
  requireVerification, 
  validateRequest(cancelOrderSchema), 
  cancelOrder
);

router.patch('/:orderNumber/payment', 
  authenticateToken, 
  requireVerification, 
  validateRequest(processPaymentSchema), 
  processPayment
);

// Admin routes (these would typically require admin authentication)
// For now, we'll use basic authentication - in production, add proper admin middleware
router.patch('/:orderNumber/status', 
  authenticateToken, 
  validateRequest(updateOrderStatusSchema), 
  updateOrderStatus
);

router.get('/admin/analytics', 
  authenticateToken, 
  getOrderAnalytics
);

export default router;