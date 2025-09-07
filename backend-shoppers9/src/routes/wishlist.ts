import express from 'express';
import { wishlistController } from '../controllers/wishlistController';
import { validateBody, validateParams } from '../middleware/validation';
import { authenticateToken, requireVerification } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const addToWishlistSchema = Joi.object({
  product: Joi.string().required(),
  variantId: Joi.string().optional()
});

const wishlistItemParamsSchema = Joi.object({
  productId: Joi.string().required()
});

const moveToCartSchema = Joi.object({
  size: Joi.string().optional(),
  quantity: Joi.number().integer().min(1).default(1)
});

// All wishlist routes require authentication
router.use(authenticateToken);
router.use(requireVerification);

/**
 * @route GET /wishlist
 * @desc Get user's wishlist
 * @access Private
 */
router.get('/',
  asyncHandler(wishlistController.getWishlist)
);

/**
 * @route POST /wishlist/add
 * @desc Add item to wishlist
 * @access Private
 */
router.post('/add',
  validateBody(addToWishlistSchema),
  asyncHandler(wishlistController.addToWishlist)
);

/**
 * @route DELETE /wishlist/:productId
 * @desc Remove item from wishlist
 * @access Private
 */
router.delete('/:productId',
  validateParams(wishlistItemParamsSchema),
  asyncHandler(wishlistController.removeFromWishlist)
);

/**
 * @route POST /wishlist/:productId/move-to-cart
 * @desc Move item from wishlist to cart
 * @access Private
 */
router.post('/:productId/move-to-cart',
  validateParams(wishlistItemParamsSchema),
  validateBody(moveToCartSchema),
  asyncHandler(wishlistController.moveToCart)
);

/**
 * @route DELETE /wishlist/clear
 * @desc Clear all items from wishlist
 * @access Private
 */
router.delete('/clear',
  asyncHandler(wishlistController.clearWishlist)
);

/**
 * @route GET /wishlist/check/:productId
 * @desc Check if product is in wishlist
 * @access Private
 */
router.get('/check/:productId',
  validateParams(wishlistItemParamsSchema),
  asyncHandler(wishlistController.checkInWishlist)
);

export default router;