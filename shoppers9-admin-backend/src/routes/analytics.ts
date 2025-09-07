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

const router = express.Router();

// All routes require authentication only
router.use(auth);

// Dashboard overview stats
router.get('/dashboard', getDashboardStats);

// Sales analytics
router.get('/sales', getSalesAnalytics);

// User analytics
router.get('/users', getUserAnalytics);

// Product analytics
router.get('/products', getProductAnalytics);

// Revenue analytics
router.get('/revenue', getRevenueAnalytics);

// Traffic analytics
router.get('/traffic', getTrafficAnalytics);

export default router;