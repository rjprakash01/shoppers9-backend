import { Router } from 'express';
import {
  getAllCategories,
  getCategoryTree,
  getCategory,
  getCategoriesByLevel,
  getCategoryPath,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus
} from '../controllers/categoryController';
import { authenticateToken, authenticateUserOrAdmin } from '../middleware/auth';

const router = Router();

// Public routes (no authentication required)
router.get('/tree', getCategoryTree);
router.get('/level/:level', getCategoriesByLevel);
router.get('/path/:id', getCategoryPath);
router.get('/:id', getCategory);
router.get('/', getAllCategories);

// Protected routes (admin authentication required)
router.post('/', authenticateUserOrAdmin, createCategory);
router.put('/:id', authenticateUserOrAdmin, updateCategory);
router.delete('/:id', authenticateUserOrAdmin, deleteCategory);
router.patch('/:id/toggle-status', authenticateUserOrAdmin, toggleCategoryStatus);

export default router;