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
import { auth } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { applyDataFilter } from '../middleware/dataFilter';
import { uploadCategoryImage, handleUploadError } from '../middleware/upload';

const router = express.Router();

// Public routes (if needed for frontend display)
router.get('/', getAllCategories);
router.get('/tree', getCategoryTree);
router.get('/level/:level', getCategoriesByLevel);
router.get('/:id', getCategory);
router.get('/:id/path', getCategoryPath);

// Apply authentication and data filtering to all admin routes
router.use(auth);
router.use(applyDataFilter);

// Protected admin routes
router.get('/', requirePermission('categories', 'read'), getAllCategories);
router.get('/tree', requirePermission('categories', 'read'), getCategoryTree);
router.get('/level/:level', requirePermission('categories', 'read'), getCategoriesByLevel);
router.get('/:id', requirePermission('categories', 'read'), getCategory);
router.get('/:id/path', requirePermission('categories', 'read'), getCategoryPath);
router.get('/analytics', requirePermission('analytics', 'read'), getCategoryAnalytics);
router.post('/', requirePermission('categories', 'create'), uploadCategoryImage, handleUploadError, createCategory);
router.get('/:id', requirePermission('categories', 'read'), getCategory);
router.get('/:id/path', requirePermission('categories', 'read'), getCategoryPath);
router.put('/:id', requirePermission('categories', 'edit'), uploadCategoryImage, handleUploadError, updateCategory);
router.patch('/:id/status', requirePermission('categories', 'edit'), toggleCategoryStatus);
router.patch('/bulk-update', requirePermission('categories', 'edit'), bulkUpdateCategories);
router.delete('/:id', requirePermission('categories', 'delete'), deleteCategory);

export default router;