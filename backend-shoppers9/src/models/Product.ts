import mongoose, { Schema } from 'mongoose';
import { IProduct, IProductVariant, IProductSize, IProductSpecification } from '../types';

const productSizeSchema = new Schema<IProductSize>({
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
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  // sku: {
  //   type: String,
  //   required: true,
  //   trim: true
  // }
});

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
  sizes: [productSizeSchema],
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

const productSchema = new Schema<IProduct>({
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
  images: [{
    type: String,
    required: true
  }],
  variants: [productVariantSchema],
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
    if (variant.sizes && Array.isArray(variant.sizes)) {
      variant.sizes.forEach((size: any) => {
        if (size.price < minPrice) {
          minPrice = size.price;
        }
      });
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
    if (variant.sizes && Array.isArray(variant.sizes)) {
      variant.sizes.forEach((size: any) => {
        if (size.price > maxPrice) {
          maxPrice = size.price;
        }
      });
    }
  });
  return maxPrice;
});

// Virtual for total stock
productSchema.virtual('totalStock').get(function(this: any) {
  if (!this.variants || !Array.isArray(this.variants)) {
    return 0;
  }
  let totalStock = 0;
  this.variants.forEach((variant: any) => {
    if (variant.sizes && Array.isArray(variant.sizes)) {
      variant.sizes.forEach((size: any) => {
        totalStock += size.stock;
      });
    }
  });
  return totalStock;
});

export const Product = mongoose.model<IProduct>('Product', productSchema);