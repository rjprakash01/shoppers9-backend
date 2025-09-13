import express from 'express';
import { variantController } from '../controllers/variantController';
import { auth } from '../middleware/auth';

const router = express.Router();

// All variant routes require admin authentication
router.use(auth);

// Variant management routes
router.post('/products/:productId/variants', variantController.addVariants);
router.get('/products/:productId/variants', variantController.getProductVariants);
router.put('/products/:productId/variants/:variantId', variantController.updateVariant);
router.delete('/products/:productId/variants/:variantId', variantController.deleteVariant);

export default router;