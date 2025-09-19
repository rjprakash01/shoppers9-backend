import express from 'express';
import {
  getAllOrders,
  getOrder,
  updateOrderStatus,
  getOrderAnalytics,
  exportOrders,
  bulkUpdateOrders,
  fixOrderAmounts
} from '../controllers/orderController';
import { auth } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { applyDataFilter } from '../middleware/dataFilter';

const router = express.Router();

// Test endpoint (no auth required)
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Test endpoint working' });
});

// Fix order amounts (temporary endpoint - no auth required)
router.post('/fix-amounts', fixOrderAmounts);

// All other routes require authentication and data filtering
router.use(auth);
router.use(applyDataFilter);

// Get all orders with pagination, search, filter, sort
router.get('/', getAllOrders);

// Test route with permissions (original)
router.get('/with-permissions', requirePermission('orders', 'read'), getAllOrders);

// Get order analytics
router.get('/analytics', requirePermission('analytics', 'read'), getOrderAnalytics);

// Export orders
router.get('/export', requirePermission('orders', 'export'), exportOrders);

// Bulk update orders
router.patch('/bulk-update', requirePermission('orders', 'edit'), bulkUpdateOrders);

// Get single order by ID
router.get('/:id', requirePermission('orders', 'read'), getOrder);

// Update order status
router.patch('/:id/status', requirePermission('orders', 'edit'), updateOrderStatus);

export default router;