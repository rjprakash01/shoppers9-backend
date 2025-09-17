import axios from 'axios';

// Create API instance for coupon operations
const couponApi = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.VITE_API_URL || 'https://api.shoppers9.com'
    : 'http://localhost:5002/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
couponApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

couponApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface Coupon {
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
  validFrom: string;
  validUntil: string;
  applicableCategories?: string[];
  applicableProducts?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CouponAnalytics {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  totalUsage: number;
  topCoupons: Array<{
    code: string;
    usedCount: number;
    discountType: string;
    discountValue: number;
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

class CouponService {
  /**
   * Get all coupons with pagination and filters
   */
  async getCoupons(filters: {
    isActive?: boolean;
    discountType?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    coupons: Coupon[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const response = await couponApi.get<ApiResponse<{
        coupons: Coupon[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>>('/coupons', { params: filters });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch coupons');
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch coupons');
    }
  }

  /**
   * Get coupon by ID
   */
  async getCouponById(couponId: string): Promise<Coupon> {
    try {
      const response = await couponApi.get<ApiResponse<{
        coupon: Coupon;
      }>>(`/coupons/${couponId}`);
      
      if (response.data.success) {
        return response.data.data.coupon;
      }
      
      throw new Error(response.data.message || 'Failed to fetch coupon');
    } catch (error: any) {
      console.error('Error fetching coupon:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch coupon');
    }
  }

  /**
   * Create a new coupon
   */
  async createCoupon(couponData: Partial<Coupon>): Promise<Coupon> {
    try {
      const response = await couponApi.post<ApiResponse<{
        coupon: Coupon;
      }>>('/coupons', couponData);
      
      if (response.data.success) {
        return response.data.data.coupon;
      }
      
      throw new Error(response.data.message || 'Failed to create coupon');
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create coupon');
    }
  }

  /**
   * Update a coupon
   */
  async updateCoupon(couponId: string, couponData: Partial<Coupon>): Promise<Coupon> {
    try {
      const response = await couponApi.put<ApiResponse<{
        coupon: Coupon;
      }>>(`/coupons/${couponId}`, couponData);
      
      if (response.data.success) {
        return response.data.data.coupon;
      }
      
      throw new Error(response.data.message || 'Failed to update coupon');
    } catch (error: any) {
      console.error('Error updating coupon:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update coupon');
    }
  }

  /**
   * Delete a coupon
   */
  async deleteCoupon(couponId: string): Promise<void> {
    try {
      const response = await couponApi.delete<ApiResponse<any>>(`/coupons/${couponId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete coupon');
      }
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete coupon');
    }
  }

  /**
   * Toggle coupon active status
   */
  async toggleCouponStatus(couponId: string): Promise<Coupon> {
    try {
      const response = await couponApi.patch<ApiResponse<{
        coupon: Coupon;
      }>>(`/coupons/${couponId}/toggle`);
      
      if (response.data.success) {
        return response.data.data.coupon;
      }
      
      throw new Error(response.data.message || 'Failed to toggle coupon status');
    } catch (error: any) {
      console.error('Error toggling coupon status:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to toggle coupon status');
    }
  }

  /**
   * Get coupon analytics
   */
  async getCouponAnalytics(): Promise<CouponAnalytics> {
    try {
      const response = await couponApi.get<ApiResponse<CouponAnalytics>>('/coupons/analytics');
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch coupon analytics');
    } catch (error: any) {
      console.error('Error fetching coupon analytics:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch coupon analytics');
    }
  }

  /**
   * Bulk create coupons
   */
  async bulkCreateCoupons(coupons: Partial<Coupon>[]): Promise<{
    successful: number;
    failed: Array<{ code: string; error: string }>;
    total: number;
    successRate: string;
  }> {
    try {
      const response = await couponApi.post<ApiResponse<{
        successful: number;
        failed: Array<{ code: string; error: string }>;
        total: number;
        successRate: string;
      }>>('/coupons/bulk', { coupons });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to bulk create coupons');
    } catch (error: any) {
      console.error('Error bulk creating coupons:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to bulk create coupons');
    }
  }

  /**
   * Generate coupon codes
   */
  async generateCouponCodes(options: {
    count?: number;
    prefix?: string;
    length?: number;
  } = {}): Promise<{
    codes: string[];
    count: number;
  }> {
    try {
      const response = await couponApi.post<ApiResponse<{
        codes: string[];
        count: number;
      }>>('/coupons/generate-codes', options);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to generate coupon codes');
    } catch (error: any) {
      console.error('Error generating coupon codes:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to generate coupon codes');
    }
  }

  /**
   * Validate coupon code format
   */
  validateCouponCode(code: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!code || code.trim().length === 0) {
      return {
        isValid: false,
        error: 'Coupon code is required'
      };
    }

    const trimmed = code.trim().toUpperCase();
    
    // Check length
    if (trimmed.length < 3 || trimmed.length > 20) {
      return {
        isValid: false,
        error: 'Coupon code must be between 3 and 20 characters'
      };
    }

    // Check for valid characters (alphanumeric only)
    if (!/^[A-Z0-9]+$/.test(trimmed)) {
      return {
        isValid: false,
        error: 'Coupon code can only contain letters and numbers'
      };
    }

    return { isValid: true };
  }

  /**
   * Format coupon code
   */
  formatCouponCode(code: string): string {
    return code.trim().toUpperCase();
  }

  /**
   * Calculate discount preview
   */
  calculateDiscountPreview(discountType: 'percentage' | 'fixed', discountValue: number, orderAmount: number, maxDiscountAmount?: number): {
    discount: number;
    finalAmount: number;
    savings: string;
  } {
    let discount = 0;

    if (discountType === 'percentage') {
      discount = (orderAmount * discountValue) / 100;
      
      // Apply maximum discount limit if specified
      if (maxDiscountAmount && discount > maxDiscountAmount) {
        discount = maxDiscountAmount;
      }
    } else if (discountType === 'fixed') {
      discount = Math.min(discountValue, orderAmount);
    }

    const finalAmount = Math.max(0, orderAmount - discount);
    const savingsPercentage = orderAmount > 0 ? ((discount / orderAmount) * 100).toFixed(1) : '0';

    return {
      discount: Math.round(discount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
      savings: `${savingsPercentage}%`
    };
  }

  /**
   * Get coupon status info
   */
  getCouponStatus(coupon: Coupon): {
    status: 'active' | 'scheduled' | 'expired' | 'exhausted' | 'inactive';
    message: string;
    canBeUsed: boolean;
  } {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    
    if (!coupon.isActive) {
      return {
        status: 'inactive',
        message: 'Coupon is deactivated',
        canBeUsed: false
      };
    }
    
    if (now < validFrom) {
      return {
        status: 'scheduled',
        message: `Will be active from ${validFrom.toLocaleDateString()}`,
        canBeUsed: false
      };
    }
    
    if (now > validUntil) {
      return {
        status: 'expired',
        message: `Expired on ${validUntil.toLocaleDateString()}`,
        canBeUsed: false
      };
    }
    
    if (coupon.usedCount >= coupon.usageLimit) {
      return {
        status: 'exhausted',
        message: 'Usage limit reached',
        canBeUsed: false
      };
    }
    
    return {
      status: 'active',
      message: `${coupon.usageLimit - coupon.usedCount} uses remaining`,
      canBeUsed: true
    };
  }

  /**
   * Export coupons data
   */
  async exportCoupons(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    try {
      // Get all coupons
      const { coupons } = await this.getCoupons({ limit: 1000 });
      
      if (format === 'csv') {
        const csvHeaders = [
          'Code',
          'Description',
          'Discount Type',
          'Discount Value',
          'Min Order Amount',
          'Max Discount Amount',
          'Usage Limit',
          'Used Count',
          'Valid From',
          'Valid Until',
          'Status',
          'Created At'
        ];
        
        const csvRows = coupons.map(coupon => [
          coupon.code,
          coupon.description,
          coupon.discountType,
          coupon.discountValue,
          coupon.minOrderAmount,
          coupon.maxDiscountAmount || '',
          coupon.usageLimit,
          coupon.usedCount,
          new Date(coupon.validFrom).toLocaleDateString(),
          new Date(coupon.validUntil).toLocaleDateString(),
          this.getCouponStatus(coupon).status,
          new Date(coupon.createdAt).toLocaleDateString()
        ]);
        
        const csvContent = [csvHeaders, ...csvRows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');
        
        return new Blob([csvContent], { type: 'text/csv' });
      } else {
        const jsonContent = JSON.stringify(coupons, null, 2);
        return new Blob([jsonContent], { type: 'application/json' });
      }
    } catch (error: any) {
      console.error('Error exporting coupons:', error);
      throw new Error('Failed to export coupons');
    }
  }
}

export const couponService = new CouponService();
export default couponService;