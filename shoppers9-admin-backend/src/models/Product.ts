import mongoose, { Schema } from 'mongoose';
import { IProduct } from '../types';

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
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  category: {
    type: String,
    ref: 'Category',
    required: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  images: [{
    type: String,
    required: true
  }],
  thumbnail: {
    type: String
  },
  specifications: {
    type: Schema.Types.Mixed
  },
  features: [{
    type: String,
    trim: true
  }],
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
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed']
    },
    value: {
      type: Number,
      min: 0
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  seo: {
    title: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    keywords: [{
      type: String,
      trim: true
    }]
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin'
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin'
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

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ sku: 1 });

// Virtual for effective price after discount
productSchema.virtual('effectivePrice').get(function() {
  if (this.discount && this.discount.value > 0) {
    const now = new Date();
    const discountActive = (!this.discount.startDate || now >= this.discount.startDate) &&
                          (!this.discount.endDate || now <= this.discount.endDate);
    
    if (discountActive) {
      if (this.discount.type === 'percentage') {
        return this.price - (this.price * this.discount.value / 100);
      } else {
        return Math.max(0, this.price - this.discount.value);
      }
    }
  }
  return this.price;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Pre-save middleware to generate SKU if not provided
productSchema.pre('save', function(next) {
  if (!(this as any).sku) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    (this as any).sku = `SKU-${timestamp}-${random}`;
  }
  
  // Set thumbnail to first image if not provided
  if (!(this as any).thumbnail && (this as any).images && (this as any).images.length > 0) {
    (this as any).thumbnail = (this as any).images[0];
  }
  
  next();
});

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;