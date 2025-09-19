import { Response } from 'express';
import Coupon from '../models/Coupon';
import { AuthRequest } from '../types';
import { applyPaginationWithFilter } from '../middleware/dataFilter';

// Get all coupons with filtering and pagination
export const getAllCoupons = async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, type, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build base query
    let baseQuery: any = {};
    
    if (search) {
      baseQuery.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status !== undefined) {
      baseQuery.isActive = status === 'active';
    }
    
    if (type) {
      baseQuery.type = type;
    }
    
    // Apply data filtering and pagination
    const { query: filteredQuery, pagination } = applyPaginationWithFilter(req, baseQuery, 'Coupon');
    
    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query
    const coupons = await Coupon.find(filteredQuery)
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('createdBy', 'firstName lastName email')
      .populate('applicableProducts', 'name')
      .populate('applicableCategories', 'name');
    
    // Get total count for pagination
    const totalCoupons = await Coupon.countDocuments(filteredQuery);
    
    return res.status(200).json({
      success: true,
      data: {
        coupons,
        pagination: {
          ...pagination,
          total: totalCoupons,
          totalPages: Math.ceil(totalCoupons / pagination.limit)
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch coupons',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get single coupon by ID
export const getCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Apply data filtering
    const filter = req.dataFilter?.getFilter('Coupon') || {};
    
    const coupon = await Coupon.findOne({ _id: id, ...filter })
      .populate('createdBy', 'firstName lastName email')
      .populate('applicableProducts', 'name price')
      .populate('applicableCategories', 'name')
      .populate('excludedProducts', 'name')
      .populate('excludedCategories', 'name');
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch coupon',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create new coupon
export const createCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const {
      code,
      name,
      description,
      type,
      value,
      minimumOrderAmount,
      maximumDiscountAmount,
      usageLimit,
      userUsageLimit,
      startDate,
      endDate,
      isActive = true,
      applicableProducts,
      applicableCategories,
      excludedProducts,
      excludedCategories
    } = req.body;
    
    // Validate required fields
    if (!code || !name || !type || value === undefined || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: code, name, type, value, startDate, endDate'
      });
    }
    
    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }
    
    // Create coupon
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      name,
      description,
      type,
      value,
      minimumOrderAmount,
      maximumDiscountAmount,
      usageLimit,
      userUsageLimit,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive,
      applicableProducts,
      applicableCategories,
      excludedProducts,
      excludedCategories,
      createdBy: req.admin!._id
    });
    
    // Populate the created coupon
    const populatedCoupon = await Coupon.findById(coupon._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('applicableProducts', 'name')
      .populate('applicableCategories', 'name');
    
    return res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: populatedCoupon
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create coupon',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update coupon
export const updateCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Apply data filtering
    const filter = req.dataFilter?.getFilter('Coupon') || {};
    
    // Remove fields that shouldn't be updated
    delete updateData.createdBy;
    delete updateData.usageCount;
    
    // Convert code to uppercase if provided
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
      
      // Check if new code already exists (excluding current coupon)
      const existingCoupon = await Coupon.findOne({ 
        code: updateData.code, 
        _id: { $ne: id } 
      });
      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code already exists'
        });
      }
    }
    
    // Convert dates if provided
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }
    
    const coupon = await Coupon.findOneAndUpdate(
      { _id: id, ...filter },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('applicableProducts', 'name')
      .populate('applicableCategories', 'name');
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update coupon',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete coupon
export const deleteCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Apply data filtering
    const filter = req.dataFilter?.getFilter('Coupon') || {};
    
    const coupon = await Coupon.findOneAndDelete({ _id: id, ...filter });
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete coupon',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Toggle coupon status
export const toggleCouponStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Apply data filtering
    const filter = req.dataFilter?.getFilter('Coupon') || {};
    
    const coupon = await Coupon.findOne({ _id: id, ...filter });
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    
    return res.status(200).json({
      success: true,
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
      data: coupon
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle coupon status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get coupon analytics
export const getCouponAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    // Apply data filtering
    const filter = req.dataFilter?.getFilter('Coupon') || {};
    
    const analytics = await Coupon.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalCoupons: { $sum: 1 },
          activeCoupons: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          },
          expiredCoupons: {
            $sum: {
              $cond: [{ $lt: ['$endDate', new Date()] }, 1, 0]
            }
          },
          totalUsage: { $sum: '$usageCount' },
          averageDiscount: { $avg: '$value' }
        }
      }
    ]);
    
    const result = analytics[0] || {
      totalCoupons: 0,
      activeCoupons: 0,
      expiredCoupons: 0,
      totalUsage: 0,
      averageDiscount: 0
    };
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch coupon analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Validate coupon for order
export const validateCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { code, orderAmount, userId } = req.body;
    
    if (!code || !orderAmount) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code and order amount are required'
      });
    }
    
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true
    });
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }
    
    if (!coupon.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is expired or not active'
      });
    }
    
    const discount = coupon.calculateDiscount(orderAmount);
    
    return res.status(200).json({
      success: true,
      data: {
        coupon: {
          _id: coupon._id,
          code: coupon.code,
          name: coupon.name,
          type: coupon.type,
          value: coupon.value
        },
        discount,
        finalAmount: orderAmount - discount
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to validate coupon',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};