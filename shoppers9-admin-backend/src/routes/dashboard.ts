import express from 'express';
import { getDashboardAnalytics } from '../controllers/dashboardController';
import { auth } from '../middleware/auth';
import { applyDataFilter } from '../middleware/dataFilter';
import { requirePermission } from '../middleware/permission';

const router = express.Router();

// Apply authentication and data filtering to all routes
router.use(auth);
router.use(applyDataFilter);

// Dashboard analytics endpoint - role-based data
router.get('/analytics', getDashboardAnalytics);

// Legacy endpoint for backward compatibility
router.get('/', getDashboardAnalytics);

// Test routes with permissions (original)
router.get('/analytics-with-permissions', requirePermission('dashboard', 'read'), getDashboardAnalytics);
router.get('/with-permissions', requirePermission('dashboard', 'read'), getDashboardAnalytics);

export default router;