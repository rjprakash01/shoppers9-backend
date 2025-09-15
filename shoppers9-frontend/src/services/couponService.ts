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
    const token = localStorage.getItem('token');
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
      // For customer frontend, we might want to redirect to login
      // but not automatically clear token as user might be browsing
      console.warn('Authentication failed for coupon request');
    }
    return Promise.reject(error);
  }
);

// Types
interface Coupon {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  validUntil: string;
}

interface CouponValidationResult {
  valid: boolean;
  discount: number;
  reason?: string;
  coupon?: Coupon;
}

interface CouponApplicationResult {
  success: boolean;
  discount: number;
  finalAmount: number;
  coupon?: Coupon;
  message?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

class CouponService {
  /**
   * Apply coupon to cart
   */
  async applyCoupon(code: string): Promise<CouponApplicationResult> {
    try {
      const response = await couponApi.post<ApiResponse<{
        discount: number;
        finalAmount: number;
        coupon: {
          code: string;
          discountType: string;
          discountValue: number;
        };
      }>>('/coupons/apply', { code });
      
      if (response.data.success) {
        return {
          success: true,
          discount: response.data.data.discount,
          finalAmount: response.data.data.finalAmount,
          coupon: response.data.data.coupon,
          message: response.data.message
        };
      }
      
      return {
        success: false,
        discount: 0,
        finalAmount: 0,
        message: response.data.message || 'Failed to apply coupon'
      };
    } catch (error: any) {
      console.error('Error applying coupon:', error);
      return {
        success: false,
        discount: 0,
        finalAmount: 0,
        message: error.response?.data?.message || error.message || 'Failed to apply coupon'
      };
    }
  }

  /**
   * Remove coupon from cart
   */
  async removeCoupon(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await couponApi.delete<ApiResponse<any>>('/coupons/remove');
      
      return {
        success: response.data.success,
        message: response.data.message || (response.data.success ? 'Coupon removed successfully' : 'Failed to remove coupon')
      };
    } catch (error: any) {
      console.error('Error removing coupon:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to remove coupon'
      };
    }
  }

  /**
   * Validate coupon code
   */
  async validateCoupon(code: string): Promise<CouponValidationResult> {
    try {
      const response = await couponApi.get<ApiResponse<CouponValidationResult>>(`/coupons/validate/${encodeURIComponent(code)}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      return {
        valid: false,
        discount: 0,
        reason: response.data.message || 'Invalid coupon code'
      };
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      return {
        valid: false,
        discount: 0,
        reason: error.response?.data?.message || error.message || 'Failed to validate coupon'
      };
    }
  }

  /**
   * Get available coupons (authenticated users)
   */
  async getAvailableCoupons(): Promise<Coupon[]> {
    try {
      const response = await couponApi.get<ApiResponse<{
        coupons: Coupon[];
        count: number;
      }>>('/coupons/available');
      
      if (response.data.success) {
        return response.data.data.coupons;
      }
      
      return [];
    } catch (error: any) {
      console.error('Error fetching available coupons:', error);
      return [];
    }
  }

  /**
   * Get all active coupons (public - no authentication required)
   */
  async getPublicCoupons(): Promise<Coupon[]> {
    try {
      const response = await couponApi.get<ApiResponse<{
        coupons: Coupon[];
        count: number;
      }>>('/coupons/public');
      
      if (response.data.success) {
        return response.data.data.coupons;
      }
      
      return [];
    } catch (error: any) {
      console.error('Error fetching public coupons:', error);
      return [];
    }
  }

  /**
   * Format coupon code
   */
  formatCouponCode(code: string): string {
    return code.trim().toUpperCase();
  }

  /**
   * Validate coupon code format (client-side)
   */
  validateCouponFormat(code: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!code || code.trim().length === 0) {
      return {
        isValid: false,
        error: 'Coupon code is required'
      };
    }

    const trimmed = code.trim();
    
    // Check length
    if (trimmed.length < 3 || trimmed.length > 20) {
      return {
        isValid: false,
        error: 'Coupon code must be between 3 and 20 characters'
      };
    }

    // Check for valid characters (alphanumeric only)
    if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
      return {
        isValid: false,
        error: 'Coupon code can only contain letters and numbers'
      };
    }

    return { isValid: true };
  }

  /**
   * Calculate discount preview (client-side estimation)
   */
  calculateDiscountPreview(
    discountType: 'percentage' | 'fixed',
    discountValue: number,
    orderAmount: number,
    maxDiscountAmount?: number
  ): {
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
   * Get coupon display text
   */
  getCouponDisplayText(coupon: Coupon): string {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}% OFF`;
    } else {
      return `₹${coupon.discountValue} OFF`;
    }
  }

  /**
   * Get coupon description with conditions
   */
  getCouponDescription(coupon: Coupon): string {
    let description = coupon.description;
    
    if (coupon.minOrderAmount > 0) {
      description += ` (Min order: ₹${coupon.minOrderAmount})`;
    }
    
    if (coupon.discountType === 'percentage' && coupon.maxDiscountAmount) {
      description += ` (Max discount: ₹${coupon.maxDiscountAmount})`;
    }
    
    return description;
  }

  /**
   * Check if coupon is expiring soon (within 3 days)
   */
  isCouponExpiringSoon(validUntil: string): boolean {
    const expiryDate = new Date(validUntil);
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    return expiryDate <= threeDaysFromNow;
  }

  /**
   * Get time remaining for coupon
   */
  getTimeRemaining(validUntil: string): string {
    const expiryDate = new Date(validUntil);
    const now = new Date();
    const timeDiff = expiryDate.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return 'Expired';
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} left`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} left`;
    } else {
      return 'Expires today';
    }
  }
}

export const couponService = new CouponService();
export default couponService;