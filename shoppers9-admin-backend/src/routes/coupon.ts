import express from 'express';
import { auth } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { applyDataFilter } from '../middleware/dataFilter';
import {
  getAllCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCouponAnalytics,
  validateCoupon
} from '../controllers/couponController';

const router = express.Router();

// Public routes (for admin frontend access)
router.get('/public', getAllCoupons);
router.get('/public/:id', getCoupon);
router.post('/public/validate', validateCoupon);

// Apply authentication and data filtering to all admin routes
router.use(auth);
router.use(applyDataFilter);

// Protected admin routes
router.get('/', requirePermission('coupons', 'read'), getAllCoupons);
router.post('/', requirePermission('coupons', 'create_assets'), createCoupon);
router.get('/analytics', requirePermission('coupons', 'read'), getCouponAnalytics);
router.post('/validate', requirePermission('coupons', 'read'), validateCoupon);

router.route('/:id')
  .get(requirePermission('coupons', 'read'), getCoupon)
  .put(requirePermission('coupons', 'edit'), updateCoupon)
  .delete(requirePermission('coupons', 'delete'), deleteCoupon);

// Toggle status route
router.patch('/:id/toggle-status', requirePermission('coupons', 'edit'), toggleCouponStatus);

export default router;