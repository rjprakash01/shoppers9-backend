import mongoose, { Schema, Document } from 'mongoose';

export interface IProductSpecification {
  fabric?: string;
  material?: string;
  pattern?: string;
  weave?: string;
  finish?: string;
  fit?: string;
  neckline?: string;
  sleeves?: string;
  length?: string;
  rise?: string;
  washCare?: string;
  dryClean?: boolean;
  ironingInstructions?: string;
  dimensions?: string;
  weight?: string;
  capacity?: string;
  volume?: string;
  features?: string[];
  technology?: string[];
  certifications?: string[];
  microwaveSafe?: boolean;
  dishwasherSafe?: boolean;
  foodGrade?: boolean;
  bpaFree?: boolean;
  powerConsumption?: string;
  voltage?: string;
  warranty?: string;
  occasion?: string;
  season?: string;
  transparency?: string;
  stretch?: string;
  roomType?: string;
  style?: string;
  assemblyRequired?: boolean;
  countryOfOrigin?: string;
  brand?: string;
  modelNumber?: string;
  color?: string;
  size?: string;
  customSpecs?: Array<{
    label: string;
    value: string;
    category?: string;
  }>;
}

export interface IProductVariant {
  _id?: string;
  color: string;
  colorCode?: string;
  size: string;
  price: number;
  originalPrice: number;
  stock: number;
  sku: string;
  images?: string[];
}

export interface IProduct extends Document {
  name: string;
  description: string;
  category: mongoose.Types.ObjectId;
  subCategory?: mongoose.Types.ObjectId;
  subSubCategory?: mongoose.Types.ObjectId;
  brand: string;
  images: string[];
  variants: IProductVariant[];
  specifications?: IProductSpecification;
  tags: string[];
  status: 'active' | 'inactive' | 'draft';
  isActive: boolean;
  isApproved: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  averageRating: number;
  totalReviews: number;
  reviewStatus: 'draft' | 'pending' | 'approved' | 'rejected' | 'changes_requested';
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'needs_changes';
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  submittedForReviewAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const productSpecificationSchema = new Schema<IProductSpecification>({
  fabric: String,
  material: String,
  pattern: String,
  weave: String,
  finish: String,
  fit: String,
  neckline: String,
  sleeves: String,
  length: String,
  rise: String,
  washCare: String,
  dryClean: Boolean,
  ironingInstructions: String,
  dimensions: String,
  weight: String,
  capacity: String,
  volume: String,
  features: [String],
  technology: [String],
  certifications: [String],
  microwaveSafe: Boolean,
  dishwasherSafe: Boolean,
  foodGrade: Boolean,
  bpaFree: Boolean,
  powerConsumption: String,
  voltage: String,
  warranty: String,
  occasion: String,
  season: String,
  transparency: String,
  stretch: String,
  roomType: String,
  style: String,
  assemblyRequired: Boolean,
  countryOfOrigin: String,
  brand: String,
  modelNumber: String,
  color: String,
  size: String,
  customSpecs: [{
    label: String,
    value: String,
    category: String
  }]
}, { _id: false });

const productVariantSchema = new Schema<IProductVariant>({
  color: { type: String, required: true },
  colorCode: String,
  size: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  stock: { type: Number, required: true, min: 0 },
  sku: { type: String, required: true },
  images: [String]
});

// Note: Empty variants array is handled in the controller by creating a default variant

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subSubCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  brand: { type: String, required: true },
  images: [String],
  variants: [productVariantSchema],
  specifications: productSpecificationSchema,
  tags: [String],
  status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'active' },
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0, min: 0 },
  reviewStatus: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'changes_requested'],
    default: 'pending'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs_changes'],
    default: 'pending'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  approvedAt: Date,
  submittedForReviewAt: Date
}, {
  timestamps: true
});

// Create indexes for better performance
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isApproved: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isTrending: 1 });
productSchema.index({ approvalStatus: 1 });
productSchema.index({ reviewStatus: 1 });

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;
export { Product };