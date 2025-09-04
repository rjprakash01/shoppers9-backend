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
import { auth, adminOnly } from '../middleware/auth';
import { uploadProductImages, handleUploadError } from '../middleware/upload';

const router = express.Router();

// All routes are protected
router.use(auth);

router.route('/')
  .get(getAllProducts)
  .post(uploadProductImages, handleUploadError, createProduct);

router.route('/analytics')
  .get(getProductAnalytics);

router.route('/export')
  .get(getAllProducts); // Temporary placeholder - implement exportProducts in controller

router.route('/bulk-update')
  .put(bulkUpdateProducts);

// Get products by category
router.route('/category/:categoryId')
  .get((req, res) => {
    // Set the category parameter from the URL and call getAllProducts
    req.query.category = req.params.categoryId;
    getAllProducts(req, res);
  });

router.route('/:id')
  .get(getProduct)
  .put(uploadProductImages, handleUploadError, updateProduct)
  .delete(deleteProduct);

router.put('/:id/toggle-status', toggleProductStatus);

// Filter-related routes
router.get('/:id/filters', getProductFilters);
router.get('/:id/filter-values', getProductFilterValues);
router.post('/:id/filter-values', setProductFilterValues);

// Get available filter options for a category based on existing products
router.get('/category/:categoryId/available-filter-options', getAvailableFilterOptionsForCategory);

export default router;