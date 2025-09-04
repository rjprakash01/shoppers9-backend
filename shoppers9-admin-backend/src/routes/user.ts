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
import { adminOnly } from '../middleware/auth';

const router = express.Router();

// All routes require authentication only
router.use(auth);

// Get all users with pagination, search, filter, sort
router.get('/', getAllUsers);

// Get user analytics
router.get('/analytics', getUserAnalytics);

// Export users
router.get('/export', exportUsers);

// Get single user by ID
router.get('/:id', getUser);

// Update user
router.put('/:id', updateUser);

// Delete user
router.delete('/:id', deleteUser);

// Toggle user status (active/inactive)
router.patch('/:id/toggle-status', toggleUserStatus);

export default router;