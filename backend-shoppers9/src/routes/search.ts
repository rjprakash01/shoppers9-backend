import express from 'express';
import { searchController } from '../controllers/searchController';
import { validateRequest } from '../middleware/validation';
import { query } from 'express-validator';

const router = express.Router();

// Validation rules
const searchValidation = [
  query('search').optional().isLength({ min: 1, max: 100 }).trim(),
  query('category').optional().isLength({ min: 1, max: 50 }).trim(),
  query('subcategory').optional().isLength({ min: 1, max: 50 }).trim(),
  query('subsubcategory').optional().isLength({ min: 1, max: 50 }).trim(),
  query('brand').optional().isLength({ min: 1, max: 50 }).trim(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('inStock').optional().isBoolean(),
  query('rating').optional().isFloat({ min: 1, max: 5 }),
  query('sortBy').optional().isIn(['relevance', 'price_low', 'price_high', 'newest', 'rating', 'popularity']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('includeAggregations').optional().isBoolean()
];

const autocompleteValidation = [
  query('q').optional().isLength({ min: 1, max: 100 }).trim(),
  query('limit').optional().isInt({ min: 1, max: 20 })
];

const suggestionsValidation = [
  query('q').isLength({ min: 1, max: 100 }).trim()
];

// Routes

// @desc    Enhanced search with filters and aggregations
// @route   GET /api/search
// @access  Public
router.get('/', searchValidation, validateRequest, searchController.enhancedSearch);

// @desc    Autocomplete search suggestions
// @route   GET /api/search/autocomplete
// @access  Public
router.get('/autocomplete', autocompleteValidation, validateRequest, searchController.autocomplete);

// @desc    Get search suggestions
// @route   GET /api/search/suggestions
// @access  Public
router.get('/suggestions', suggestionsValidation, validateRequest, searchController.getSearchSuggestions);

// @desc    Get trending searches
// @route   GET /api/search/trending
// @access  Public
router.get('/trending', searchController.getTrendingSearches);

// @desc    Get popular searches
// @route   GET /api/search/popular
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const popularSearches = [
      'T-shirts',
      'Jeans',
      'Sneakers',
      'Dresses',
      'Jackets',
      'Accessories',
      'Shoes',
      'Bags',
      'Watches',
      'Sunglasses'
    ];
    
    res.json({
      success: true,
      data: { searches: popularSearches }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get popular searches',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;