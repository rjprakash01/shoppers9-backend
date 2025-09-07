import express from 'express';
import Joi from 'joi';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, validateParams } from '../middleware/validation';
import {
  getActiveBanners,
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  updateBannerStatus,
  reorderBanners
} from '../controllers/bannerController';

const router = express.Router();

// Validation schemas
const bannerIdSchema = Joi.object({
  bannerId: Joi.string().required().trim()
});

const createBannerSchema = Joi.object({
  title: Joi.string().required().trim().max(100),
  subtitle: Joi.string().optional().trim().max(150),
  description: Joi.string().optional().trim().max(300),
  image: Joi.string().required().trim(),
  link: Joi.string().optional().trim(),
  buttonText: Joi.string().optional().trim().max(30),
  isActive: Joi.boolean().default(true),
  order: Joi.number().integer().min(0).default(0),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional().greater(Joi.ref('startDate'))
});

const updateBannerSchema = Joi.object({
  title: Joi.string().optional().trim().max(100),
  subtitle: Joi.string().optional().trim().max(150),
  description: Joi.string().optional().trim().max(300),
  image: Joi.string().optional().trim(),
  link: Joi.string().optional().trim(),
  buttonText: Joi.string().optional().trim().max(30),
  isActive: Joi.boolean().optional(),
  order: Joi.number().integer().min(0).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional()
});

const updateBannerStatusSchema = Joi.object({
  isActive: Joi.boolean().required()
});

const reorderBannersSchema = Joi.object({
  bannerIds: Joi.array().items(
    Joi.string().required()
  ).min(1).required()
});

// Public routes
/**
 * @route GET /banners/active
 * @desc Get all active banners for frontend carousel
 * @access Public
 */
router.get('/active', getActiveBanners);

// Admin routes (require authentication)
/**
 * @route GET /banners
 * @desc Get all banners (admin)
 * @access Private/Admin
 */
router.get('/', authenticateToken, getAllBanners);

/**
 * @route GET /banners/:bannerId
 * @desc Get banner by ID (admin)
 * @access Private/Admin
 */
router.get('/:bannerId', 
  authenticateToken, 
  validateParams(bannerIdSchema), 
  getBannerById
);

/**
 * @route POST /banners
 * @desc Create new banner (admin)
 * @access Private/Admin
 */
router.post('/', 
  authenticateToken, 
  validateRequest(createBannerSchema), 
  createBanner
);

/**
 * @route PUT /banners/:bannerId
 * @desc Update banner (admin)
 * @access Private/Admin
 */
router.put('/:bannerId', 
  authenticateToken, 
  validateParams(bannerIdSchema), 
  validateRequest(updateBannerSchema), 
  updateBanner
);

/**
 * @route DELETE /banners/:bannerId
 * @desc Delete banner (admin)
 * @access Private/Admin
 */
router.delete('/:bannerId', 
  authenticateToken, 
  validateParams(bannerIdSchema), 
  deleteBanner
);

/**
 * @route PATCH /banners/:bannerId/status
 * @desc Update banner status (admin)
 * @access Private/Admin
 */
router.patch('/:bannerId/status', 
  authenticateToken, 
  validateParams(bannerIdSchema), 
  validateRequest(updateBannerStatusSchema), 
  updateBannerStatus
);

/**
 * @route PUT /banners/reorder
 * @desc Reorder banners (admin)
 * @access Private/Admin
 */
router.put('/reorder', 
  authenticateToken, 
  validateRequest(reorderBannersSchema), 
  reorderBanners
);

export default router;