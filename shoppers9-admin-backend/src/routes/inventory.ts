import express from 'express';
import {
  getInventoryReport,
  getLowStockAlerts,
  getDetailedInventory,
  updateVariantStock,
  getReorderSuggestions
} from '../controllers/inventoryController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Routes

/**
 * @route GET /api/admin/inventory/report
 * @desc Get inventory overview report
 * @access Admin
 */
router.get('/report', auth, getInventoryReport);

/**
 * @route GET /api/admin/inventory/alerts
 * @desc Get low stock alerts (includes out of stock items)
 * @access Admin
 */
router.get('/alerts', auth, getLowStockAlerts);

/**
 * @route GET /api/admin/inventory/detailed
 * @desc Get detailed inventory with pagination and filters (includes out of stock items)
 * @access Admin
 */
router.get('/detailed', auth, getDetailedInventory);

/**
 * @route PUT /api/admin/inventory/products/:productId/variants/:variantId/stock
 * @desc Update stock for a specific variant
 * @access Admin
 */
router.put('/products/:productId/variants/:variantId/stock', auth, updateVariantStock);

/**
 * @route GET /api/admin/inventory/reorder-suggestions
 * @desc Get reorder suggestions for low stock items
 * @access Admin
 */
router.get('/reorder-suggestions', auth, getReorderSuggestions);

export default router;