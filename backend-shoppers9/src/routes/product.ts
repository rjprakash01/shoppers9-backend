import express from 'express';
import { productController } from '../controllers/productController';
import { validateQuery, validateParams } from '../middleware/validation';
import { optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';

const router = express.Router();

// Debug route to test if product routes are loading
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Product routes are working!', route: '/api/products/test' });
});

// Validation schemas
const getProductsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  category: Joi.string().trim().optional(),
  subCategory: Joi.string().trim().optional(),
  brand: Joi.string().trim().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  sizes: Joi.string().optional(), // Comma-separated sizes
  colors: Joi.string().optional(), // Comma-separated colors
  fabric: Joi.string().trim().optional(),
  fit: Joi.string().trim().optional(),
  material: Joi.string().trim().optional(),
  microwaveSafe: Joi.boolean().optional(),
  inStock: Joi.boolean().optional(),
  sortBy: Joi.string().valid('price', 'name', 'createdAt', 'popularity').default('popularity'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().trim().optional()
});

const productIdSchema = Joi.object({
  productId: Joi.string().required()
});

const searchSchema = Joi.object({
  q: Joi.string().trim().min(2).required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  category: Joi.string().trim().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional()
});

// Routes

/**
 * @route GET /products
 * @desc Get products with filters and pagination
 * @access Public
 */
router.get('/',
  optionalAuth,
  validateQuery(getProductsSchema),
  asyncHandler(productController.getProducts)
);

/**
 * @route GET /products/search
 * @desc Search products
 * @access Public
 */
router.get('/search',
  optionalAuth,
  validateQuery(searchSchema),
  asyncHandler(productController.searchProducts)
);

/**
 * @route GET /products/categories
 * @desc Get all product categories
 * @access Public
 */
router.get('/categories',
  asyncHandler(productController.getCategories)
);



/**
 * @route GET /products/filters
 * @desc Get available filters for products
 * @access Public
 */
router.get('/filters',
  asyncHandler(productController.getFilters)
);

/**
 * @route GET /products/featured
 * @desc Get featured products
 * @access Public
 */
router.get('/featured',
  optionalAuth,
  asyncHandler(productController.getFeaturedProducts)
);

/**
 * @route GET /products/trending
 * @desc Get trending products
 * @access Public
 */
router.get('/trending',
  optionalAuth,
  asyncHandler(productController.getTrendingProducts)
);

/**
 * @route GET /products/recommendations
 * @desc Get product recommendations for user
 * @access Public
 */
router.get('/recommendations',
  optionalAuth,
  asyncHandler(productController.getRecommendations)
);

/**
 * @route GET /products/:productId
 * @desc Get product details by ID
 * @access Public
 */
router.get('/:productId',
  optionalAuth,
  validateParams(productIdSchema),
  asyncHandler(productController.getProductById)
);

/**
 * @route GET /products/:productId/related
 * @desc Get related products
 * @access Public
 */
router.get('/:productId/related',
  optionalAuth,
  validateParams(productIdSchema),
  asyncHandler(productController.getRelatedProducts)
);

/**
 * @route GET /products/:productId/reviews
 * @desc Get product reviews
 * @access Public
 */
router.get('/:productId/reviews',
  validateParams(productIdSchema),
  asyncHandler(productController.getProductReviews)
);

export default router;