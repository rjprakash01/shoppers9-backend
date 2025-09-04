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
  //   required: false,
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
productSchema.index({ createdAt: -1 });
productSchema.index({ 'variants.sizes.price': 1 });

// Virtual for minimum price calculation
productSchema.virtual('minPrice').get(function() {
  if (!this.variants || this.variants.length === 0) return 0;
  
  let minPrice = Infinity;
  this.variants.forEach((variant: any) => {
    variant.sizes.forEach((size: any) => {
      if (size.price < minPrice) {
        minPrice = size.price;
      }
    });
  });
  
  return minPrice === Infinity ? 0 : minPrice;
});

// Virtual for maximum price calculation
productSchema.virtual('maxPrice').get(function() {
  if (!this.variants || this.variants.length === 0) return 0;
  
  let maxPrice = 0;
  this.variants.forEach((variant: any) => {
    variant.sizes.forEach((size: any) => {
      if (size.price > maxPrice) {
        maxPrice = size.price;
      }
    });
  });
  
  return maxPrice;
});

// Virtual for total stock calculation
productSchema.virtual('totalStock').get(function() {
  if (!this.variants || this.variants.length === 0) return 0;
  
  let totalStock = 0;
  this.variants.forEach((variant: any) => {
    variant.sizes.forEach((size: any) => {
      totalStock += size.stock || 0;
    });
  });
  
  return totalStock;
});

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;