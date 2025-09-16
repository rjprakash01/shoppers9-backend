import { Request, Response, NextFunction } from 'express';
import { Testimonial } from '../models/Testimonial';
import { AuthenticatedRequest } from '../types';
import mongoose from 'mongoose';

// Simple error class
class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

// Get all testimonials with pagination and filters
export const getTestimonials = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter: any = {};
    
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    if (req.query.isFeatured !== undefined) {
      filter.isFeatured = req.query.isFeatured === 'true';
    }
    
    if (req.query.isVerified !== undefined) {
      filter.isVerified = req.query.isVerified === 'true';
    }
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.rating) {
      filter.rating = { $gte: parseFloat(req.query.rating as string) };
    }
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { customerName: searchRegex },
        { title: searchRegex },
        { content: searchRegex },
        { productName: searchRegex }
      ];
    }
    
    // Sort options
    let sort: any = { createdAt: -1 };
    if (req.query.sortBy) {
      const sortField = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      sort = { [sortField]: sortOrder };
    }
    
    const testimonials = await Testimonial.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('productId', 'name images')
      .lean();
    
    const total = await Testimonial.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        testimonials,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single testimonial by ID
export const getTestimonialById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return next(new AppError('Testimonial ID is required', 400));
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid testimonial ID', 400));
    }
    
    const testimonial = await Testimonial.findById(id)
      .populate('productId', 'name images price')
      .lean();
    
    if (!testimonial) {
      return next(new AppError('Testimonial not found', 404));
    }
    
    res.json({
      success: true,
      data: testimonial
    });
  } catch (error) {
    next(error);
  }
};

// Create new testimonial
export const createTestimonial = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || 'admin';
    const testimonialData = req.body;
    
    // Validate required fields
    const requiredFields = ['customerName', 'title', 'content', 'rating'];
    for (const field of requiredFields) {
      if (!testimonialData[field]) {
        return next(new AppError(`${field} is required`, 400));
      }
    }
    
    // Validate rating
    if (testimonialData.rating < 1 || testimonialData.rating > 5) {
      return next(new AppError('Rating must be between 1 and 5', 400));
    }
    
    // Validate email if provided
    if (testimonialData.customerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(testimonialData.customerEmail)) {
        return next(new AppError('Please enter a valid email', 400));
      }
    }
    
    // Set metadata
    testimonialData.createdBy = userId;
    testimonialData.lastModifiedBy = userId;
    
    const testimonial = new Testimonial(testimonialData);
    await testimonial.save();
    
    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      data: testimonial
    });
  } catch (error) {
    next(error);
  }
};

// Update testimonial
export const updateTestimonial = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'admin';
    const updates = req.body;
    
    if (!id) {
      return next(new AppError('Testimonial ID is required', 400));
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid testimonial ID', 400));
    }
    
    // Validate rating if provided
    if (updates.rating && (updates.rating < 1 || updates.rating > 5)) {
      return next(new AppError('Rating must be between 1 and 5', 400));
    }
    
    // Validate email if provided
    if (updates.customerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.customerEmail)) {
        return next(new AppError('Please enter a valid email', 400));
      }
    }
    
    // Set last modified by
    updates.lastModifiedBy = userId;
    
    const testimonial = await Testimonial.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!testimonial) {
      return next(new AppError('Testimonial not found', 404));
    }
    
    res.json({
      success: true,
      message: 'Testimonial updated successfully',
      data: testimonial
    });
  } catch (error) {
    next(error);
  }
};

// Delete testimonial
export const deleteTestimonial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return next(new AppError('Testimonial ID is required', 400));
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid testimonial ID', 400));
    }
    
    const testimonial = await Testimonial.findByIdAndDelete(id);
    
    if (!testimonial) {
      return next(new AppError('Testimonial not found', 404));
    }
    
    res.json({
      success: true,
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Verify testimonial
export const verifyTestimonial = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'admin';
    
    if (!id) {
      return next(new AppError('Testimonial ID is required', 400));
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid testimonial ID', 400));
    }
    
    const testimonial = await Testimonial.findById(id);
    
    if (!testimonial) {
      return next(new AppError('Testimonial not found', 404));
    }
    
    await testimonial.verify(userId);
    
    res.json({
      success: true,
      message: 'Testimonial verified successfully',
      data: testimonial
    });
  } catch (error) {
    next(error);
  }
};

// Feature/Unfeature testimonial
export const toggleFeature = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'admin';
    
    if (!id) {
      return next(new AppError('Testimonial ID is required', 400));
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid testimonial ID', 400));
    }
    
    const testimonial = await Testimonial.findById(id);
    
    if (!testimonial) {
      return next(new AppError('Testimonial not found', 404));
    }
    
    if (testimonial.isFeatured) {
      await testimonial.unfeature(userId);
    } else {
      await testimonial.feature(userId);
    }
    
    res.json({
      success: true,
      message: `Testimonial ${testimonial.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: testimonial
    });
  } catch (error) {
    next(error);
  }
};

// Activate/Deactivate testimonial
export const toggleActive = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'admin';
    
    if (!id) {
      return next(new AppError('Testimonial ID is required', 400));
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid testimonial ID', 400));
    }
    
    const testimonial = await Testimonial.findById(id);
    
    if (!testimonial) {
      return next(new AppError('Testimonial not found', 404));
    }
    
    if (testimonial.isActive) {
      await testimonial.deactivate(userId);
    } else {
      await testimonial.activate(userId);
    }
    
    res.json({
      success: true,
      message: `Testimonial ${testimonial.isActive ? 'activated' : 'deactivated'} successfully`,
      data: testimonial
    });
  } catch (error) {
    next(error);
  }
};

// Get featured testimonials
export const getFeaturedTestimonials = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 6;
    
    const testimonials = await Testimonial.getFeatured(limit);
    
    res.json({
      success: true,
      data: testimonials
    });
  } catch (error) {
    next(error);
  }
};

// Get testimonials by category
export const getTestimonialsByCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!category) {
      return next(new AppError('Category is required', 400));
    }
    
    const validCategories = ['product', 'service', 'delivery', 'support', 'general'];
    if (!validCategories.includes(category)) {
      return next(new AppError('Invalid category', 400));
    }
    
    const testimonials = await Testimonial.getByCategory(category, limit);
    
    res.json({
      success: true,
      data: testimonials
    });
  } catch (error) {
    next(error);
  }
};

// Get testimonials by rating
export const getTestimonialsByRating = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const minRating = parseFloat(req.query.minRating as string) || 4;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (minRating < 1 || minRating > 5) {
      return next(new AppError('Rating must be between 1 and 5', 400));
    }
    
    const testimonials = await Testimonial.getByRating(minRating, limit);
    
    res.json({
      success: true,
      data: testimonials
    });
  } catch (error) {
    next(error);
  }
};

// Get testimonials by product
export const getTestimonialsByProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return next(new AppError('Product ID is required', 400));
    }
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(new AppError('Invalid product ID', 400));
    }
    
    const testimonials = await Testimonial.getByProduct(productId);
    
    res.json({
      success: true,
      data: testimonials
    });
  } catch (error) {
    next(error);
  }
};

// Bulk operations
export const bulkUpdateTestimonials = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { ids, action, data } = req.body;
    const userId = req.user?.id || 'admin';
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return next(new AppError('Please provide valid testimonial IDs', 400));
    }
    
    // Validate all IDs
    for (const id of ids) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError(`Invalid testimonial ID: ${id}`, 400));
      }
    }
    
    let updateData: any = { lastModifiedBy: userId };
    let message = '';
    
    switch (action) {
      case 'activate':
        updateData.isActive = true;
        message = 'Testimonials activated successfully';
        break;
      case 'deactivate':
        updateData.isActive = false;
        message = 'Testimonials deactivated successfully';
        break;
      case 'feature':
        updateData.isFeatured = true;
        message = 'Testimonials featured successfully';
        break;
      case 'unfeature':
        updateData.isFeatured = false;
        message = 'Testimonials unfeatured successfully';
        break;
      case 'verify':
        updateData.isVerified = true;
        updateData.verifiedBy = userId;
        updateData.verificationDate = new Date();
        message = 'Testimonials verified successfully';
        break;
      case 'update':
        if (data) {
          updateData = { ...data, lastModifiedBy: userId };
          message = 'Testimonials updated successfully';
        } else {
          return next(new AppError('Update data is required', 400));
        }
        break;
      default:
        return next(new AppError('Invalid action', 400));
    }
    
    const result = await Testimonial.updateMany(
      { _id: { $in: ids } },
      updateData
    );
    
    res.json({
      success: true,
      message,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get testimonial statistics
export const getTestimonialStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await Testimonial.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          featured: { $sum: { $cond: ['$isFeatured', 1, 0] } },
          verified: { $sum: { $cond: ['$isVerified', 1, 0] } },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);
    
    const categoryStats = await Testimonial.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);
    
    const ratingStats = await Testimonial.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          total: 0,
          active: 0,
          featured: 0,
          verified: 0,
          averageRating: 0
        },
        byCategory: categoryStats,
        byRating: ratingStats
      }
    });
  } catch (error) {
    next(error);
  }
};