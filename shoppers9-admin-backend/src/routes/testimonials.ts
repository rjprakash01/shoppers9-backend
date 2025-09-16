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

const router = express.Router();

// Public routes (for main website)
router.get('/featured', getFeaturedTestimonials);
router.get('/category/:category', getTestimonialsByCategory);
router.get('/rating', getTestimonialsByRating);
router.get('/product/:productId', getTestimonialsByProduct);

// Admin routes - require authentication
router.use(auth);
router.use(adminOnly);

// CRUD operations
router.get('/', getTestimonials);
router.post('/', createTestimonial);
router.get('/stats', getTestimonialStats);
router.get('/:id', getTestimonialById);
router.put('/:id', updateTestimonial);
router.delete('/:id', deleteTestimonial);

// Special actions
router.patch('/:id/verify', verifyTestimonial);
router.patch('/:id/toggle-feature', toggleFeature);
router.patch('/:id/toggle-active', toggleActive);

// Bulk operations
router.patch('/bulk/update', bulkUpdateTestimonials);

export default router;