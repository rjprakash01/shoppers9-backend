import express from 'express';
import {
  getProductFilterValues,
  setProductFilterValues,
  updateProductFilterValue,
  deleteProductFilterValue,
  getAvailableFiltersForProduct
} from '../controllers/productFilterValueController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Product filter value routes
router.get('/products/:productId/filter-values', auth, getProductFilterValues);
router.post('/products/:productId/filter-values', auth, setProductFilterValues);
router.get('/products/:productId/available-filters', auth, getAvailableFiltersForProduct);

// Individual product filter value routes
router.put('/product-filter-values/:id', auth, updateProductFilterValue);
router.delete('/product-filter-values/:id', auth, deleteProductFilterValue);

export default router;