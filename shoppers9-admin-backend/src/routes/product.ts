import express from 'express';
import {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getProductAnalytics,
  bulkUpdateProducts
} from '../controllers/productController';
import { auth, adminOnly } from '../middleware/auth';
import { uploadProductImages, handleUploadError } from '../middleware/upload';

const router = express.Router();

// All routes are protected
router.use(auth);

router.route('/')
  .get(getAllProducts)
  .post(adminOnly, uploadProductImages, handleUploadError, createProduct);

router.route('/analytics')
  .get(getProductAnalytics);

router.route('/export')
  .get(getAllProducts); // Temporary placeholder - implement exportProducts in controller

router.route('/bulk-update')
  .put(adminOnly, bulkUpdateProducts);

router.route('/:id')
  .get(getProduct)
  .put(adminOnly, uploadProductImages, handleUploadError, updateProduct)
  .delete(adminOnly, deleteProduct);

router.put('/:id/toggle-status', adminOnly, toggleProductStatus);

export default router;