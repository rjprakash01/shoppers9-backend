import express from 'express';
import {
  getAllOrders,
  getOrder,
  updateOrderStatus,
  getOrderAnalytics,
  exportOrders,
  bulkUpdateOrders
} from '../controllers/orderController';
import { auth, adminOnly } from '../middleware/auth';

const router = express.Router();

// All routes require authentication only
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