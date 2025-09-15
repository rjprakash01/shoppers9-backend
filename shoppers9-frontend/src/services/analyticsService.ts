import axios from 'axios';

// Create API instance for analytics operations
const analyticsApi = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.VITE_API_URL || 'https://api.shoppers9.com'
    : 'http://localhost:5002/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor (optional for analytics)
analyticsApi.interceptors.request.use(
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

analyticsApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Don't redirect on analytics failures to avoid disrupting user experience
    console.warn('Analytics request failed:', error.message);
    return Promise.reject(error);
  }
);

// Types
interface TrackingEvent {
  sessionId: string;
  eventType: string;
  data?: any;
  value?: number;
  productId?: string;
  categoryId?: string;
  orderId?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  device?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

class AnalyticsService {
  /**
   * Track user event
   */
  async trackEvent(event: TrackingEvent): Promise<void> {
    try {
      // Add user ID if available
      const userId = this.getUserId();
      if (userId) {
        (event as any).customerId = userId;
      }

      await analyticsApi.post<ApiResponse>('/analytics/track', event);
    } catch (error: any) {
      // Silently fail analytics tracking to not disrupt user experience
      console.warn('Failed to track event:', error.message);
    }
  }

  /**
   * Get user's activity analytics (if authenticated)
   */
  async getUserActivity(): Promise<any> {
    try {
      const response = await analyticsApi.get<ApiResponse<any>>('/analytics/my-activity');
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch user activity');
    } catch (error: any) {
      console.error('Error fetching user activity:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch user activity');
    }
  }

  /**
   * Get personalized insights for user (if authenticated)
   */
  async getUserInsights(): Promise<any> {
    try {
      const response = await analyticsApi.get<ApiResponse<any>>('/analytics/my-insights');
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch user insights');
    } catch (error: any) {
      console.error('Error fetching user insights:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch user insights');
    }
  }

  /**
   * Track page view
   */
  async trackPageView(page: string, title?: string): Promise<void> {
    const sessionId = this.getSessionId();
    if (!sessionId) return;

    await this.trackEvent({
      sessionId,
      eventType: 'page_view',
      data: {
        page,
        title: title || document.title,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      },
      source: this.getTrafficSource(),
      device: this.getDeviceType(),
      browser: this.getBrowserInfo(),
      os: this.getOSInfo()
    });
  }

  /**
   * Track product view
   */
  async trackProductView(productId: string, productData?: any): Promise<void> {
    const sessionId = this.getSessionId();
    if (!sessionId) return;

    await this.trackEvent({
      sessionId,
      eventType: 'product_view',
      data: productData,
      productId
    });
  }

  /**
   * Track add to cart
   */
  async trackAddToCart(productId: string, quantity: number, price: number, productData?: any): Promise<void> {
    const sessionId = this.getSessionId();
    if (!sessionId) return;

    await this.trackEvent({
      sessionId,
      eventType: 'add_to_cart',
      data: { quantity, price, ...productData },
      value: price * quantity,
      productId
    });
  }

  /**
   * Track remove from cart
   */
  async trackRemoveFromCart(productId: string, quantity: number, price: number): Promise<void> {
    const sessionId = this.getSessionId();
    if (!sessionId) return;

    await this.trackEvent({
      sessionId,
      eventType: 'remove_from_cart',
      data: { quantity, price },
      value: price * quantity,
      productId
    });
  }

  /**
   * Track add to wishlist
   */
  async trackAddToWishlist(productId: string, productData?: any): Promise<void> {
    const sessionId = this.getSessionId();
    if (!sessionId) return;

    await this.trackEvent({
      sessionId,
      eventType: 'add_to_wishlist',
      data: productData,
      productId
    });
  }

  /**
   * Track checkout start
   */
  async trackCheckoutStart(cartValue: number, itemCount: number, items?: any[]): Promise<void> {
    const sessionId = this.getSessionId();
    if (!sessionId) return;

    await this.trackEvent({
      sessionId,
      eventType: 'checkout_start',
      data: { itemCount, items },
      value: cartValue
    });
  }

  /**
   * Track payment info entry
   */
  async trackPaymentInfo(paymentMethod: string, cartValue: number): Promise<void> {
    const sessionId = this.getSessionId();
    if (!sessionId) return;

    await this.trackEvent({
      sessionId,
      eventType: 'payment_info',
      data: { paymentMethod },
      value: cartValue
    });
  }

  /**
   * Track purchase completion
   */
  async trackPurchase(orderId: string, orderValue: number, items: any[], paymentMethod?: string): Promise<void> {
    const sessionId = this.getSessionId();
    if (!sessionId) return;

    await this.trackEvent({
      sessionId,
      eventType: 'purchase',
      data: { items, itemCount: items.length, paymentMethod },
      value: orderValue,
      orderId
    });
  }

  /**
   * Track search
   */
  async trackSearch(query: string, resultsCount: number, filters?: any): Promise<void> {
    const sessionId = this.getSessionId();
    if (!sessionId) return;

    await this.trackEvent({
      sessionId,
      eventType: 'search',
      data: { query, resultsCount, filters }
    });
  }

  /**
   * Track category view
   */
  async trackCategoryView(categoryId: string, categoryName: string, productCount?: number): Promise<void> {
    const sessionId = this.getSessionId();
    if (!sessionId) return;

    await this.trackEvent({
      sessionId,
      eventType: 'category_view',
      data: { categoryName, productCount },
      categoryId
    });
  }

  /**
   * Track coupon application
   */
  async trackCouponApply(couponCode: string, discount: number, orderValue: number): Promise<void> {
    const sessionId = this.getSessionId();
    if (!sessionId) return;

    await this.trackEvent({
      sessionId,
      eventType: 'coupon_apply',
      data: { couponCode, orderValue },
      value: discount
    });
  }

  /**
   * Track user signup
   */
  async trackSignup(method: string = 'email'): Promise<void> {
    const sessionId = this.getSessionId();
    if (!sessionId) return;

    await this.trackEvent({
      sessionId,
      eventType: 'signup',
      data: { method }
    });
  }

  /**
   * Track user login
   */
  async trackLogin(method: string = 'email'): Promise<void> {
    const sessionId = this.getSessionId();
    if (!sessionId) return;

    await this.trackEvent({
      sessionId,
      eventType: 'login',
      data: { method }
    });
  }

  // Helper methods
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private getUserId(): string | null {
    // Try to get user ID from various sources
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id || user._id || user.userId;
      } catch (e) {
        // Ignore parsing errors
      }
    }
    return null;
  }

  private getTrafficSource(): string {
    const referrer = document.referrer;
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check for UTM parameters
    if (urlParams.get('utm_source')) {
      return urlParams.get('utm_source') || 'unknown';
    }
    
    // Check referrer
    if (!referrer) {
      return 'direct';
    }
    
    const referrerDomain = new URL(referrer).hostname;
    
    // Social media sources
    if (referrerDomain.includes('facebook.com') || referrerDomain.includes('fb.com')) {
      return 'social';
    }
    if (referrerDomain.includes('twitter.com') || referrerDomain.includes('t.co')) {
      return 'social';
    }
    if (referrerDomain.includes('instagram.com')) {
      return 'social';
    }
    if (referrerDomain.includes('linkedin.com')) {
      return 'social';
    }
    
    // Search engines
    if (referrerDomain.includes('google.com') || referrerDomain.includes('bing.com') || referrerDomain.includes('yahoo.com')) {
      return 'search';
    }
    
    // Email
    if (referrerDomain.includes('mail.') || referrerDomain.includes('email.')) {
      return 'email';
    }
    
    return 'referral';
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent;
    
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    
    return 'desktop';
  }

  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) {
      return 'Chrome';
    }
    if (userAgent.includes('Firefox')) {
      return 'Firefox';
    }
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      return 'Safari';
    }
    if (userAgent.includes('Edge')) {
      return 'Edge';
    }
    if (userAgent.includes('Opera')) {
      return 'Opera';
    }
    
    return 'Unknown';
  }

  private getOSInfo(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Windows')) {
      return 'Windows';
    }
    if (userAgent.includes('Mac')) {
      return 'macOS';
    }
    if (userAgent.includes('Linux')) {
      return 'Linux';
    }
    if (userAgent.includes('Android')) {
      return 'Android';
    }
    if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      return 'iOS';
    }
    
    return 'Unknown';
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;