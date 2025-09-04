import express from 'express';
import {
  getAllFilters,
  getFilterById,
  createFilter,
  updateFilter,
  deleteFilter,
  toggleFilterStatus
} from '../controllers/filterController';
import {
  getFilterOptions,
  getFilterOptionById,
  createFilterOption,
  updateFilterOption,
  deleteFilterOption,
  toggleFilterOptionStatus,
  bulkCreateFilterOptions
} from '../controllers/filterOptionController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Public filter routes (for frontend access)
router.get('/', getAllFilters);

// Protected filter routes
router.get('/admin', auth, getAllFilters);
router.get('/:id', auth, getFilterById);
router.post('/', auth, createFilter);
router.put('/:id', auth, updateFilter);
router.delete('/:id', auth, deleteFilter);
router.put('/:id/toggle-status', auth, toggleFilterStatus);

// Filter options routes
router.get('/:filterId/options', auth, getFilterOptions);
router.post('/:filterId/options', auth, createFilterOption);
router.post('/:filterId/options/bulk', auth, bulkCreateFilterOptions);

// Individual filter option routes
router.get('/options/:id', auth, getFilterOptionById);
router.put('/options/:id', auth, updateFilterOption);
router.delete('/options/:id', auth, deleteFilterOption);
router.put('/options/:id/toggle-status', auth, toggleFilterOptionStatus);

export default router;