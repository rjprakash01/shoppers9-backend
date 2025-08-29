import express from 'express';
import {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getCategoryAnalytics,
  bulkUpdateCategories
} from '../controllers/categoryController';
import { auth, adminOnly } from '../middleware/auth';
import { uploadCategoryImage, handleUploadError } from '../middleware/upload';

const router = express.Router();

// Public routes (if needed for frontend display)
router.get('/', getAllCategories);
router.get('/analytics', auth, adminOnly, getCategoryAnalytics);
router.get('/:id', getCategory);

// Protected routes - require authentication and admin privileges
router.post('/', auth, adminOnly, uploadCategoryImage, handleUploadError, createCategory);
router.put('/:id', auth, adminOnly, uploadCategoryImage, handleUploadError, updateCategory);
router.patch('/:id/status', auth, adminOnly, toggleCategoryStatus);
router.patch('/bulk-update', auth, adminOnly, bulkUpdateCategories);
router.delete('/:id', auth, adminOnly, deleteCategory);

export default router;