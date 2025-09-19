import mongoose, { Schema } from 'mongoose';
import { IProduct, IProductVariant, IAvailableColor, IAvailableSize, IProductSpecification } from '../types';

// Available Color schema (from admin panel)
const availableColorSchema = new Schema({
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
    type: String,
    required: false
  }]
});

// Available Size schema (from admin panel)
const availableSizeSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  }
});

// Product Variant schema (color-size combination)
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
    required: false
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
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subSubCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: false
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    min: 0,
    required: false
  },
  originalPrice: {
    type: Number,
    min: 0,
    required: false
  },
  images: [{
    type: String,
    required: true
  }],
  availableColors: [availableColorSchema],
  availableSizes: [availableSizeSchema],
  variants: [productVariantSchema],
  displayFilters: [{
    type: String,
    trim: true
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
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Virtual for filter values
productSchema.virtual('filterValues', {
  ref: 'ProductFilterValue',
  localField: '_id',
  foreignField: 'product'
});

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, subCategory: 1, subSubCategory: 1 });
productSchema.index({ category: 1, subCategory: 1 });
productSchema.index({ subSubCategory: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isTrending: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'variants.price': 1 });
productSchema.index({ createdBy: 1 });
productSchema.index({ createdBy: 1, isActive: 1 });

// Virtual for minimum price calculation
productSchema.virtual('minPrice').get(function() {
  if (!this.variants || this.variants.length === 0) return 0;
  
  let minPrice = Infinity;
  this.variants.forEach((variant: any) => {
    if (variant.price < minPrice) {
      minPrice = variant.price;
    }
  });
  
  return minPrice === Infinity ? 0 : minPrice;
});

// Virtual for maximum price calculation
productSchema.virtual('maxPrice').get(function() {
  if (!this.variants || this.variants.length === 0) return 0;
  
  let maxPrice = 0;
  this.variants.forEach((variant: any) => {
    if (variant.price > maxPrice) {
      maxPrice = variant.price;
    }
  });
  
  return maxPrice;
});

// Virtual for minimum original price calculation
productSchema.virtual('minOriginalPrice').get(function() {
  if (!this.variants || this.variants.length === 0) return 0;
  
  let minOriginalPrice = Infinity;
  this.variants.forEach((variant: any) => {
    if (variant.originalPrice && variant.originalPrice < minOriginalPrice) {
      minOriginalPrice = variant.originalPrice;
    }
  });
  
  return minOriginalPrice === Infinity ? 0 : minOriginalPrice;
});

// Virtual for maximum original price calculation
productSchema.virtual('maxOriginalPrice').get(function() {
  if (!this.variants || this.variants.length === 0) return 0;
  
  let maxOriginalPrice = 0;
  this.variants.forEach((variant: any) => {
    if (variant.originalPrice && variant.originalPrice > maxOriginalPrice) {
      maxOriginalPrice = variant.originalPrice;
    }
  });
  
  return maxOriginalPrice;
});

// Virtual for maximum discount percentage calculation
productSchema.virtual('maxDiscount').get(function() {
  if (!this.variants || this.variants.length === 0) return 0;
  
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

// Virtual for total stock calculation
productSchema.virtual('totalStock').get(function() {
  if (!this.variants || this.variants.length === 0) return 0;
  
  let totalStock = 0;
  this.variants.forEach((variant: any) => {
    totalStock += variant.stock || 0;
  });
  
  return totalStock;
});

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;