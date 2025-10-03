import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  userUsageLimit?: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  applicableProducts?: mongoose.Types.ObjectId[];
  applicableCategories?: mongoose.Types.ObjectId[];
  excludedProducts?: mongoose.Types.ObjectId[];
  excludedCategories?: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isValid(): boolean;
  canBeUsedBy(userId: string): boolean;
  calculateDiscount(orderAmount: number): number;
}

const couponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 20
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed']
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  minimumOrderAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  maximumDiscountAmount: {
    type: Number,
    min: 0
  },
  usageLimit: {
    type: Number,
    min: 1
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  userUsageLimit: {
    type: Number,
    min: 1,
    default: 1
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableProducts: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  excludedProducts: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  excludedCategories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ createdBy: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });
couponSchema.index({ type: 1 });

// Validation
couponSchema.pre('save', function(next) {
  // Validate percentage value
  if (this.type === 'percentage' && this.value > 100) {
    return next(new Error('Percentage discount cannot exceed 100%'));
  }
  
  // Validate date range
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  
  // Validate usage count doesn't exceed limit
  if (this.usageLimit && this.usageCount > this.usageLimit) {
    return next(new Error('Usage count cannot exceed usage limit'));
  }
  
  next();
});

// Methods
couponSchema.methods.isValid = function(): boolean {
  const now = new Date();
  return this.isActive && 
         this.startDate <= now && 
         this.endDate >= now &&
         (!this.usageLimit || this.usageCount < this.usageLimit);
};

couponSchema.methods.canBeUsedBy = function(userId: string): boolean {
  // This would need to check user-specific usage in a separate collection
  // For now, just check if coupon is valid
  return this.isValid();
};

couponSchema.methods.calculateDiscount = function(orderAmount: number): number {
  if (!this.isValid()) {
    return 0;
  }
  
  if (this.minimumOrderAmount && orderAmount < this.minimumOrderAmount) {
    return 0;
  }
  
  let discount = 0;
  
  if (this.type === 'percentage') {
    discount = (orderAmount * this.value) / 100;
  } else {
    discount = this.value;
  }
  
  // Apply maximum discount limit
  if (this.maximumDiscountAmount && discount > this.maximumDiscountAmount) {
    discount = this.maximumDiscountAmount;
  }
  
  // Ensure discount doesn't exceed order amount
  return Math.min(discount, orderAmount);
};

const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);
export default Coupon;