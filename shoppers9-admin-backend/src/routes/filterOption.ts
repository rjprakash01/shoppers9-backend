import express from 'express';
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

// Filter options routes
// GET /api/admin/filter-options/filter/:filterId
router.get('/filter/:filterId', auth, getFilterOptions);

// POST /api/admin/filter-options
router.post('/', auth, createFilterOption);

// Individual filter option routes
// GET /api/admin/filter-options/:id
router.get('/:id', auth, getFilterOptionById);

// PUT /api/admin/filter-options/:id
router.put('/:id', auth, updateFilterOption);

// DELETE /api/admin/filter-options/:id
router.delete('/:id', auth, deleteFilterOption);

// PUT /api/admin/filter-options/:id/toggle-status
router.put('/:id/toggle-status', auth, toggleFilterOptionStatus);

// POST /api/admin/filter-options/bulk
router.post('/bulk', auth, async (req, res) => {
  const { filterId, options } = req.body;
  req.params.filterId = filterId;
  req.body = { options };
  await bulkCreateFilterOptions(req as any, res);
});

export default router;