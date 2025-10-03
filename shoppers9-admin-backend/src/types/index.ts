import mongoose, { Document, Types } from 'mongoose';
import { Request } from 'express';

// Authentication request interfaces
export interface AuthRequest extends Request {
  user?: IUser;
  admin?: IUser;
  permissions?: {
    module: string;
    action?: string;
    restrictions?: any;
  };
  resourceFilter?: any;
  dataFilter?: any;
}

export interface RBACRequest extends Request {
  user?: IUser;
  targetUser?: IUser;
}

export interface IAdmin extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  refreshToken?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends AuthRequest {
  admin: IUser;
}

export interface ICategory extends Document {
  name: string;
  description?: string;
  slug?: string;
  image?: string;
  parentCategory?: Types.ObjectId | ICategory;
  level: number;
  sortOrder: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryFilter extends Document {
  category: Types.ObjectId;
  filter: Types.ObjectId;
  isRequired?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  category: Types.ObjectId | ICategory;
  subCategory?: Types.ObjectId | ICategory;
  brand: string;
  price?: number;
  discountedPrice?: number;
  originalPrice?: number;
  stock?: number;
  images: string[];
  variants: IProductVariant[];
  specifications: Record<string, any>;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  rating?: number;
  reviewCount?: number;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductVariant {
  color: string;
  colorCode?: string;
  size: string;
  price: number;
  discountedPrice?: number;
  originalPrice?: number;
  stock: number;
  images: string[];
  sku?: string;
}

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  link: string;
  buttonText?: string;
  isActive: boolean;
  order: number;
  displayType: 'hero' | 'carousel' | 'sidebar';
  category?: Types.ObjectId | ICategory;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFilter extends Document {
  name: string;
  displayName: string;
  type: 'single' | 'multiple' | 'range';
  dataType: 'string' | 'number' | 'boolean';
  description?: string;
  categoryLevels?: number[];
  isActive: boolean;
  sortOrder: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFilterOption extends Document {
  filter: Types.ObjectId | IFilter;
  value: string;
  displayValue: string;
  colorCode?: string;
  isActive: boolean;
  sortOrder: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFilterAssignment extends Document {
  filter: Types.ObjectId;
  category: Types.ObjectId;
  categoryLevel: number;
  parentAssignment?: Types.ObjectId;
  isRequired?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  assignedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFilterAssignmentModel extends mongoose.Model<IFilterAssignment> {
  getHierarchicalFilters(categoryId: mongoose.Types.ObjectId): Promise<any>;
  findByCategory(categoryId: mongoose.Types.ObjectId, includeInactive?: boolean): Promise<any>;
  findByFilter(filterId: mongoose.Types.ObjectId, includeInactive?: boolean): Promise<any>;
  findAvailableFiltersForCategory(categoryId: mongoose.Types.ObjectId): Promise<any>;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId: string;
  items: any[];
  shippingAddress: any;
  billingAddress: any;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  totalAmount: number;
  discount: number;
  platformFee: number;
  deliveryCharge: number;
  finalAmount: number;
  couponCode?: string;
  couponDiscount: number;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  returnedAt?: Date;
  trackingId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductFilterValue extends Document {
  product: Types.ObjectId;
  filter: Types.ObjectId;
  filterOption?: Types.ObjectId;
  value: string;
  customValue?: string;
  isActive?: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductReview extends Document {
  product: Types.ObjectId;
  user: Types.ObjectId;
  submittedBy?: Types.ObjectId;
  submittedAt?: Date;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  requestedChanges?: string;
  version?: number;
  isActive?: boolean;
  rating: number;
  title: string;
  comment: string;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  comments: IReviewComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IReviewComment extends Document {
  review: Types.ObjectId;
  user: Types.ObjectId;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  action?: string;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ReviewStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  isActive: boolean;
  isVerified: boolean;
  isAdmin?: boolean;
  isLocked?: boolean;
  lastLogin?: Date;
  roles?: Types.ObjectId[];
  primaryRole?: string;
  sellerInfo?: any;
  adminInfo?: any;
  security?: any;
  createdBy?: Types.ObjectId;
  suspendedBy?: Types.ObjectId;
  suspendedAt?: Date;
  suspensionReason?: string;
  addresses: any[];
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  preferences?: any;
  canManage?: (targetUser: any) => boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserRole extends Document {
  user: Types.ObjectId;
  role: Types.ObjectId;
  assignedBy: Types.ObjectId;
  assignedAt: Date;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserRoleModel extends mongoose.Model<IUserRole> {
  getUserPermissions(userId: Types.ObjectId): Promise<any>;
}

export interface UserQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}