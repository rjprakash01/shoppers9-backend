import express from 'express';
import {
  getInventoryOverview,
  getLowStockAlerts,
  getDetailedInventory,
  updateVariantStock,
  bulkUpdateStock,
  getStockHistory,
  checkStockAvailability,
  getReorderSuggestions
} from '../controllers/inventoryController';
import { authenticateUserOrAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const updateStockSchema = Joi.object({
  stock: Joi.number().min(0).required(),
  operation: Joi.string().valid('set', 'increase', 'decrease').default('set'),
  reason: Joi.string().optional()
});

const bulkUpdateSchema = Joi.object({
  updates: Joi.array().items(
    Joi.object({
      sku: Joi.string().required(),
      newStock: Joi.number().min(0).required(),
      reason: Joi.string().optional()
    })
  ).min(1).required()
});

const checkStockSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      variantId: Joi.string().required(),
      quantity: Joi.number().min(1).required()
    })
  ).min(1).required()
});

// Routes

/**
 * @route GET /api/inventory/overview
 * @desc Get inventory overview and statistics
 * @access Admin
 */
router.get('/overview', authenticateUserOrAdmin, getInventoryOverview);

/**
 * @route GET /api/inventory/alerts
 * @desc Get low stock alerts
 * @access Admin
 */
router.get('/alerts', authenticateUserOrAdmin, getLowStockAlerts);

/**
 * @route GET /api/inventory/detailed
 * @desc Get detailed inventory for all products
 * @access Admin
 * @query page, limit, search, category, stockStatus
 */
router.get('/detailed', authenticateUserOrAdmin, getDetailedInventory);

/**
 * @route PUT /api/inventory/products/:productId/variants/:variantId/stock
 * @desc Update stock for a specific variant
 * @access Admin
 */
router.put(
  '/products/:productId/variants/:variantId/stock',
  authenticateUserOrAdmin,
  validateRequest(updateStockSchema),
  updateVariantStock
);

/**
 * @route POST /api/inventory/bulk-update
 * @desc Bulk update stock from CSV or form data
 * @access Admin
 */
router.post(
  '/bulk-update',
  authenticateUserOrAdmin,
  validateRequest(bulkUpdateSchema),
  bulkUpdateStock
);

/**
 * @route GET /api/inventory/products/:productId/variants/:variantId/history
 * @desc Get stock history for a product variant
 * @access Admin
 */
router.get(
  '/products/:productId/variants/:variantId/history',
  authenticateUserOrAdmin,
  getStockHistory
);

/**
 * @route POST /api/inventory/check-stock
 * @desc Check stock availability for multiple items
 * @access Admin/Public
 */
router.post(
  '/check-stock',
  validateRequest(checkStockSchema),
  checkStockAvailability
);

/**
 * @route GET /api/inventory/reorder-suggestions
 * @desc Get products with low stock for reorder suggestions
 * @access Admin
 * @query threshold
 */
router.get('/reorder-suggestions', authenticateUserOrAdmin, getReorderSuggestions);

export default router;