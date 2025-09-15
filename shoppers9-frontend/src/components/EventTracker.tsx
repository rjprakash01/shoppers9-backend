import React, { useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';

interface EventTrackerProps {
  children: React.ReactNode;
}

const EventTracker: React.FC<EventTrackerProps> = ({ children }) => {
  useEffect(() => {
    // Generate or get session ID
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }

    // Track page view
    const trackPageView = () => {
      analyticsService.trackEvent({
        sessionId,
        eventType: 'page_view',
        data: {
          page: window.location.pathname,
          title: document.title,
          referrer: document.referrer,
          timestamp: new Date().toISOString()
        },
        source: getTrafficSource(),
        device: getDeviceType(),
        browser: getBrowserInfo(),
        os: getOSInfo()
      });
    };

    // Track initial page view
    trackPageView();

    // Track page views on route changes
    const handleRouteChange = () => {
      setTimeout(trackPageView, 100); // Small delay to ensure page title is updated
    };

    // Listen for route changes (for SPAs)
    window.addEventListener('popstate', handleRouteChange);
    
    // Override pushState and replaceState to track programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleRouteChange();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleRouteChange();
    };

    // Track session duration
    const sessionStartTime = Date.now();
    const trackSessionEnd = () => {
      const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
      analyticsService.trackEvent({
        sessionId,
        eventType: 'session_end',
        data: {
          duration: sessionDuration,
          pageViews: getPageViewCount(),
          timestamp: new Date().toISOString()
        }
      });
    };

    // Track session end on page unload
    window.addEventListener('beforeunload', trackSessionEnd);
    window.addEventListener('pagehide', trackSessionEnd);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('beforeunload', trackSessionEnd);
      window.removeEventListener('pagehide', trackSessionEnd);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  // Helper functions
  const getTrafficSource = (): string => {
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
  };

  const getDeviceType = (): string => {
    const userAgent = navigator.userAgent;
    
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    
    return 'desktop';
  };

  const getBrowserInfo = (): string => {
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
  };

  const getOSInfo = (): string => {
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
  };

  const getPageViewCount = (): number => {
    const count = sessionStorage.getItem('page_view_count');
    return count ? parseInt(count, 10) : 1;
  };

  return <>{children}</>;
};

// Hook for tracking specific events
export const useEventTracker = () => {
  const trackEvent = (eventType: string, data?: any, value?: number, productId?: string, categoryId?: string, orderId?: string) => {
    const sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) return;

    analyticsService.trackEvent({
      sessionId,
      eventType,
      data,
      value,
      productId,
      categoryId,
      orderId
    });
  };

  const trackProductView = (productId: string, productData?: any) => {
    trackEvent('product_view', productData, undefined, productId);
  };

  const trackAddToCart = (productId: string, quantity: number, price: number) => {
    trackEvent('add_to_cart', { quantity, price }, price * quantity, productId);
  };

  const trackRemoveFromCart = (productId: string, quantity: number, price: number) => {
    trackEvent('remove_from_cart', { quantity, price }, price * quantity, productId);
  };

  const trackAddToWishlist = (productId: string) => {
    trackEvent('add_to_wishlist', {}, undefined, productId);
  };

  const trackCheckoutStart = (cartValue: number, itemCount: number) => {
    trackEvent('checkout_start', { itemCount }, cartValue);
  };

  const trackPaymentInfo = (paymentMethod: string, cartValue: number) => {
    trackEvent('payment_info', { paymentMethod }, cartValue);
  };

  const trackPurchase = (orderId: string, orderValue: number, items: any[]) => {
    trackEvent('purchase', { items, itemCount: items.length }, orderValue, undefined, undefined, orderId);
  };

  const trackSearch = (query: string, resultsCount: number) => {
    trackEvent('search', { query, resultsCount });
  };

  const trackCategoryView = (categoryId: string, categoryName: string) => {
    trackEvent('category_view', { categoryName }, undefined, undefined, categoryId);
  };

  const trackCouponApply = (couponCode: string, discount: number) => {
    trackEvent('coupon_apply', { couponCode }, discount);
  };

  const trackSignup = (method: string) => {
    trackEvent('signup', { method });
  };

  const trackLogin = (method: string) => {
    trackEvent('login', { method });
  };

  return {
    trackEvent,
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackAddToWishlist,
    trackCheckoutStart,
    trackPaymentInfo,
    trackPurchase,
    trackSearch,
    trackCategoryView,
    trackCouponApply,
    trackSignup,
    trackLogin
  };
};

export default EventTracker;