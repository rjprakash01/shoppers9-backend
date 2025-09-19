import express from 'express';
import {
  getInventoryReport,
  getLowStockAlerts,
  getDetailedInventory,
  updateVariantStock,
  getReorderSuggestions
} from '../controllers/inventoryController';
import { auth } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { applyDataFilter } from '../middleware/dataFilter';

const router = express.Router();

// Apply authentication and data filtering to all routes
router.use(auth);
router.use(applyDataFilter);

// Routes

/**
 * @route GET /api/admin/inventory/report
 * @desc Get inventory overview report
 * @access Admin
 */
router.get('/report', requirePermission('inventory', 'read'), getInventoryReport);

/**
 * @route GET /api/admin/inventory/alerts
 * @desc Get low stock alerts (includes out of stock items)
 * @access Admin
 */
router.get('/alerts', requirePermission('inventory', 'read'), getLowStockAlerts);

/**
 * @route GET /api/admin/inventory/detailed
 * @desc Get detailed inventory with pagination and filters (includes out of stock items)
 * @access Admin
 */
router.get('/detailed', requirePermission('inventory', 'read'), getDetailedInventory);

/**
 * @route PUT /api/admin/inventory/products/:productId/variants/:variantId/stock
 * @desc Update stock for a specific variant
 * @access Admin
 */
router.put('/products/:productId/variants/:variantId/stock', requirePermission('inventory', 'edit'), updateVariantStock);

/**
 * @route GET /api/admin/inventory/reorder-suggestions
 * @desc Get reorder suggestions based on sales velocity and current stock
 * @access Admin
 */
router.get('/reorder-suggestions', requirePermission('inventory', 'read'), getReorderSuggestions);

export default router;