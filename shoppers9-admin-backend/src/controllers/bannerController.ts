import { Request, Response } from 'express';
import Banner from '../models/Banner';
import { AuthRequest } from '../types';

// Get all banners with pagination
export const getAllBanners = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subtitle: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.isActive = status === 'active';
    }

    const skip = (page - 1) * limit;

    const banners = await Banner.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    const total = await Banner.countDocuments(query);

    res.json({
      success: true,
      message: 'Banners retrieved successfully',
      data: {
        banners,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching banners',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get banner by ID
export const getBannerById = async (req: Request, res: Response) => {
  try {
    const banner = await Banner.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    return res.json({
      success: true,
      message: 'Banner retrieved successfully',
      data: banner
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching banner',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create new banner
export const createBanner = async (req: AuthRequest, res: Response) => {
  try {
    const bannerData = {
      ...req.body,
      createdBy: req.admin?.id
    };

    // If no order is specified, set it to the next available order
    if (!bannerData.order) {
      const lastBanner = await Banner.findOne().sort({ order: -1 });
      bannerData.order = lastBanner ? lastBanner.order + 1 : 1;
    }

    const banner = new Banner(bannerData);
    await banner.save();

    const populatedBanner = await Banner.findById(banner._id)
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: populatedBanner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating banner',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update banner
export const updateBanner = async (req: AuthRequest, res: Response) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.admin?.id
    };

    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    return res.json({
      success: true,
      message: 'Banner updated successfully',
      data: banner
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating banner',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete banner
export const deleteBanner = async (req: Request, res: Response) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    return res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting banner',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update banner status
export const updateBannerStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { isActive } = req.body;

    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { 
        isActive,
        updatedBy: req.admin?.id
      },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    return res.json({
      success: true,
      message: `Banner ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: banner
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating banner status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Reorder banners
export const reorderBanners = async (req: AuthRequest, res: Response) => {
  try {
    const { bannerIds } = req.body; // Array of banner IDs in new order

    if (!Array.isArray(bannerIds)) {
      return res.status(400).json({
        success: false,
        message: 'bannerIds must be an array'
      });
    }

    // Update order for each banner
    const updatePromises = bannerIds.map((bannerId, index) => 
      Banner.findByIdAndUpdate(
        bannerId,
        { 
          order: index + 1,
          updatedBy: req.admin?.id
        },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    // Get updated banners
    const banners = await Banner.find({ _id: { $in: bannerIds } })
      .sort({ order: 1 })
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    return res.json({
      success: true,
      message: 'Banners reordered successfully',
      data: banners
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error reordering banners',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get active banners (for frontend)
export const getActiveBanners = async (req: Request, res: Response) => {
  try {
    const banners = await Banner.find({
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: { $lte: new Date() } }
          ]
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: { $gte: new Date() } }
          ]
        }
      ]
    })
    .sort({ order: 1, createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      message: 'Active banners retrieved successfully',
      data: banners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active banners',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};