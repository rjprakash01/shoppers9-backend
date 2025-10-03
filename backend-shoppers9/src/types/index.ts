import { Document, Types, Model } from 'mongoose';
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    [key: string]: any;
  };
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
  isDefault?: boolean;
  type?: 'home' | 'work' | 'other';
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  addresses: IAddress[];
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isVerified?: boolean;
  role: 'user' | 'admin';
  authMethod?: 'email' | 'google' | 'facebook' | 'phone' | 'both';
  lastLogin?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  loginAttempts?: number;
  lockUntil?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  phoneVerificationToken?: string;
  phoneVerificationExpires?: Date;
  refreshTokens?: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword?(password: string): Promise<boolean>;
  incLoginAttempts?(): Promise<void>;
  generateAuthToken?(): string;
  generateRefreshToken?(): string;
  isLocked?(): boolean;
}

export interface IOTP extends Document {
  phone: string;
  otp: string;
  purpose: 'registration' | 'login' | 'password_reset' | 'phone_verification';
  isUsed: boolean;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOTPModel extends Model<IOTP> {
  generateOTP(): string;
  createOTP(phone: string): Promise<{ otp: string; expiresAt: Date }>;
  verifyOTP(phone: string, otp: string): Promise<boolean>;
  cleanupExpiredOTPs(): Promise<void>;
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

export interface ICart extends Document {
  userId: string;
  items: ICartItem[];
  totalAmount: number;
  totalDiscount: number;
  subtotal: number;
  couponDiscount: number;
  appliedCoupon?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  calculateTotal?(): void;
  addItem?(productId: string, variant?: any, quantity?: number): Promise<void>;
  removeItem?(productId: string, variant?: any): Promise<void>;
  updateQuantity?(productId: string, variant: any, quantity: number): Promise<void>;
  clearCart?(): Promise<void>;
}

export interface IWishlistItem {
  product: Types.ObjectId;
  variantId?: string;
  addedAt: Date;
}

export interface IWishlist extends Document {
  userId: Types.ObjectId;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  addItem?(productId: string, variantId?: string): Promise<void>;
  removeItem?(productId: string, variantId?: string): Promise<void>;
  clearWishlist?(): Promise<void>;
}

// Order related enums
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
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export enum RefundStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSED = 'processed'
}

// Order related interfaces
export interface IOrderItem {
  product: Types.ObjectId;
  variantId: string;
  size: string;
  quantity: number;
  price: number;
  originalPrice: number;
  discount: number;
  status: OrderItemStatus;
  sellerId?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId: string;
  items: IOrderItem[];
  shippingAddress: IAddress;
  billingAddress?: IAddress;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  paymentIntentId?: string;
  refundId?: string;
  refundAmount?: number;
  refundStatus?: RefundStatus;
  refundReason?: string;
  orderStatus: OrderStatus;
  totalAmount: number;
  discount: number;
  platformFee: number;
  deliveryFee: number;
  deliveryCharge: number;
  finalAmount: number;
  couponCode?: string;
  couponDiscount: number;
  notes?: string;
  cancellationReason?: string;
  returnReason?: string;
  trackingNumber?: string;
  trackingId?: string;
  estimatedDelivery?: Date;
  paidAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  returnRequestedAt?: Date;
  returnedAt?: Date;
  refundInitiatedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  updateStatus?(status: OrderStatus): Promise<void>;
  canBeCancelled?(): boolean;
  canBeReturned?(): boolean;
}

export interface ICategory extends Document {
  name: string;
  description?: string;
  slug: string;
  image?: string;
  parentCategory?: Types.ObjectId | ICategory;
  level: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ProductFilters {
  category?: string;
  subCategory?: string;
  subSubCategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string[];
  color?: string[];
  material?: string[];
  fabric?: string[];
  search?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  approvalStatus?: string;
  sellerId?: string;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface IProduct extends Document {
  name: string;
  description: string;
  category: Types.ObjectId | ICategory;
  subCategory?: Types.ObjectId | ICategory;
  brand: string;
  images: string[];
  variants: any[];
  specifications: Record<string, any>;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
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

export interface IShipment extends Document {
  orderId: Types.ObjectId;
  trackingNumber: string;
  status: ShippingStatus;
  provider: string;
  providerId?: string;
  orderNumber?: string;
  shipmentId?: string;
  currentLocation?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  trackingEvents?: TrackingEvent[];
  shippingAddress: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
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
  notes?: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
  addTrackingEvent: (status: string, location?: string, description?: string, estimatedDelivery?: Date) => Promise<void>;
}

export interface ShippingCalculationRequest {
  fromPincode: string;
  toPincode: string;
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  value: number;
  serviceType?: ServiceType;
  providerId?: string;
}

export interface ShippingOption {
  providerId: string;
  providerName: string;
  serviceType: ServiceType;
  cost: number;
  estimatedDays: number;
  description?: string;
  isFreeShipping?: boolean;
  serviceName?: string;
  deliveryTime?: {
    min: number;
    max: number;
  };
  estimatedDelivery?: Date;
}

export interface TrackingInfo {
  trackingNumber: string;
  status: ShippingStatus;
  events?: TrackingEvent[];
  estimatedDelivery?: Date;
  shipmentId?: string;
  currentLocation?: string;
  actualDelivery?: Date;
  trackingEvents?: TrackingEvent[];
  providerInfo?: any;
}

export interface TrackingEvent {
  timestamp: Date;
  status: string;
  location?: string;
  description: string;
  estimatedDelivery?: Date;
}

export enum ServiceType {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight'
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

export interface ICoupon extends Document {
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
  applicableCategories?: Types.ObjectId[];
  applicableProducts?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  isExpired: boolean;
  isValid: boolean;
  remainingUses: number;
  usagePercentage: number;
  
  // Methods
  canBeUsed(orderAmount: number, categoryIds?: string[], productIds?: string[]): {
    valid: boolean;
    reason?: string;
  };
  calculateDiscount(orderAmount: number): number;
  incrementUsage(): Promise<ICoupon>;
  decrementUsage(): Promise<ICoupon>;
}

export interface ISalesAnalytics extends Document {
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
    categoryId: Types.ObjectId;
    categoryName: string;
    revenue: number;
    orders: number;
    products: number;
  }>;
  topProducts: Array<{
    productId: Types.ObjectId;
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
  customerId: Types.ObjectId;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  firstOrderDate?: Date;
  lastOrderDate?: Date;
  daysSinceLastOrder?: number;
  customerLifetimeValue: number;
  customerSegment: 'new' | 'regular' | 'vip' | 'at_risk' | 'churned';
  favoriteCategories: Array<{
    categoryId: Types.ObjectId;
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
  sessionId: string;
  customerId?: Types.ObjectId;
  events: Array<{
    eventType: 'page_view' | 'product_view' | 'add_to_cart' | 'remove_from_cart' | 'add_to_wishlist' | 'remove_from_wishlist' | 'checkout_start' | 'checkout_complete' | 'purchase' | 'search' | 'filter' | 'sort' | 'share' | 'review' | 'contact';
    timestamp: Date;
    data?: any;
    value?: number;
    productId?: Types.ObjectId;
    categoryId?: Types.ObjectId;
    orderId?: Types.ObjectId;
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
  productId: Types.ObjectId;
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

// Support enums
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

// Support interfaces
export interface ISupportMessage {
  senderId: string;
  senderType: 'user' | 'agent';
  message: string;
  attachments?: string[];
  timestamp: Date;
}

export interface ISupport extends Document {
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
  addMessage(senderId: string, senderType: 'user' | 'agent', message: string, attachments?: string[]): Promise<ISupport>;
  assignTo(agentId: string): Promise<ISupport>;
  updateStatus(status: SupportStatus): Promise<ISupport>;
  updatePriority(priority: SupportPriority): Promise<ISupport>;
  closeTicket(): Promise<ISupport>;
  reopenTicket(): Promise<ISupport>;
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

export interface IShippingProvider extends Document {
  name: string;
  description?: string;
  logo?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
    supportUrl?: string;
  };
  apiConfig?: {
    baseUrl?: string;
    apiKey?: string;
    secretKey?: string;
    trackingUrl?: string;
    webhookUrl?: string;
  };
  capabilities?: {
    tracking?: boolean;
    realTimeRates?: boolean;
    pickupScheduling?: boolean;
    insurance?: boolean;
    codSupport?: boolean;
  };
  isActive: boolean;
  serviceAreas: any[];
  code: string;
  priority?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRateStructure {
  type: 'flat' | 'weight_based' | 'distance_based' | 'value_based';
  baseRate: number;
  valuePercentage?: number;
  weightRanges?: {
    minWeight: number;
    maxWeight: number;
    rate: number;
  }[];
  distanceRanges?: {
    minDistance: number;
    maxDistance: number;
    rate: number;
  }[];
  valueRanges?: {
    minValue: number;
    maxValue: number;
    rate: number;
  }[];
}

export interface IShippingRate extends Document {
  providerId: Types.ObjectId;
  name: string;
  description?: string;
  serviceType: ServiceType;
  zones: any[];
  rateStructure: IRateStructure;
  deliveryTime: {
    min: number;
    max: number;
  };
  freeShippingThreshold?: number;
  maxWeight: number;
  maxValue: number;
  isActive: boolean;
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