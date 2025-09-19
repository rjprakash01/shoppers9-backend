import express from 'express';
import {
  getDashboardStats,
  getSalesAnalytics,
  getUserAnalytics,
  getProductAnalytics,
  getRevenueAnalytics,
  getTrafficAnalytics
} from '../controllers/analyticsController';
import { auth, adminOnly } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { applyDataFilter } from '../middleware/dataFilter';

const router = express.Router();

// Apply authentication and data filtering to all routes
router.use(auth);
router.use(applyDataFilter);

// Dashboard overview stats
router.get('/dashboard', requirePermission('analytics', 'read'), getDashboardStats);

// Sales analytics
router.get('/sales', requirePermission('analytics', 'read'), getSalesAnalytics);

// User analytics
router.get('/users', requirePermission('analytics', 'read'), getUserAnalytics);

// Product analytics
router.get('/products', requirePermission('analytics', 'read'), getProductAnalytics);

// Revenue analytics
router.get('/revenue', requirePermission('analytics', 'read'), getRevenueAnalytics);

// Traffic analytics
router.get('/traffic', requirePermission('analytics', 'read'), getTrafficAnalytics);

export default router;