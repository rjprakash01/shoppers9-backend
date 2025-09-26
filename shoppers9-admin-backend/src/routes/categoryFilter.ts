import express from 'express';
import {
  getCategoryFilters,
  assignFilterToCategory,
  updateCategoryFilter,
  removeCategoryFilter,
  bulkAssignFiltersToCategory,
  getAvailableFiltersForCategory,
  autoAssignCategoryFilters,
  getCategoryFilterRecommendations
} from '../controllers/categoryFilterController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Category filter routes
router.get('/categories/:categoryId/filters', auth, getCategoryFilters);
router.post('/categories/:categoryId/filters', auth, assignFilterToCategory);
router.post('/categories/:categoryId/filters/bulk', auth, bulkAssignFiltersToCategory);
router.post('/categories/:categoryId/filters/auto-assign', auth, autoAssignCategoryFilters);
router.get('/categories/:categoryId/filters/recommendations', auth, getCategoryFilterRecommendations);
// Removed: router.get('/categories/:categoryId/available-filters', auth, getAvailableFiltersForCategory);
// This route is now handled by filterAssignmentRoutes with correct logic

// Individual category filter routes
router.put('/category-filters/:id', auth, updateCategoryFilter);
router.delete('/category-filters/:id', auth, removeCategoryFilter);

export default router;