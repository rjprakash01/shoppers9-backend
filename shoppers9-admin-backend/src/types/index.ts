import { Request } from 'express';
import mongoose, { Document } from 'mongoose';

// Admin interface
export interface IAdmin extends Document {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'moderator';
  isActive: boolean;
  lastLogin?: Date;
  refreshToken?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  matchPassword(enteredPassword: string): Promise<boolean>;
  generateJWT(): string;
  generateRefreshToken(): string;
  getPermissions(): string[];
}

// Extended Request interface with admin
export interface AuthRequest extends Request {
  admin?: IAdmin;
}

// Extended Request interface with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Available Color interface (from admin panel)
export interface IAvailableColor {
  name: string;
  code: string;
  images: string[];
}

// Available Size interface (from admin panel)
export interface IAvailableSize {
  name: string;
}

// Product Variant interface (color-size combination)
export interface IProductVariant extends Document {
  color: string;
  colorCode?: string;
  size: string;
  price: number;
  originalPrice: number;
  stock: number;
  images: string[];
}

// Legacy Product Size interface (for backward compatibility)
export interface IProductSize extends Document {
  size: string;
  price: number;
  originalPrice: number;
  discount: number;
  stock: number;
}

// Product Specification interface
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

// Product interface
export interface IProduct extends Document {
  _id: string;
  name: string;
  description: string;
  category: mongoose.Types.ObjectId | ICategory;
  subCategory: mongoose.Types.ObjectId | ICategory;
  subSubCategory?: mongoose.Types.ObjectId | ICategory;
  brand: string;
  price?: number; // Base price
  originalPrice?: number; // Base original price
  images: string[];
  availableColors: IAvailableColor[]; // Colors from admin panel
  availableSizes: IAvailableSize[]; // Sizes from admin panel
  variants: IProductVariant[]; // Color-size combinations
  displayFilters: string[]; // ['color', 'size'] to control frontend display
  specifications: IProductSpecification;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  filterValues?: IProductFilterValue[];
}

// User interface
export interface IUser extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  addresses: {
    type: 'home' | 'work' | 'other';
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
  }[];
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Order interface
export interface IOrder extends Document {
  _id: string;
  orderNumber: string;
  user: string;
  items: {
    product: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Category interface
export interface ICategory extends Document {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  image?: string;
  parentCategory?: string;
  level: 1 | 2 | 3; // 1 = Category, 2 = Subcategory, 3 = Sub-Subcategory
  isActive: boolean;
  sortOrder: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationResponse<T = any> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// Analytics interfaces
export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  recentOrders: IOrder[];
  topProducts: any[];
  salesTrend: any[];
}

export interface SalesAnalytics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  salesByPeriod: any[];
  topSellingProducts: any[];
  salesByCategory: any[];
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  userGrowth: any[];
  usersByLocation: any[];
  userActivity: any[];
}

// Query interfaces
export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface ProductQueryParams extends QueryParams {
  category?: string;
  status?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface OrderQueryParams extends QueryParams {
  status?: string;
  paymentStatus?: string;
  userId?: string;
}

export interface UserQueryParams extends QueryParams {
  status?: string;
  verified?: boolean;
  role?: string;
}

// Filter System Interfaces
export interface IFilter extends Document {
  _id: string;
  name: string;
  displayName: string;
  type: 'single' | 'multiple' | 'range';
  dataType: 'string' | 'number' | 'boolean';
  description?: string;
  categoryLevels: (1 | 2 | 3)[]; // Which category levels this filter applies to
  categories: mongoose.Types.ObjectId[]; // Specific category IDs this filter is assigned to
  isActive: boolean;
  sortOrder: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFilterOption extends Document {
  _id: string;
  filter: string;
  value: string;
  displayValue: string;
  colorCode?: string;
  isActive: boolean;
  sortOrder: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryFilter extends Document {
  _id: string;
  category: string;
  filter: string;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductFilterValue extends Document {
  _id: string;
  product: string;
  filter: string;
  filterOption: string;
  customValue?: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced Product Query Params with Filters
export interface EnhancedProductQueryParams extends ProductQueryParams {
  filters?: { [filterName: string]: string | string[] };
  priceRange?: { min?: number; max?: number };
}