import mongoose, { Schema } from 'mongoose';
import { ICoupon } from '../types';

// Coupon Schema
const couponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    minlength: 3,
    maxlength: 20,
    match: /^[A-Z0-9]+$/
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed']
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  maxDiscountAmount: {
    type: Number,
    min: 0
  },
  usageLimit: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  validFrom: {
    type: Date,
    required: true,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });
couponSchema.index({ discountType: 1 });
couponSchema.index({ createdAt: -1 });

// Virtual fields
couponSchema.virtual('isExpired').get(function(this: any) {
  return new Date() > this.validUntil;
});

couponSchema.virtual('isValid').get(function(this: any) {
  const now = new Date();
  return this.isActive && 
         now >= this.validFrom && 
         now <= this.validUntil && 
         this.usedCount < this.usageLimit;
});

couponSchema.virtual('remainingUses').get(function(this: any) {
  return Math.max(0, this.usageLimit - this.usedCount);
});

couponSchema.virtual('usagePercentage').get(function(this: any) {
  return this.usageLimit > 0 ? Math.round((this.usedCount / this.usageLimit) * 100) : 0;
});

// Methods
couponSchema.methods.canBeUsed = function(orderAmount: number, categoryIds?: string[], productIds?: string[]): {
  valid: boolean;
  reason?: string;
} {
  // Check if coupon is active
  if (!this.isActive) {
    return { valid: false, reason: 'Coupon is not active' };
  }

  // Check if coupon is within valid date range
  const now = new Date();
  if (now < this.validFrom) {
    return { valid: false, reason: 'Coupon is not yet valid' };
  }
  if (now > this.validUntil) {
    return { valid: false, reason: 'Coupon has expired' };
  }

  // Check usage limit
  if (this.usedCount >= this.usageLimit) {
    return { valid: false, reason: 'Coupon usage limit exceeded' };
  }

  // Check minimum order amount
  if (orderAmount < this.minOrderAmount) {
    return { valid: false, reason: `Minimum order amount of ₹${this.minOrderAmount} required` };
  }

  // Check category restrictions
  if (this.applicableCategories && this.applicableCategories.length > 0) {
    if (!categoryIds || categoryIds.length === 0) {
      return { valid: false, reason: 'Coupon not applicable to cart items' };
    }
    
    const hasApplicableCategory = categoryIds.some(catId => 
      this.applicableCategories.some((appCat: any) => appCat.toString() === catId)
    );
    
    if (!hasApplicableCategory) {
      return { valid: false, reason: 'Coupon not applicable to selected categories' };
    }
  }

  // Check product restrictions
  if (this.applicableProducts && this.applicableProducts.length > 0) {
    if (!productIds || productIds.length === 0) {
      return { valid: false, reason: 'Coupon not applicable to cart items' };
    }
    
    const hasApplicableProduct = productIds.some(prodId => 
      this.applicableProducts.some((appProd: any) => appProd.toString() === prodId)
    );
    
    if (!hasApplicableProduct) {
      return { valid: false, reason: 'Coupon not applicable to selected products' };
    }
  }

  return { valid: true };
};

couponSchema.methods.calculateDiscount = function(orderAmount: number): number {
  let discount = 0;

  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;
    
    // Apply maximum discount limit if specified
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  } else if (this.discountType === 'fixed') {
    discount = Math.min(this.discountValue, orderAmount);
  }

  return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

couponSchema.methods.incrementUsage = function() {
  this.usedCount += 1;
  return this.save();
};

couponSchema.methods.decrementUsage = function() {
  if (this.usedCount > 0) {
    this.usedCount -= 1;
    return this.save();
  }
  return Promise.resolve(this);
};

// Pre-save middleware
couponSchema.pre('save', function(next) {
  // Ensure validUntil is after validFrom
  if (this.validUntil <= this.validFrom) {
    return next(new Error('Valid until date must be after valid from date'));
  }

  // Validate discount value based on type
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    return next(new Error('Percentage discount cannot exceed 100%'));
  }

  // Ensure maxDiscountAmount is only set for percentage discounts
  if (this.discountType === 'fixed' && this.maxDiscountAmount) {
    this.maxDiscountAmount = undefined;
  }

  next();
});

// Static methods
couponSchema.statics.findValidCoupons = function(categoryIds?: string[], productIds?: string[]) {
  const now = new Date();
  const query: any = {
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
    $expr: { $lt: ['$usedCount', '$usageLimit'] }
  };

  // If category or product filters are provided, include coupons that either:
  // 1. Have no restrictions (empty arrays)
  // 2. Have matching categories/products
  if (categoryIds && categoryIds.length > 0) {
    query.$or = [
      { applicableCategories: { $size: 0 } },
      { applicableCategories: { $in: categoryIds } }
    ];
  }

  if (productIds && productIds.length > 0) {
    if (query.$or) {
      query.$and = [
        { $or: query.$or },
        {
          $or: [
            { applicableProducts: { $size: 0 } },
            { applicableProducts: { $in: productIds } }
          ]
        }
      ];
      delete query.$or;
    } else {
      query.$or = [
        { applicableProducts: { $size: 0 } },
        { applicableProducts: { $in: productIds } }
      ];
    }
  }

  return this.find(query).sort({ discountValue: -1, createdAt: -1 });
};

couponSchema.statics.findByCode = function(code: string) {
  return this.findOne({ code: code.toUpperCase() });
};

// Add interface for static methods
interface ICouponModel extends mongoose.Model<ICoupon> {
  findByCode(code: string): Promise<ICoupon | null>;
  findValidCoupons(categoryIds?: string[], productIds?: string[]): Promise<ICoupon[]>;
}

// Create the model with proper typing
const CouponModel = mongoose.model<ICoupon, ICouponModel>('Coupon', couponSchema);

export const Coupon = CouponModel as ICouponModel;