import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  category: any;
  subCategory?: any;
  brand: string;
  price?: number;
  discountedPrice?: number;
  originalPrice?: number;
  stock?: number;
  images: string[];
  variants: Array<{
    size?: string;
    color?: string;
    price: number;
    discountedPrice?: number;
    stock: number;
    sku: string;
    images?: string[];
  }>;
  specifications: Record<string, any>;
  tags: string[];
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'needs_changes';
  isActive: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  totalStock?: number;
}

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: Schema.Types.Mixed,
    required: true
  },
  subCategory: {
    type: Schema.Types.Mixed
  },
  brand: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    min: 0
  },
  discountedPrice: {
    type: Number,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  stock: {
    type: Number,
    min: 0
  },
  images: {
    type: [String],
    default: []
  },
  variants: [{
    size: String,
    color: String,
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discountedPrice: {
      type: Number,
      min: 0
    },
    stock: {
      type: Number,
      required: true,
      min: 0
    },
    sku: {
      type: String,
      required: true,
      unique: true
    },
    images: [String]
  }],
  specifications: {
    type: Schema.Types.Mixed,
    default: {}
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'rejected'],
    default: 'pending'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs_changes'],
    default: 'pending'
  },
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
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    min: 0,
    default: 0
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create indexes for better performance
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ status: 1 });
productSchema.index({ approvalStatus: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isTrending: 1 });
productSchema.index({ 'variants.sku': 1 });

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;
export { productSchema };