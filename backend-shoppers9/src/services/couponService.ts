import { Coupon } from '../models/Coupon';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { ICoupon } from '../types';
import mongoose from 'mongoose';

export interface CouponValidationResult {
  valid: boolean;
  coupon?: ICoupon;
  discount?: number;
  reason?: string;
}

export interface CouponApplicationResult {
  success: boolean;
  discount: number;
  finalAmount: number;
  coupon?: ICoupon;
  message?: string;
}

export interface BulkPricingRule {
  minQuantity: number;
  discountPercentage: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
}

export interface PromotionalDiscount {
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
}

class CouponService {
  /**
   * Validate a coupon code for a specific cart
   */
  async validateCoupon(code: string, userId: string): Promise<CouponValidationResult> {
    try {
      // Find the coupon
      const coupon = await Coupon.findByCode(code);
      if (!coupon) {
        return {
          valid: false,
          reason: 'Invalid coupon code'
        };
      }

      // Get user's cart
      const cart = await Cart.findOne({ userId }).populate({
        path: 'items.product',
        select: 'category subCategory name price'
      });

      if (!cart || cart.items.length === 0) {
        return {
          valid: false,
          reason: 'Cart is empty'
        };
      }

      // Extract category and product IDs from cart
      const categoryIds = cart.items.map((item: any) => {
        const product = item.product;
        return [product.category, product.subCategory].filter(Boolean).map(id => id.toString());
      }).flat();

      const productIds = cart.items.map((item: any) => item.product._id.toString());

      // Check if coupon can be used
      const canUse = coupon.canBeUsed(cart.totalAmount, categoryIds, productIds);
      if (!canUse.valid) {
        return {
          valid: false,
          reason: canUse.reason
        };
      }

      // Calculate discount
      const discount = coupon.calculateDiscount(cart.totalAmount);

      return {
        valid: true,
        coupon,
        discount
      };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return {
        valid: false,
        reason: 'Error validating coupon'
      };
    }
  }

  /**
   * Apply a coupon to a cart
   */
  async applyCoupon(code: string, userId: string): Promise<CouponApplicationResult> {
    try {
      // Validate the coupon first
      const validation = await this.validateCoupon(code, userId);
      if (!validation.valid) {
        return {
          success: false,
          discount: 0,
          finalAmount: 0,
          message: validation.reason
        };
      }

      const { coupon, discount } = validation;
      if (!coupon || discount === undefined) {
        return {
          success: false,
          discount: 0,
          finalAmount: 0,
          message: 'Invalid coupon data'
        };
      }

      // Update cart with coupon
      const cart = await Cart.findOne({ userId });
      if (!cart) {
        return {
          success: false,
          discount: 0,
          finalAmount: 0,
          message: 'Cart not found'
        };
      }

      // Calculate new total
      const finalAmount = Math.max(0, cart.totalAmount - discount);

      // Update cart
      cart.appliedCoupon = coupon.code;
      cart.couponDiscount = discount;
      await cart.save();

      return {
        success: true,
        discount,
        finalAmount,
        coupon,
        message: `Coupon applied! You saved ₹${discount}`
      };
    } catch (error) {
      console.error('Error applying coupon:', error);
      return {
        success: false,
        discount: 0,
        finalAmount: 0,
        message: 'Error applying coupon'
      };
    }
  }

  /**
   * Remove coupon from cart
   */
  async removeCoupon(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const cart = await Cart.findOne({ userId });
      if (!cart) {
        return {
          success: false,
          message: 'Cart not found'
        };
      }

      cart.appliedCoupon = undefined;
      cart.couponDiscount = 0;
      await cart.save();

      return {
        success: true,
        message: 'Coupon removed successfully'
      };
    } catch (error) {
      console.error('Error removing coupon:', error);
      return {
        success: false,
        message: 'Error removing coupon'
      };
    }
  }

  /**
   * Get available coupons for a user based on their cart
   */
  async getAvailableCoupons(userId: string): Promise<ICoupon[]> {
    try {
      const cart = await Cart.findOne({ userId }).populate({
        path: 'items.product',
        select: 'category subCategory'
      });

      if (!cart || cart.items.length === 0) {
        // If no cart or empty cart, return all active coupons
        return this.getAllActiveCoupons();
      }

      // Extract category and product IDs
      const categoryIds = cart.items.map((item: any) => {
        const product = item.product;
        return [product.category, product.subCategory].filter(Boolean).map(id => id.toString());
      }).flat();

      const productIds = cart.items.map((item: any) => item.product._id.toString());

      // Find valid coupons
      const coupons = await (Coupon as any).findValidCoupons(categoryIds, productIds);
      
      // Filter coupons that meet minimum order amount
      return coupons.filter((coupon: ICoupon) => cart.totalAmount >= coupon.minOrderAmount);
    } catch (error) {
      console.error('Error getting available coupons:', error);
      return [];
    }
  }

  /**
   * Get all active coupons (for display purposes)
   */
  async getAllActiveCoupons(): Promise<ICoupon[]> {
    try {
      const now = new Date();
      const coupons = await Coupon.find({
        isActive: true,
        validFrom: { $lte: now },
        validUntil: { $gte: now },
        $expr: { $lt: ['$usedCount', '$usageLimit'] }
      }).sort({ createdAt: -1 });
      
      return coupons;
    } catch (error) {
      console.error('Error getting all active coupons:', error);
      return [];
    }
  }

  /**
   * Create a new coupon
   */
  async createCoupon(couponData: Partial<ICoupon>): Promise<ICoupon> {
    try {
      const coupon = new Coupon(couponData);
      await coupon.save();
      return coupon;
    } catch (error) {
      console.error('Error creating coupon:', error);
      throw error;
    }
  }

  /**
   * Update a coupon
   */
  async updateCoupon(couponId: string, updateData: Partial<ICoupon>): Promise<ICoupon | null> {
    try {
      const coupon = await Coupon.findByIdAndUpdate(
        couponId,
        updateData,
        { new: true, runValidators: true }
      );
      return coupon;
    } catch (error) {
      console.error('Error updating coupon:', error);
      throw error;
    }
  }

  /**
   * Delete a coupon
   */
  async deleteCoupon(couponId: string): Promise<boolean> {
    try {
      const result = await Coupon.findByIdAndDelete(couponId);
      return !!result;
    } catch (error) {
      console.error('Error deleting coupon:', error);
      throw error;
    }
  }

  /**
   * Get all coupons with pagination and filters
   */
  async getCoupons(filters: {
    isActive?: boolean;
    discountType?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    coupons: ICoupon[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const { isActive, discountType, search, page = 1, limit = 20 } = filters;
      
      // Build query
      const query: any = {};
      
      if (isActive !== undefined) {
        query.isActive = isActive;
      }
      
      if (discountType) {
        query.discountType = discountType;
      }
      
      if (search) {
        query.$or = [
          { code: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      const skip = (page - 1) * limit;
      
      const [coupons, total] = await Promise.all([
        Coupon.find(query)
          .populate('applicableCategories', 'name')
          .populate('applicableProducts', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Coupon.countDocuments(query)
      ]);
      
      return {
        coupons,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting coupons:', error);
      throw error;
    }
  }

  /**
   * Get coupon by ID
   */
  async getCouponById(couponId: string): Promise<ICoupon | null> {
    try {
      return await Coupon.findById(couponId)
        .populate('applicableCategories', 'name')
        .populate('applicableProducts', 'name');
    } catch (error) {
      console.error('Error getting coupon by ID:', error);
      throw error;
    }
  }

  /**
   * Increment coupon usage (called when order is placed)
   */
  async incrementCouponUsage(code: string): Promise<void> {
    try {
      const coupon = await Coupon.findByCode(code);
      if (coupon) {
        await coupon.incrementUsage();
      }
    } catch (error) {
      console.error('Error incrementing coupon usage:', error);
      throw error;
    }
  }

  /**
   * Decrement coupon usage (called when order is cancelled)
   */
  async decrementCouponUsage(code: string): Promise<void> {
    try {
      const coupon = await Coupon.findByCode(code);
      if (coupon) {
        await coupon.decrementUsage();
      }
    } catch (error) {
      console.error('Error decrementing coupon usage:', error);
      throw error;
    }
  }

  /**
   * Calculate bulk pricing discounts
   */
  async calculateBulkDiscount(cartItems: any[], bulkRules: BulkPricingRule[]): Promise<number> {
    try {
      let totalDiscount = 0;

      for (const rule of bulkRules) {
        // Calculate total quantity for applicable items
        let applicableQuantity = 0;
        let applicableAmount = 0;

        for (const item of cartItems) {
          const isApplicable = this.isItemApplicableForRule(item, rule);
          if (isApplicable) {
            applicableQuantity += item.quantity;
            applicableAmount += item.price * item.quantity;
          }
        }

        // Apply discount if minimum quantity is met
        if (applicableQuantity >= rule.minQuantity) {
          const discount = (applicableAmount * rule.discountPercentage) / 100;
          totalDiscount += discount;
        }
      }

      return Math.round(totalDiscount * 100) / 100;
    } catch (error) {
      console.error('Error calculating bulk discount:', error);
      return 0;
    }
  }

  /**
   * Check if item is applicable for bulk pricing rule
   */
  private isItemApplicableForRule(item: any, rule: BulkPricingRule): boolean {
    // If no restrictions, apply to all items
    if (!rule.applicableProducts?.length && !rule.applicableCategories?.length) {
      return true;
    }

    // Check product restrictions
    if (rule.applicableProducts?.length) {
      if (rule.applicableProducts.includes(item.product.toString())) {
        return true;
      }
    }

    // Check category restrictions
    if (rule.applicableCategories?.length) {
      // This would need product population to check categories
      // For now, return true if categories are specified
      return true;
    }

    return false;
  }

  /**
   * Get coupon analytics
   */
  async getCouponAnalytics(): Promise<{
    totalCoupons: number;
    activeCoupons: number;
    expiredCoupons: number;
    totalUsage: number;
    topCoupons: Array<{
      code: string;
      usedCount: number;
      discountType: string;
      discountValue: number;
    }>;
  }> {
    try {
      const now = new Date();
      
      const [totalCoupons, activeCoupons, expiredCoupons, topCoupons] = await Promise.all([
        Coupon.countDocuments(),
        Coupon.countDocuments({ isActive: true, validUntil: { $gte: now } }),
        Coupon.countDocuments({ $or: [{ isActive: false }, { validUntil: { $lt: now } }] }),
        Coupon.find()
          .select('code usedCount discountType discountValue')
          .sort({ usedCount: -1 })
          .limit(10)
      ]);
      
      const totalUsage = await Coupon.aggregate([
        { $group: { _id: null, total: { $sum: '$usedCount' } } }
      ]);
      
      return {
        totalCoupons,
        activeCoupons,
        expiredCoupons,
        totalUsage: totalUsage[0]?.total || 0,
        topCoupons
      };
    } catch (error) {
      console.error('Error getting coupon analytics:', error);
      throw error;
    }
  }
}

export const couponService = new CouponService();
export default couponService;