import express from 'express';
import {
  applyCoupon,
  removeCoupon,
  validateCoupon,
  getAvailableCoupons,
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCouponAnalytics,
  bulkCreateCoupons,
  generateCouponCodes
} from '../controllers/couponController';
import { authenticateToken, requireVerification, authenticateUserOrAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const applyCouponSchema = Joi.object({
  code: Joi.string().min(3).max(20).uppercase().required()
});

const createCouponSchema = Joi.object({
  code: Joi.string().min(3).max(20).uppercase().required(),
  description: Joi.string().min(1).max(500).required(),
  discountType: Joi.string().valid('percentage', 'fixed').required(),
  discountValue: Joi.number().min(0).required(),
  minOrderAmount: Joi.number().min(0).default(0),
  maxDiscountAmount: Joi.number().min(0).optional(),
  usageLimit: Joi.number().min(1).required(),
  validFrom: Joi.date().required(),
  validUntil: Joi.date().greater(Joi.ref('validFrom')).required(),
  applicableCategories: Joi.array().items(Joi.string()).optional(),
  applicableProducts: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().default(true)
});

const updateCouponSchema = Joi.object({
  code: Joi.string().min(3).max(20).uppercase().optional(),
  description: Joi.string().min(1).max(500).optional(),
  discountType: Joi.string().valid('percentage', 'fixed').optional(),
  discountValue: Joi.number().min(0).optional(),
  minOrderAmount: Joi.number().min(0).optional(),
  maxDiscountAmount: Joi.number().min(0).optional(),
  usageLimit: Joi.number().min(1).optional(),
  validFrom: Joi.date().optional(),
  validUntil: Joi.date().optional(),
  applicableCategories: Joi.array().items(Joi.string()).optional(),
  applicableProducts: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional()
});

const bulkCreateSchema = Joi.object({
  coupons: Joi.array().items(createCouponSchema).min(1).max(50).required()
});

const generateCodesSchema = Joi.object({
  count: Joi.number().min(1).max(100).default(10),
  prefix: Joi.string().max(5).default(''),
  length: Joi.number().min(4).max(15).default(8)
});

// Customer routes (require authentication)

/**
 * @route POST /api/coupons/apply
 * @desc Apply coupon to cart
 * @access Private (User)
 */
router.post(
  '/apply',
  authenticateToken,
  requireVerification,
  validateRequest(applyCouponSchema),
  applyCoupon
);

/**
 * @route DELETE /api/coupons/remove
 * @desc Remove coupon from cart
 * @access Private (User)
 */
router.delete(
  '/remove',
  authenticateToken,
  requireVerification,
  removeCoupon
);

/**
 * @route GET /api/coupons/validate/:code
 * @desc Validate coupon code
 * @access Private (User)
 */
router.get(
  '/validate/:code',
  authenticateToken,
  requireVerification,
  validateCoupon
);

/**
 * @route GET /api/coupons/available
 * @desc Get available coupons for user's cart
 * @access Private (User)
 */
router.get(
  '/available',
  authenticateToken,
  requireVerification,
  getAvailableCoupons
);

/**
 * @route GET /api/coupons/public
 * @desc Get all active coupons (Public) - No authentication required
 * @access Public
 */
router.get('/public', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const { couponService } = require('../services/couponService');
    const coupons = await couponService.getAllActiveCoupons();
    
    res.json({
      success: true,
      message: 'Active coupons retrieved successfully',
      data: {
        coupons: coupons.map((coupon: any) => ({
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount,
          maxDiscountAmount: coupon.maxDiscountAmount,
          validUntil: coupon.validUntil
        })),
        count: coupons.length
      }
    });
  } catch (error) {
    next(error);
  }
});


// Admin routes

/**
 * @route POST /api/coupons
 * @desc Create a new coupon
 * @access Private (Admin)
 */
router.post(
  '/',
  authenticateUserOrAdmin,
  validateRequest(createCouponSchema),
  createCoupon
);

/**
 * @route GET /api/coupons
 * @desc Get all coupons with pagination and filters
 * @access Private (Admin)
 */
router.get('/', authenticateUserOrAdmin, getCoupons);

/**
 * @route GET /api/coupons/analytics
 * @desc Get coupon analytics
 * @access Private (Admin)
 */
router.get('/analytics', authenticateUserOrAdmin, getCouponAnalytics);

/**
 * @route POST /api/coupons/bulk
 * @desc Bulk create coupons
 * @access Private (Admin)
 */
router.post(
  '/bulk',
  authenticateUserOrAdmin,
  validateRequest(bulkCreateSchema),
  bulkCreateCoupons
);

/**
 * @route POST /api/coupons/generate-codes
 * @desc Generate coupon codes
 * @access Private (Admin)
 */
router.post(
  '/generate-codes',
  authenticateUserOrAdmin,
  validateRequest(generateCodesSchema),
  generateCouponCodes
);

/**
 * @route GET /api/coupons/:couponId
 * @desc Get coupon by ID
 * @access Private (Admin)
 */
router.get('/:couponId', authenticateUserOrAdmin, getCouponById);

/**
 * @route PUT /api/coupons/:couponId
 * @desc Update coupon
 * @access Private (Admin)
 */
router.put(
  '/:couponId',
  authenticateUserOrAdmin,
  validateRequest(updateCouponSchema),
  updateCoupon
);

/**
 * @route DELETE /api/coupons/:couponId
 * @desc Delete coupon
 * @access Private (Admin)
 */
router.delete('/:couponId', authenticateUserOrAdmin, deleteCoupon);

/**
 * @route PATCH /api/coupons/:couponId/toggle
 * @desc Toggle coupon active status
 * @access Private (Admin)
 */
router.patch('/:couponId/toggle', authenticateUserOrAdmin, toggleCouponStatus);

export default router;