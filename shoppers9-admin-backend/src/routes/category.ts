import express from 'express';
import {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getCategoryAnalytics,
  bulkUpdateCategories,
  getCategoriesByLevel,
  getCategoryTree,
  getCategoryPath
} from '../controllers/categoryController';
import { auth, adminOnly } from '../middleware/auth';
import { uploadCategoryImage, handleUploadError } from '../middleware/upload';

const router = express.Router();

// Public routes (if needed for frontend display)
router.get('/', getAllCategories);
router.get('/tree', getCategoryTree);
router.get('/level/:level', getCategoriesByLevel);
router.get('/analytics', auth, getCategoryAnalytics);
router.get('/:id', getCategory);
router.get('/:id/path', getCategoryPath);

// Protected routes - require authentication only
router.post('/', auth, uploadCategoryImage, handleUploadError, createCategory);
router.put('/:id', auth, uploadCategoryImage, handleUploadError, updateCategory);
router.patch('/:id/status', auth, toggleCategoryStatus);
router.patch('/bulk-update', auth, bulkUpdateCategories);
router.delete('/:id', auth, deleteCategory);

export default router;