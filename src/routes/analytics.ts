import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getDashboardStats, getSalesAnalytics } from '../controllers/adminController';

const router = express.Router();

// Middleware to check admin access
// TODO: Implement proper admin authentication
// For now, we'll use basic authentication - in production, add proper admin role checking
const requireAdmin = (req: any, res: any, next: any) => {
  // This is a placeholder - implement proper admin role checking
  // For now, any authenticated user can access admin routes (not recommended for production)
  next();
};

// Dashboard analytics - matches the frontend expectation
router.get('/dashboard', authenticateToken, requireAdmin, getDashboardStats);

// Sales analytics
router.get('/sales', authenticateToken, requireAdmin, getSalesAnalytics);

export default router;