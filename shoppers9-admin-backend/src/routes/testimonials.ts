import express from 'express';
import {
  getTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  verifyTestimonial,
  toggleFeature,
  toggleActive,
  getFeaturedTestimonials,
  getTestimonialsByCategory,
  getTestimonialsByRating,
  getTestimonialsByProduct,
  bulkUpdateTestimonials,
  getTestimonialStats
} from '../controllers/testimonialController';
import { auth, adminOnly } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { applyDataFilter } from '../middleware/dataFilter';

const router = express.Router();

// Public routes (for main website)
router.get('/featured', getFeaturedTestimonials);
router.get('/category/:category', getTestimonialsByCategory);
router.get('/rating', getTestimonialsByRating);
router.get('/product/:productId', getTestimonialsByProduct);

// Admin routes - require authentication, permissions, and data filtering
router.use(auth);
router.use(applyDataFilter);

// CRUD operations
router.get('/', requirePermission('testimonials', 'read'), getTestimonials);
router.post('/', requirePermission('testimonials', 'create'), createTestimonial);
router.get('/stats', requirePermission('testimonials', 'read'), getTestimonialStats);
router.get('/:id', requirePermission('testimonials', 'read'), getTestimonialById);
router.put('/:id', requirePermission('testimonials', 'edit'), updateTestimonial);
router.delete('/:id', requirePermission('testimonials', 'delete'), deleteTestimonial);

// Status management
router.patch('/:id/verify', requirePermission('testimonials', 'edit'), verifyTestimonial);
router.patch('/:id/toggle-feature', requirePermission('testimonials', 'edit'), toggleFeature);
router.patch('/:id/toggle-active', requirePermission('testimonials', 'edit'), toggleActive);

// Bulk operations
router.patch('/bulk/update', requirePermission('testimonials', 'edit'), bulkUpdateTestimonials);

export default router;