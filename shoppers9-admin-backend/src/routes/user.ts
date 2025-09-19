import express from 'express';
import {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserAnalytics,
  exportUsers
} from '../controllers/userController';
import { auth } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { applyDataFilter } from '../middleware/dataFilter';

const router = express.Router();

// All routes require authentication and data filtering
router.use(auth);
router.use(applyDataFilter);

// Get all users with pagination, search, filter, sort
router.get('/', requirePermission('users', 'read'), getAllUsers);

// Get user analytics
router.get('/analytics', requirePermission('analytics', 'read'), getUserAnalytics);

// Export users
router.get('/export', requirePermission('users', 'export'), exportUsers);

// Get single user by ID
router.get('/:id', requirePermission('users', 'read'), getUser);

// Update user
router.put('/:id', requirePermission('users', 'edit'), updateUser);

// Delete user
router.delete('/:id', requirePermission('users', 'delete'), deleteUser);

// Toggle user status (active/inactive)
router.patch('/:id/toggle-status', requirePermission('users', 'edit'), toggleUserStatus);

export default router;