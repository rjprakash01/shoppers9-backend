import express from 'express';
import {
  getFilterAssignments,
  getAvailableFilters,
  assignFilter,
  updateFilterAssignment,
  removeFilterAssignment,
  bulkAssignFilters,
  getFilterTree
} from '../controllers/filterAssignmentController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  console.log('🧪 Test route called');
  res.json({ success: true, message: 'Filter assignment router is working' });
});

// Category-based filter assignment routes
router.get('/categories/:categoryId/filter-assignments', auth, getFilterAssignments);
router.get('/categories/:categoryId/available-filters', auth, (req, res) => {
  console.log('🔍 Available filters route matched! CategoryId:', req.params.categoryId);
  console.log('🔍 Request URL:', req.url);
  console.log('🔍 Request method:', req.method);
  getAvailableFilters(req, res);
});
router.post('/categories/:categoryId/filter-assignments', auth, assignFilter);
router.post('/categories/:categoryId/filter-assignments/bulk', auth, bulkAssignFilters);
router.get('/categories/:categoryId/filter-tree', auth, getFilterTree);

// Individual filter assignment routes
router.put('/filter-assignments/:id', auth, updateFilterAssignment);
router.delete('/filter-assignments/:id', auth, removeFilterAssignment);

export default router;