import { Request } from 'express';
import { Document } from 'mongoose';
import mongoose from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  isVerified: boolean;
  addresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddress {
  _id?: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
}

// Product Types
export interface IProduct extends Document {
  _id: string;
  name: string;
  description: string;
  category: string;
  subCategory: string;
  brand: string;
  images: string[];
  variants: IProductVariant[];
  specifications: IProductSpecification;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductVariant {
  _id?: string;
  color: string;
  colorCode?: string;
  sizes: IProductSize[];
  images: string[];
}

export interface IProductSize {
  size: string;
  price: number;
  originalPrice: number;
  discount: number;
  stock: number;
}

export interface IProductSpecification {
  fabric?: string;
  fit?: string;
  washCare?: string;
  material?: string;
  capacity?: string;
  microwaveSafe?: boolean;
  dimensions?: string;
  weight?: string;
}

// Category Types
export interface ICategory extends Document {
  _id: string;
  name: string;
  slug: string;
  parentCategory?: mongoose.Types.ObjectId;
  level: number;
  image?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Cart Types
export interface ICart extends Document {
  _id: string;
  userId: string;
  items: ICartItem[];
  totalAmount: number;
  totalDiscount: number;
  subtotal: number;
  couponDiscount?: number;
  appliedCoupon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartItem {
  _id?: string;
  product: string;
  variantId: string;
  size: string;
  quantity: number;
  price: number;
  originalPrice: number;
  discount: number;
  isSelected: boolean;
}

// Wishlist Types
export interface IWishlist extends Document {
  _id: string;
  userId: string;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IWishlistItem {
  _id?: string;
  product: string;
  variantId?: string;
  addedAt: Date;
}

// Order Types
export interface IOrder extends Document {
  _id: string;
  orderNumber: string;
  userId: string;
  items: IOrderItem[];
  shippingAddress: IAddress;
  billingAddress?: IAddress;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  totalAmount: number;
  discount: number;
  platformFee: number;
  deliveryCharge: number;
  finalAmount: number;
  couponCode?: string;
  couponDiscount?: number;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  returnRequestedAt?: Date;
  returnedAt?: Date;
  cancellationReason?: string;
  returnReason?: string;
  trackingId?: string;
  paymentId?: string;
  paymentIntentId?: string;
  paidAt?: Date;
  refundId?: string;
  refundAmount?: number;
  refundStatus?: RefundStatus;
  refundReason?: string;
  refundInitiatedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItem {
  _id?: string;
  product: string;
  variantId: string;
  size: string;
  quantity: number;
  price: number;
  originalPrice: number;
  discount: number;
  status: OrderItemStatus;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURN_REQUESTED = 'return_requested',
  RETURNED = 'returned'
}

export enum OrderItemStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned'
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIAL_REFUNDED = 'partial_refunded'
}

export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed'
}

// Support Types
export interface ISupport extends Document {
  _id: string;
  ticketId: string;
  userId: string;
  orderNumber?: string;
  subject: string;
  description: string;
  category: SupportCategory;
  priority: SupportPriority;
  status: SupportStatus;
  messages: ISupportMessage[];
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISupportMessage {
  _id?: string;
  senderId: string;
  senderType: 'user' | 'agent';
  message: string;
  attachments?: string[];
  timestamp: Date;
}

export enum SupportCategory {
  ORDER_ISSUE = 'order_issue',
  PAYMENT_ISSUE = 'payment_issue',
  PRODUCT_ISSUE = 'product_issue',
  DELIVERY_ISSUE = 'delivery_issue',
  RETURN_REFUND = 'return_refund',
  ACCOUNT_ISSUE = 'account_issue',
  GENERAL_INQUIRY = 'general_inquiry'
}

export enum SupportPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum SupportStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_FOR_CUSTOMER = 'waiting_for_customer',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

// OTP Types
export interface IOTP extends Document {
  _id: string;
  phone: string;
  otp: string;
  expiresAt: Date;
  isUsed: boolean;
  attempts: number;
  createdAt: Date;
  isExpired(): boolean;
  maxAttemptsReached(): boolean;
}

export interface IOTPModel extends mongoose.Model<IOTP> {
  generateOTP(): string;
  createOTP(phone: string): Promise<{ otp: string; expiresAt: Date }>;
  verifyOTP(phone: string, otp: string): Promise<boolean>;
}

// Coupon Types
export interface ICoupon extends Document {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
  applicableCategories?: string[];
  applicableProducts?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Request Types
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    id: string;
    phone: string;
    isVerified: boolean;
  };
  body: any;
  params: any;
  query: any;
  headers: any;
}

// Filter and Sort Types
export interface ProductFilters {
  category?: string;
  subCategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  fabric?: string;
  fit?: string;
  material?: string;
  microwaveSafe?: boolean;
  inStock?: boolean;
}

export interface ProductSort {
  field: 'price' | 'name' | 'createdAt' | 'popularity';
  order: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// Payment Types
export interface PaymentRequest {
  orderNumber: string;
  amount: number;
  currency: string;
  customerDetails: {
    customerId: string;
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
  };
  returnUrl: string;
  notifyUrl: string;
}

export interface PaymentResponse {
  paymentSessionId: string;
  paymentUrl: string;
  orderNumber: string;
}

// File Upload Types
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

export interface S3UploadResult {
  url: string;
  key: string;
  bucket: string;
}