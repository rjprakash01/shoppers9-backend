import express from 'express';
import {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getProductAnalytics,
  bulkUpdateProducts,
  getProductFilters,
  getProductFilterValues,
  setProductFilterValues,
  getAvailableFilterOptionsForCategory,
  submitProductForReview,
  approveProduct,
  rejectProduct,
  requestProductChanges,
  getReviewQueue,
  bulkReviewAction
} from '../controllers/productController';
import { auth } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { requireRole } from '../middleware/rbac';
import { applyDataFilter, checkResourceAccess, enforceOwnership } from '../middleware/dataFilter';
import { uploadProductImages, handleUploadError } from '../middleware/upload';

const router = express.Router();

// Apply authentication and data filtering to all routes
router.use(auth);
router.use(applyDataFilter);

router.route('/')
  .get(requirePermission('products', 'read'), getAllProducts)
  .post(requirePermission('products', 'create_assets'), enforceOwnership, uploadProductImages, handleUploadError, createProduct);

router.route('/analytics')
  .get(requirePermission('analytics', 'read'), getProductAnalytics);

router.route('/export')
  .get(requirePermission('products', 'export'), getAllProducts); // Temporary placeholder - implement exportProducts in controller

router.route('/bulk-update')
  .put(requirePermission('products', 'edit'), bulkUpdateProducts);

// Product Review Workflow Routes (must be before parameterized routes)
router.get('/review-queue', requirePermission('product_review_queue', 'read'), getReviewQueue);
router.post('/bulk-review-action', requirePermission('product_review_queue', 'edit'), bulkReviewAction);

// Get products by category
router.route('/category/:categoryId')
  .get(requirePermission('products', 'read'), (req, res) => {
    // This is a placeholder - the actual implementation should be in the controller
    res.json({ message: 'Get products by category endpoint' });
  });

// Category filter options
router.get('/category/:categoryId/available-filter-options', requirePermission('categories', 'read'), getAvailableFilterOptionsForCategory);

router.route('/:id')
  .get(requirePermission('products', 'read'), checkResourceAccess('Product'), getProduct)
  .put(requirePermission('products', 'edit'), checkResourceAccess('Product'), uploadProductImages, handleUploadError, updateProduct)
  .delete(requirePermission('products', 'delete'), checkResourceAccess('Product'), deleteProduct);

router.put('/:id/toggle-status', requirePermission('products', 'edit'), toggleProductStatus);

// Filter management routes
router.get('/:id/filters', requirePermission('filters', 'read'), getProductFilters);
router.get('/:id/filter-values', requirePermission('filters', 'read'), getProductFilterValues);
router.post('/:id/filter-values', requirePermission('filters', 'create'), setProductFilterValues);

// Product Review Workflow Routes for specific products
router.post('/:id/submit-for-review', requirePermission('products'), checkResourceAccess('Product'), submitProductForReview);
router.patch('/:id/approve', requirePermission('product_review_queue', 'edit'), approveProduct);
router.patch('/:id/reject', requirePermission('product_review_queue', 'edit'), rejectProduct);
router.patch('/:id/request-changes', requirePermission('product_review_queue', 'edit'), requestProductChanges);

export default router;