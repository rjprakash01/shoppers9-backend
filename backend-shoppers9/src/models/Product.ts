import mongoose, { Schema } from 'mongoose';
import { IProduct, IProductVariant, IProductSpecification } from '../types';

// Product Variant Schema - Each variant is a unique color-size combination
const productVariantSchema = new Schema<IProductVariant>({
  color: {
    type: String,
    required: true,
    trim: true
  },
  colorCode: {
    type: String,
    trim: true,
    match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  },
  size: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  images: [{
    type: String,
    required: true
  }]
});

const productSpecificationSchema = new Schema<IProductSpecification>({
  fabric: String,
  fit: String,
  washCare: String,
  material: String,
  capacity: String,
  microwaveSafe: Boolean,
  dimensions: String,
  weight: String
});

// Master Product Schema
const productSchema = new Schema<IProduct>({
  // Master Product Fields
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subSubCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  // Master Product Images (default/primary images)
  images: [{
    type: String,
    required: true
  }],
  // Product Variants (color-size combinations)
  variants: [productVariantSchema],
  // Available Colors for this product (master list)
  availableColors: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      trim: true,
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    },
    images: [{
      type: String
    }]
  }],
  // Available Sizes for this product (master list)
  availableSizes: [{
    name: {
      type: String,
      required: true,
      trim: true
    }
  }],
  specifications: productSpecificationSchema,
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isTrending: {
    type: Boolean,
    default: false
  },
  displayFilters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Filter'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, subCategory: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isTrending: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'variants.sizes.price': 1 });

// Virtual for minimum price
productSchema.virtual('minPrice').get(function(this: any) {
  if (!this.variants || !Array.isArray(this.variants)) {
    return 0;
  }
  let minPrice = Infinity;
  this.variants.forEach((variant: any) => {
    if (variant.price && variant.price < minPrice) {
      minPrice = variant.price;
    }
  });
  return minPrice === Infinity ? 0 : minPrice;
});

// Virtual for maximum price
productSchema.virtual('maxPrice').get(function(this: any) {
  if (!this.variants || !Array.isArray(this.variants)) {
    return 0;
  }
  let maxPrice = 0;
  this.variants.forEach((variant: any) => {
    if (variant.price && variant.price > maxPrice) {
      maxPrice = variant.price;
    }
  });
  return maxPrice;
});

// Virtual for minimum original price
productSchema.virtual('minOriginalPrice').get(function(this: any) {
  if (!this.variants || !Array.isArray(this.variants)) {
    return 0;
  }
  let minOriginalPrice = Infinity;
  this.variants.forEach((variant: any) => {
    if (variant.originalPrice && variant.originalPrice < minOriginalPrice) {
      minOriginalPrice = variant.originalPrice;
    }
  });
  return minOriginalPrice === Infinity ? 0 : minOriginalPrice;
});

// Virtual for maximum original price
productSchema.virtual('maxOriginalPrice').get(function(this: any) {
  if (!this.variants || !Array.isArray(this.variants)) {
    return 0;
  }
  let maxOriginalPrice = 0;
  this.variants.forEach((variant: any) => {
    if (variant.originalPrice && variant.originalPrice > maxOriginalPrice) {
      maxOriginalPrice = variant.originalPrice;
    }
  });
  return maxOriginalPrice;
});

// Virtual for maximum discount percentage across all variants
productSchema.virtual('maxDiscount').get(function(this: any) {
  if (!this.variants || !Array.isArray(this.variants)) {
    return 0;
  }
  let maxDiscount = 0;
  this.variants.forEach((variant: any) => {
    if (variant.originalPrice && variant.price && variant.originalPrice > variant.price) {
      const discount = Math.round(((variant.originalPrice - variant.price) / variant.originalPrice) * 100);
      if (discount > maxDiscount) {
        maxDiscount = discount;
      }
    }
  });
  return maxDiscount;
});

// Virtual for total stock
productSchema.virtual('totalStock').get(function(this: any) {
  if (!this.variants || !Array.isArray(this.variants)) {
    return 0;
  }
  let totalStock = 0;
  this.variants.forEach((variant: any) => {
    if (variant.stock && typeof variant.stock === 'number') {
      totalStock += variant.stock;
    }
  });
  return totalStock;
});

export const Product = mongoose.model<IProduct>('Product', productSchema);