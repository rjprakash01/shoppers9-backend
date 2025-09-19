import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { applyDataFilter } from '../middleware/dataFilter';
import { uploadBannerImage, handleUploadError } from '../middleware/upload';
import { convertImageToSVG } from '../utils/imageConverter';
import {
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  updateBannerStatus,
  reorderBanners,
  getActiveBanners
} from '../controllers/bannerController';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// All routes require authentication and data filtering
router.use(auth);
router.use(applyDataFilter);

/**
 * @route POST /upload/banner
 * @desc Upload banner image and convert to SVG
 * @access Private/Admin
 */
router.post('/upload/banner', auth, uploadBannerImage, handleUploadError, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
      return;
    }

    // Define output directory for SVG files
    const outputDir = path.join(process.cwd(), 'uploads', 'banners');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Convert image to SVG
    const result = await convertImageToSVG(
      req.file.path,
      outputDir,
      req.file.filename
    );

    if (!result.success || !result.svgPath) {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to convert image to SVG'
      });
      return;
    }

    // Clean up original uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Convert absolute path to relative URL path
    const relativePath = result.svgPath.replace(process.cwd(), '').replace(/\\/g, '/');
    const urlPath = relativePath.startsWith('/uploads/') ? relativePath : `/uploads/banners/${path.basename(result.svgPath)}`;

    res.status(200).json({
      success: true,
      message: 'Banner image uploaded and converted successfully',
      data: {
        filename: path.basename(result.svgPath),
        imageUrl: urlPath,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });

  } catch (error) {

    // Clean up uploaded file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during banner upload'
    });
    return;
  }
});

// Banner CRUD routes
router.route('/')
  .get(requirePermission('banners', 'read'), getAllBanners)
  .post(requirePermission('banners', 'create'), createBanner);

router.route('/active')
  .get(requirePermission('banners', 'read'), getActiveBanners);

router.route('/reorder')
  .put(requirePermission('banners', 'edit'), reorderBanners);

router.route('/:id')
  .get(requirePermission('banners', 'read'), getBannerById)
  .put(requirePermission('banners', 'edit'), updateBanner)
  .delete(requirePermission('banners', 'delete'), deleteBanner);

router.route('/:id/status')
  .put(requirePermission('banners', 'edit'), updateBannerStatus);

export default router;