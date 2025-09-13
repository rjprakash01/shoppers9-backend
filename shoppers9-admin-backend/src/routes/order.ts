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
import { auth, adminOnly } from '../middleware/auth';

const router = express.Router();

// Test endpoint (no auth required)
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Test endpoint working' });
});

// Fix order amounts (temporary endpoint - no auth required)
router.post('/fix-amounts', fixOrderAmounts);

// All other routes require authentication
router.use(auth);

// Get all orders with pagination, search, filter, sort
router.get('/', getAllOrders);

// Get order analytics
router.get('/analytics', getOrderAnalytics);

// Export orders
router.get('/export', exportOrders);

// Bulk update orders
router.patch('/bulk-update', bulkUpdateOrders);

// Get single order by ID
router.get('/:id', getOrder);

// Update order status
router.patch('/:id/status', updateOrderStatus);

export default router;