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
  getAvailableFilterOptionsForCategory
} from '../controllers/productController';
import { auth } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
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

// Get products by category
router.route('/category/:categoryId')
  .get(requirePermission('products', 'read'), (req, res) => {
    // Set the category parameter from the URL and call getAllProducts
    req.query.category = req.params.categoryId;
    getAllProducts(req, res);
  });

router.route('/:id')
  .get(requirePermission('products', 'read'), checkResourceAccess('Product'), getProduct)
  .put(requirePermission('products', 'edit'), checkResourceAccess('Product'), uploadProductImages, handleUploadError, updateProduct)
  .delete(requirePermission('products', 'delete'), checkResourceAccess('Product'), deleteProduct);

router.put('/:id/toggle-status', requirePermission('products', 'edit'), toggleProductStatus);

// Filter-related routes
router.get('/:id/filters', requirePermission('filters', 'read'), getProductFilters);
router.get('/:id/filter-values', requirePermission('filters', 'read'), getProductFilterValues);
router.post('/:id/filter-values', requirePermission('filters', 'create'), setProductFilterValues);

// Get available filter options for a category based on existing products
router.get('/category/:categoryId/available-filter-options', requirePermission('categories', 'read'), getAvailableFilterOptionsForCategory);

export default router;