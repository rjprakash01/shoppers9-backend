import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Banner } from '../models/Banner';
import { ApiResponse } from '../types';

// Get all active banners for frontend
export const getActiveBanners = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      // Return mock banner data when database is not connected
      const mockBanners = [
        {
          _id: '507f1f77bcf86cd799439021',
          title: 'Welcome to Shoppers9',
          subtitle: 'Your one-stop shopping destination',
          description: 'Discover amazing products at great prices',
          image: '/api/placeholder/Welcome%20Banner',
          link: '/products',
          buttonText: 'Shop Now',
          isActive: true,
          order: 1
        }
      ];
      
      const response: ApiResponse = {
        success: true,
        message: 'Active banners retrieved successfully',
        data: mockBanners
      };
      
      return res.status(200).json(response);
    }

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

    const response: ApiResponse = {
      success: true,
      message: 'Active banners retrieved successfully',
      data: banners
    };

    return res.status(200).json(response);
  } catch (error) {
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch banners'
    };
    return res.status(500).json(response);
  }
};

// Admin: Get all banners
export const getAllBanners = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const banners = await Banner.find()
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Banner.countDocuments();

    const response: ApiResponse = {
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
    };

    res.status(200).json(response);
  } catch (error) {
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch banners'
    };
    res.status(500).json(response);
  }
};

// Admin: Get banner by ID
export const getBannerById = async (req: Request, res: Response) => {
  try {
    const { bannerId } = req.params;
    const banner = await Banner.findById(bannerId);

    if (!banner) {
      const response: ApiResponse = {
        success: false,
        message: 'Banner not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Banner retrieved successfully',
      data: banner
    };

    return res.status(200).json(response);
  } catch (error) {
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to fetch banner'
    };
    return res.status(500).json(response);
  }
};

// Admin: Create new banner
export const createBanner = async (req: Request, res: Response) => {
  try {
    const bannerData = req.body;
    const banner = new Banner(bannerData);
    await banner.save();

    const response: ApiResponse = {
      success: true,
      message: 'Banner created successfully',
      data: banner
    };

    res.status(201).json(response);
  } catch (error) {
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to create banner'
    };
    res.status(500).json(response);
  }
};

// Admin: Update banner
export const updateBanner = async (req: Request, res: Response) => {
  try {
    const { bannerId } = req.params;
    const updateData = req.body;

    const banner = await Banner.findByIdAndUpdate(
      bannerId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!banner) {
      const response: ApiResponse = {
        success: false,
        message: 'Banner not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Banner updated successfully',
      data: banner
    };

    return res.status(200).json(response);
  } catch (error) {
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update banner'
    };
    return res.status(500).json(response);
  }
};

// Admin: Delete banner
export const deleteBanner = async (req: Request, res: Response) => {
  try {
    const { bannerId } = req.params;
    const banner = await Banner.findByIdAndDelete(bannerId);

    if (!banner) {
      const response: ApiResponse = {
        success: false,
        message: 'Banner not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Banner deleted successfully'
    };

    return res.status(200).json(response);
  } catch (error) {
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to delete banner'
    };
    return res.status(500).json(response);
  }
};

// Admin: Update banner status
export const updateBannerStatus = async (req: Request, res: Response) => {
  try {
    const { bannerId } = req.params;
    const { isActive } = req.body;

    const banner = await Banner.findByIdAndUpdate(
      bannerId,
      { isActive },
      { new: true }
    );

    if (!banner) {
      const response: ApiResponse = {
        success: false,
        message: 'Banner not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: `Banner ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: banner
    };

    return res.status(200).json(response);
  } catch (error) {
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to update banner status'
    };
    return res.status(500).json(response);
  }
};

// Admin: Reorder banners
export const reorderBanners = async (req: Request, res: Response) => {
  try {
    const { bannerIds } = req.body; // Array of banner IDs in new order

    if (!Array.isArray(bannerIds) || bannerIds.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid banner IDs array'
      };
      return res.status(400).json(response);
    }

    // Update each banner with its new order based on position in array
    const updatePromises = bannerIds.map((bannerId: string, index: number) =>
      Banner.findByIdAndUpdate(bannerId, { order: index + 1 })
    );

    await Promise.all(updatePromises);

    const response: ApiResponse = {
      success: true,
      message: 'Banner order updated successfully'
    };

    return res.status(200).json(response);
  } catch (error) {
    
    const response: ApiResponse = {
      success: false,
      message: 'Failed to reorder banners'
    };
    return res.status(500).json(response);
  }
};