import { Request } from 'express';
import { Document } from 'mongoose';
import mongoose from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  password?: string;
  authMethod: 'phone' | 'email' | 'both';
  isVerified: boolean;
  isEmailVerified?: boolean;
  addresses: IAddress[];
  lastLogin?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  loginAttempts?: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Methods
  comparePassword?(candidatePassword: string): Promise<boolean>;
  isLocked?(): boolean;
  incLoginAttempts?(): Promise<IUser>;
}

export interface IAddress {
  _id?: string;
  id?: string;
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
  category: mongoose.Types.ObjectId;
  subCategory: mongoose.Types.ObjectId;
  subSubCategory?: mongoose.Types.ObjectId;
  brand: string;
  images: string[]; // Master/Default images
  variants: IProductVariant[]; // Color-size combinations
  availableColors: IAvailableColor[]; // Master color list
  availableSizes: IAvailableSize[]; // Master size list
  specifications: IProductSpecification;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  displayFilters: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  // Virtual fields
  minPrice?: number;
  maxPrice?: number;
  totalStock?: number;
}

// Each variant represents a unique color-size combination
export interface IProductVariant {
  _id?: string;
  color: string;
  colorCode?: string;
  size: string;
  price: number;
  originalPrice: number;
  stock: number;
  sku: string; // Unique SKU for this variant
  images: string[]; // Variant-specific images
}

// Available colors for the master product
export interface IAvailableColor {
  name: string;
  code: string;
  images: string[];
}

// Available sizes for the master product
export interface IAvailableSize {
  name: string;
}

// Legacy interface for backward compatibility
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
  userId: mongoose.Types.ObjectId;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IWishlistItem {
  _id?: string;
  product: mongoose.Types.ObjectId;
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
  // Methods
  addMessage(senderId: string, senderType: 'user' | 'agent', message: string, attachments?: string[]): Promise<ISupport>;
  assignTo(agentId: string): Promise<ISupport>;
  updateStatus(status: SupportStatus): Promise<ISupport>;
  updatePriority(priority: SupportPriority): Promise<ISupport>;
  closeTicket(): Promise<ISupport>;
  reopenTicket(): Promise<ISupport>;
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
  showOnWebsite: boolean;
  validFrom: Date;
  validUntil: Date;
  applicableCategories?: string[];
  applicableProducts?: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  canBeUsed(orderAmount: number, categoryIds?: string[], productIds?: string[]): { valid: boolean; reason?: string };
  calculateDiscount(orderAmount: number): number;
  incrementUsage(): Promise<ICoupon>;
  decrementUsage(): Promise<ICoupon>;
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

// Analytics Types
export interface ISalesAnalytics extends Document {
  _id: string;
  date: Date;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageOrderValue: number;
  totalProducts: number;
  conversionRate: number;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    revenue: number;
    orders: number;
    products: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    revenue: number;
    orders: number;
    quantity: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  refunds: {
    count: number;
    amount: number;
  };
  cancellations: {
    count: number;
    amount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerAnalytics extends Document {
  _id: string;
  customerId: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  firstOrderDate: Date;
  lastOrderDate: Date;
  daysSinceLastOrder: number;
  customerLifetimeValue: number;
  customerSegment: 'new' | 'regular' | 'vip' | 'at_risk' | 'churned';
  favoriteCategories: Array<{
    categoryId: string;
    categoryName: string;
    orderCount: number;
    totalSpent: number;
  }>;
  purchaseFrequency: number;
  returnRate: number;
  refundRate: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversionTracking extends Document {
  _id: string;
  sessionId: string;
  customerId?: string;
  events: Array<{
    eventType: 'page_view' | 'product_view' | 'add_to_cart' | 'remove_from_cart' | 'add_to_wishlist' | 'checkout_start' | 'payment_info' | 'purchase' | 'search' | 'category_view' | 'coupon_apply' | 'signup' | 'login';
    timestamp: Date;
    data?: any;
    value?: number;
    productId?: string;
    categoryId?: string;
    orderId?: string;
  }>;
  source: 'direct' | 'search' | 'social' | 'email' | 'referral' | 'paid';
  medium?: string;
  campaign?: string;
  device: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
  converted: boolean;
  conversionValue: number;
  funnelStage: 'awareness' | 'interest' | 'consideration' | 'purchase' | 'retention';
  sessionDuration?: number;
  pageViews: number;
  bounceRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductAnalytics extends Document {
  _id: string;
  productId: string;
  date: Date;
  period: 'daily' | 'weekly' | 'monthly';
  views: number;
  uniqueViews: number;
  addToCart: number;
  addToWishlist: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
  cartAbandonmentRate: number;
  averageRating: number;
  reviewCount: number;
  returnRate: number;
  stockLevel?: number;
  priceChanges: Array<{
    oldPrice: number;
    newPrice: number;
    changeDate: Date;
    reason: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMarketingAnalytics extends Document {
  _id: string;
  campaignId: string;
  campaignName: string;
  campaignType: 'email' | 'social' | 'search' | 'display' | 'affiliate' | 'coupon';
  startDate: Date;
  endDate?: Date;
  budget?: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
  roi: number;
  targetAudience?: {
    ageRange?: string;
    gender?: string;
    location?: string[];
    interests?: string[];
  };
  performance: Array<{
    date: Date;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    spent: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsDashboard {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    conversionRate: number;
    averageOrderValue: number;
    growthRate: number;
  };
  salesTrends: Array<{
    date: string;
    revenue: number;
    orders: number;
    customers: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    revenue: number;
    orders: number;
    conversionRate: number;
  }>;
  customerSegments: Array<{
    segment: string;
    count: number;
    percentage: number;
    averageValue: number;
  }>;
  conversionFunnel: Array<{
    stage: string;
    count: number;
    conversionRate: number;
  }>;
  trafficSources: Array<{
    source: string;
    visitors: number;
    conversions: number;
    revenue: number;
  }>;
}

export interface RevenueReport {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  growthRate: number;
  breakdown: {
    byCategory: Array<{
      categoryName: string;
      revenue: number;
      percentage: number;
    }>;
    byPaymentMethod: Array<{
      method: string;
      revenue: number;
      percentage: number;
    }>;
    byRegion: Array<{
      region: string;
      revenue: number;
      percentage: number;
    }>;
  };
  trends: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export interface CustomerReport {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerLifetimeValue: number;
  churnRate: number;
  retentionRate: number;
  segments: Array<{
    segment: string;
    count: number;
    percentage: number;
    averageValue: number;
    averageOrders: number;
  }>;
  cohortAnalysis: Array<{
    cohort: string;
    customers: number;
    retentionRates: number[];
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalSpent: number;
    totalOrders: number;
    lastOrderDate: Date;
  }>;
}

export interface ConversionReport {
  overallConversionRate: number;
  funnelStages: Array<{
    stage: string;
    visitors: number;
    conversionRate: number;
    dropOffRate: number;
  }>;
  trafficSources: Array<{
    source: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
  }>;
  pagePerformance: Array<{
    page: string;
    views: number;
    uniqueViews: number;
    bounceRate: number;
    conversionRate: number;
  }>;
}

// Request Types
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    id: string;
    phone?: string;
    email?: string;
    authMethod?: 'phone' | 'email' | 'both';
    isVerified: boolean;
    isAdmin?: boolean;
    adminRole?: string;
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

// Shipping Types
export interface IShippingProvider extends Document {
  _id: string;
  name: string;
  code: string;
  description?: string;
  logo?: string;
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
    supportUrl?: string;
  };
  apiConfig: {
    baseUrl?: string;
    apiKey?: string;
    secretKey?: string;
    trackingUrl?: string;
    webhookUrl?: string;
  };
  capabilities: {
    tracking: boolean;
    realTimeRates: boolean;
    pickupScheduling: boolean;
    insurance: boolean;
    codSupport: boolean;
  };
  serviceAreas: Array<{
    name: string;
    pincodes: string[];
    isActive: boolean;
  }>;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IShippingRate extends Document {
  _id: string;
  providerId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  serviceType: 'standard' | 'express' | 'overnight' | 'same_day';
  deliveryTime: {
    min: number;
    max: number;
  };
  rateStructure: {
    type: 'flat' | 'weight_based' | 'distance_based' | 'value_based';
    baseRate: number;
    weightRanges?: Array<{
      minWeight: number;
      maxWeight: number;
      rate: number;
    }>;
    distanceRanges?: Array<{
      minDistance: number;
      maxDistance: number;
      rate: number;
    }>;
    valuePercentage?: number;
  };
  zones: Array<{
    name: string;
    pincodes: string[];
    multiplier: number;
  }>;
  freeShippingThreshold?: number;
  maxWeight: number;
  maxValue: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITrackingEvent {
  _id?: string;
  status: 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed_delivery' | 'returned';
  location: string;
  description: string;
  timestamp: Date;
  estimatedDelivery?: Date;
}

export interface IShipment extends Document {
  _id: string;
  shipmentId: string;
  orderNumber: string;
  providerId: mongoose.Types.ObjectId;
  trackingNumber: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed_delivery' | 'returned';
  shippingAddress: IAddress;
  packageDetails: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    value: number;
    description: string;
  };
  shippingCost: number;
  estimatedDelivery: Date;
  actualDelivery?: Date;
  trackingEvents: ITrackingEvent[];
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Virtual fields
  currentLocation?: string;
  isDelivered?: boolean;
  isInTransit?: boolean;
  // Methods
  addTrackingEvent(status: string, location: string, description: string, estimatedDelivery?: Date): Promise<IShipment>;
  updateStatus(status: string, location?: string, description?: string): Promise<IShipment>;
}

export enum ShippingStatus {
  PENDING = 'pending',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED_DELIVERY = 'failed_delivery',
  RETURNED = 'returned'
}

export enum ServiceType {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
  SAME_DAY = 'same_day'
}

export interface ShippingCalculationRequest {
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  value: number;
  fromPincode: string;
  toPincode: string;
  serviceType?: ServiceType;
  providerId?: string;
}

export interface ShippingOption {
  providerId: string;
  providerName: string;
  serviceType: 'standard' | 'express' | 'overnight' | 'same_day';
  serviceName: string;
  cost: number;
  deliveryTime: {
    min: number;
    max: number;
  };
  estimatedDelivery: Date;
  isFreeShipping: boolean;
}

export interface TrackingInfo {
  shipmentId: string;
  trackingNumber: string;
  status: ShippingStatus;
  currentLocation?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  trackingEvents: ITrackingEvent[];
  providerInfo: {
    name: string;
    trackingUrl?: string;
  };
}