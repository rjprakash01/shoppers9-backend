import express from 'express';
import { getActiveBanners } from '../controllers/bannerController';

const router = express.Router();

// Public route for active banners (no authentication required)
router.route('/active')
  .get(getActiveBanners);

export default router;