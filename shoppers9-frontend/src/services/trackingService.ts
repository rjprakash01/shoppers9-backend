import axios from 'axios';

// Create API instance for tracking operations
const trackingApi = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.VITE_API_URL || 'https://api.shoppers9.com'
    : 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor (optional for tracking - some endpoints are public)
trackingApi.interceptors.request.use(
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

trackingApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // For tracking, we don't necessarily need to redirect on 401
      // as some tracking endpoints might be public
      console.warn('Authentication failed for tracking request');
    }
    return Promise.reject(error);
  }
);

// Types
interface TrackingEvent {
  _id?: string;
  status: string;
  location: string;
  description: string;
  timestamp: string;
  estimatedDelivery?: string;
}

interface TrackingInfo {
  shipmentId: string;
  trackingNumber: string;
  status: string;
  currentLocation?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  trackingEvents: TrackingEvent[];
  providerInfo: {
    name: string;
    trackingUrl?: string;
  };
}

interface ShippingOption {
  providerId: string;
  providerName: string;
  serviceType: 'standard' | 'express' | 'overnight' | 'same_day';
  serviceName: string;
  cost: number;
  deliveryTime: {
    min: number;
    max: number;
  };
  estimatedDelivery: string;
  isFreeShipping: boolean;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

class TrackingService {
  /**
   * Get tracking information for a shipment
   */
  async getTrackingInfo(trackingNumber: string): Promise<TrackingInfo> {
    try {
      const response = await trackingApi.get<ApiResponse<TrackingInfo>>(
        `/shipping/track/${encodeURIComponent(trackingNumber)}`
      );
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch tracking information');
    } catch (error: any) {
      console.error('Error fetching tracking info:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Tracking number not found. Please check your tracking number and try again.');
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch tracking information. Please try again later.'
      );
    }
  }

  /**
   * Calculate shipping rates for checkout
   */
  async calculateShippingRates(request: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    value: number;
    fromPincode: string;
    toPincode: string;
    serviceType?: string;
    providerId?: string;
  }): Promise<ShippingOption[]> {
    try {
      const response = await trackingApi.post<ApiResponse<{
        options: ShippingOption[];
        count: number;
      }>>('/shipping/calculate-rates', request);
      
      if (response.data.success) {
        return response.data.data.options;
      }
      
      throw new Error(response.data.message || 'Failed to calculate shipping rates');
    } catch (error: any) {
      console.error('Error calculating shipping rates:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to calculate shipping rates. Please try again later.'
      );
    }
  }

  /**
   * Get shipments for an order (requires authentication)
   */
  async getOrderShipments(orderNumber: string): Promise<{
    shipments: Array<{
      _id: string;
      shipmentId: string;
      trackingNumber: string;
      status: string;
      provider?: {
        name: string;
        logo?: string;
      };
      estimatedDelivery: string;
      actualDelivery?: string;
      shippingCost: number;
      createdAt: string;
    }>;
    count: number;
  }> {
    try {
      const response = await trackingApi.get<ApiResponse<{
        shipments: Array<any>;
        count: number;
      }>>(`/shipping/orders/${encodeURIComponent(orderNumber)}/shipments`);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch order shipments');
    } catch (error: any) {
      console.error('Error fetching order shipments:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Please log in to view your order shipments.');
      }
      
      if (error.response?.status === 404) {
        throw new Error('Order not found or no shipments available for this order.');
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch order shipments. Please try again later.'
      );
    }
  }

  /**
   * Get available shipping providers
   */
  async getShippingProviders(): Promise<Array<{
    _id: string;
    name: string;
    code: string;
    description?: string;
    logo?: string;
    capabilities: {
      tracking: boolean;
      realTimeRates: boolean;
      pickupScheduling: boolean;
      insurance: boolean;
      codSupport: boolean;
    };
    isActive: boolean;
  }>> {
    try {
      const response = await trackingApi.get<ApiResponse<{
        providers: Array<any>;
        count: number;
      }>>('/shipping/providers');
      
      if (response.data.success) {
        return response.data.data.providers;
      }
      
      throw new Error(response.data.message || 'Failed to fetch shipping providers');
    } catch (error: any) {
      console.error('Error fetching shipping providers:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch shipping providers. Please try again later.'
      );
    }
  }

  /**
   * Validate tracking number format
   */
  validateTrackingNumber(trackingNumber: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!trackingNumber || trackingNumber.trim().length === 0) {
      return {
        isValid: false,
        error: 'Tracking number is required'
      };
    }

    const trimmed = trackingNumber.trim();
    
    // Basic validation - tracking numbers should be at least 6 characters
    if (trimmed.length < 6) {
      return {
        isValid: false,
        error: 'Tracking number must be at least 6 characters long'
      };
    }

    // Check for valid characters (alphanumeric)
    if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
      return {
        isValid: false,
        error: 'Tracking number can only contain letters and numbers'
      };
    }

    return { isValid: true };
  }

  /**
   * Format tracking number for display
   */
  formatTrackingNumber(trackingNumber: string): string {
    return trackingNumber.trim().toUpperCase();
  }

  /**
   * Get estimated delivery date based on service type
   */
  getEstimatedDelivery(serviceType: string, orderDate: Date = new Date()): Date {
    const deliveryDate = new Date(orderDate);
    
    switch (serviceType.toLowerCase()) {
      case 'same_day':
        // Same day delivery
        break;
      case 'overnight':
        deliveryDate.setDate(deliveryDate.getDate() + 1);
        break;
      case 'express':
        deliveryDate.setDate(deliveryDate.getDate() + 2);
        break;
      case 'standard':
      default:
        deliveryDate.setDate(deliveryDate.getDate() + 5);
        break;
    }
    
    return deliveryDate;
  }

  /**
   * Check if tracking number belongs to a specific provider
   */
  identifyProvider(trackingNumber: string): string | null {
    const upperTracking = trackingNumber.toUpperCase();
    
    if (upperTracking.startsWith('BLUEDART')) {
      return 'BlueDart Express';
    }
    
    if (upperTracking.startsWith('DTDC')) {
      return 'DTDC Courier';
    }
    
    if (upperTracking.startsWith('INDIAPOST')) {
      return 'India Post';
    }
    
    if (upperTracking.startsWith('DELHIVERY')) {
      return 'Delhivery';
    }
    
    return null;
  }
}

export const trackingService = new TrackingService();
export default trackingService;