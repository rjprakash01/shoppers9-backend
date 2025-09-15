import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { couponService } from '../services/couponService';
import { Coupon } from '../models/Coupon';

/**
 * Apply coupon to cart
 */
export const applyCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!code) {
      return next(new AppError('Coupon code is required', 400));
    }

    const result = await couponService.applyCoupon(code, userId);

    if (!result.success) {
      return next(new AppError(result.message || 'Failed to apply coupon', 400));
    }

    res.json({
      success: true,
      message: result.message,
      data: {
        discount: result.discount,
        finalAmount: result.finalAmount,
        coupon: {
          code: result.coupon?.code,
          discountType: result.coupon?.discountType,
          discountValue: result.coupon?.discountValue
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove coupon from cart
 */
export const removeCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const result = await couponService.removeCoupon(userId);

    if (!result.success) {
      return next(new AppError(result.message, 400));
    }

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate coupon
 */
export const validateCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const validation = await couponService.validateCoupon(code, userId);

    res.json({
      success: true,
      message: validation.valid ? 'Coupon is valid' : 'Coupon is invalid',
      data: {
        valid: validation.valid,
        discount: validation.discount || 0,
        reason: validation.reason,
        coupon: validation.coupon ? {
          code: validation.coupon.code,
          description: validation.coupon.description,
          discountType: validation.coupon.discountType,
          discountValue: validation.coupon.discountValue,
          minOrderAmount: validation.coupon.minOrderAmount,
          maxDiscountAmount: validation.coupon.maxDiscountAmount
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available coupons for user
 */
export const getAvailableCoupons = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const coupons = await couponService.getAvailableCoupons(userId);

    res.json({
      success: true,
      message: 'Available coupons retrieved successfully',
      data: {
        coupons: coupons.map(coupon => ({
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount,
          maxDiscountAmount: coupon.maxDiscountAmount,
          validUntil: coupon.validUntil
        })),
        count: coupons.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin Controllers

/**
 * Create a new coupon (Admin)
 */
export const createCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const couponData = req.body;

    // Validate required fields
    const requiredFields = ['code', 'description', 'discountType', 'discountValue', 'minOrderAmount', 'usageLimit', 'validFrom', 'validUntil'];
    for (const field of requiredFields) {
      if (!couponData[field] && couponData[field] !== 0) {
        return next(new AppError(`${field} is required`, 400));
      }
    }

    // Validate discount value
    if (couponData.discountType === 'percentage' && couponData.discountValue > 100) {
      return next(new AppError('Percentage discount cannot exceed 100%', 400));
    }

    // Validate dates
    const validFrom = new Date(couponData.validFrom);
    const validUntil = new Date(couponData.validUntil);
    if (validUntil <= validFrom) {
      return next(new AppError('Valid until date must be after valid from date', 400));
    }

    const coupon = await couponService.createCoupon(couponData);

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: { coupon }
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return next(new AppError('Coupon code already exists', 400));
    }
    next(error);
  }
};

/**
 * Get all coupons (Admin)
 */
export const getCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      isActive,
      discountType,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const filters: any = {
      page: Number(page),
      limit: Number(limit)
    };

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    if (discountType) {
      filters.discountType = discountType as string;
    }

    if (search) {
      filters.search = search as string;
    }

    const result = await couponService.getCoupons(filters);

    res.json({
      success: true,
      message: 'Coupons retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get coupon by ID (Admin)
 */
export const getCouponById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { couponId } = req.params;

    const coupon = await couponService.getCouponById(couponId);

    if (!coupon) {
      return next(new AppError('Coupon not found', 404));
    }

    res.json({
      success: true,
      message: 'Coupon retrieved successfully',
      data: { coupon }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update coupon (Admin)
 */
export const updateCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { couponId } = req.params;
    const updateData = req.body;

    // Validate discount value if being updated
    if (updateData.discountType === 'percentage' && updateData.discountValue > 100) {
      return next(new AppError('Percentage discount cannot exceed 100%', 400));
    }

    // Validate dates if being updated
    if (updateData.validFrom && updateData.validUntil) {
      const validFrom = new Date(updateData.validFrom);
      const validUntil = new Date(updateData.validUntil);
      if (validUntil <= validFrom) {
        return next(new AppError('Valid until date must be after valid from date', 400));
      }
    }

    const coupon = await couponService.updateCoupon(couponId, updateData);

    if (!coupon) {
      return next(new AppError('Coupon not found', 404));
    }

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: { coupon }
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return next(new AppError('Coupon code already exists', 400));
    }
    next(error);
  }
};

/**
 * Delete coupon (Admin)
 */
export const deleteCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { couponId } = req.params;

    const deleted = await couponService.deleteCoupon(couponId);

    if (!deleted) {
      return next(new AppError('Coupon not found', 404));
    }

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle coupon status (Admin)
 */
export const toggleCouponStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return next(new AppError('Coupon not found', 404));
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({
      success: true,
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { coupon }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get coupon analytics (Admin)
 */
export const getCouponAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await couponService.getCouponAnalytics();

    res.json({
      success: true,
      message: 'Coupon analytics retrieved successfully',
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk create coupons (Admin)
 */
export const bulkCreateCoupons = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { coupons } = req.body;

    if (!Array.isArray(coupons) || coupons.length === 0) {
      return next(new AppError('Coupons array is required', 400));
    }

    const results = {
      successful: 0,
      failed: [] as Array<{ code: string; error: string }>
    };

    for (const couponData of coupons) {
      try {
        await couponService.createCoupon(couponData);
        results.successful++;
      } catch (error: any) {
        results.failed.push({
          code: couponData.code || 'unknown',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Bulk coupon creation completed',
      data: {
        ...results,
        total: coupons.length,
        successRate: `${((results.successful / coupons.length) * 100).toFixed(1)}%`
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate coupon codes (Admin)
 */
export const generateCouponCodes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { count = 10, prefix = '', length = 8 } = req.body;

    if (count > 100) {
      return next(new AppError('Cannot generate more than 100 codes at once', 400));
    }

    const codes = [];
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    for (let i = 0; i < count; i++) {
      let code = prefix;
      for (let j = 0; j < length - prefix.length; j++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      // Check if code already exists
      const existingCoupon = await Coupon.findByCode(code);
      if (!existingCoupon) {
        codes.push(code);
      } else {
        // Retry with different code
        i--;
      }
    }

    res.json({
      success: true,
      message: 'Coupon codes generated successfully',
      data: {
        codes,
        count: codes.length
      }
    });
  } catch (error) {
    next(error);
  }
};