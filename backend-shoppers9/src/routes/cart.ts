import express from 'express';
import { cartController } from '../controllers/cartController';
import { validateBody, validateParams } from '../middleware/validation';
import { authenticateToken, requireVerification } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const addToCartSchema = Joi.object({
  product: Joi.string().required(),
  variantId: Joi.string().required(),
  size: Joi.string().optional(),
  quantity: Joi.number().integer().min(1).default(1)
});

const updateQuantitySchema = Joi.object({
  quantity: Joi.number().integer().min(1).required()
});

const cartItemParamsSchema = Joi.object({
  itemId: Joi.string().required()
});

const moveToWishlistSchema = Joi.object({
  itemId: Joi.string().required()
});

const applyCouponSchema = Joi.object({
  couponCode: Joi.string().trim().required()
});

// All cart routes require authentication
router.use(authenticateToken);
router.use(requireVerification);

/**
 * @route GET /cart
 * @desc Get user's cart
 * @access Private
 */
router.get('/',
  asyncHandler(cartController.getCart)
);

/**
 * @route POST /cart/add
 * @desc Add item to cart
 * @access Private
 */
router.post('/add',
  validateBody(addToCartSchema),
  asyncHandler(cartController.addToCart)
);

/**
 * @route PUT /cart/item/:itemId/quantity
 * @desc Update item quantity in cart
 * @access Private
 */
router.put('/item/:itemId/quantity',
  validateParams(cartItemParamsSchema),
  validateBody(updateQuantitySchema),
  asyncHandler(cartController.updateQuantity)
);

/**
 * @route DELETE /cart/item/:itemId
 * @desc Remove item from cart
 * @access Private
 */
router.delete('/item/:itemId',
  validateParams(cartItemParamsSchema),
  asyncHandler(cartController.removeFromCart)
);

/**
 * @route POST /cart/item/:itemId/move-to-wishlist
 * @desc Move item from cart to wishlist
 * @access Private
 */
router.post('/item/:itemId/move-to-wishlist',
  validateParams(cartItemParamsSchema),
  asyncHandler(cartController.moveToWishlist)
);

/**
 * @route DELETE /cart/clear
 * @desc Clear all items from cart
 * @access Private
 */
router.delete('/clear',
  asyncHandler(cartController.clearCart)
);

// /**
//  * @route POST /cart/clean
//  * @desc Clean cart by removing items with invalid pricing
//  * @access Private
//  */
// router.post('/clean',
//   asyncHandler(cartController.cleanCart)
// );

/**
 * @route POST /cart/coupon/apply
 * @desc Apply coupon to cart
 * @access Private
 */
router.post('/coupon/apply',
  validateBody(applyCouponSchema),
  asyncHandler(cartController.applyCoupon)
);

/**
 * @route DELETE /cart/coupon/remove
 * @desc Remove coupon from cart
 * @access Private
 */
router.delete('/coupon/remove',
  asyncHandler(cartController.removeCoupon)
);

/**
 * @route GET /cart/summary
 * @desc Get cart summary for checkout
 * @access Private
 */
router.get('/summary',
  asyncHandler(cartController.getCartSummary)
);

export default router;