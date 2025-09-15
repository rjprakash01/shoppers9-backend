import axios from 'axios';

// Create API instance for shipping operations
const shippingApi = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.VITE_API_URL || 'https://api.shoppers9.com'
    : 'http://localhost:5002/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
shippingApi.interceptors.request.use(
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

shippingApi.interceptors.response.use(
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
export interface ShippingProvider {
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
  createdAt: string;
  updatedAt: string;
}

export interface ShippingRate {
  _id: string;
  providerId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  _id?: string;
  status: 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed_delivery' | 'returned';
  location: string;
  description: string;
  timestamp: string;
  estimatedDelivery?: string;
}

export interface Shipment {
  _id: string;
  shipmentId: string;
  orderNumber: string;
  providerId: string;
  provider?: {
    name: string;
    logo?: string;
  };
  trackingNumber: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed_delivery' | 'returned';
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
  estimatedDelivery: string;
  actualDelivery?: string;
  trackingEvents: TrackingEvent[];
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  currentLocation?: string;
  isDelivered?: boolean;
  isInTransit?: boolean;
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
  estimatedDelivery: string;
  isFreeShipping: boolean;
}

export interface ShippingAnalytics {
  totalShipments: number;
  deliveredShipments: number;
  inTransitShipments: number;
  averageDeliveryTime: number;
  topProviders: Array<{
    providerId: string;
    providerName: string;
    shipmentCount: number;
    deliveryRate: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

class ShippingService {
  /**
   * Calculate shipping rates
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
      const response = await shippingApi.post<ApiResponse<{
        options: ShippingOption[];
        count: number;
      }>>('/shipping/calculate-rates', request);
      
      if (response.data.success) {
        return response.data.data.options;
      }
      
      throw new Error(response.data.message || 'Failed to calculate shipping rates');
    } catch (error: any) {
      console.error('Error calculating shipping rates:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to calculate shipping rates');
    }
  }

  /**
   * Get shipping providers
   */
  async getProviders(includeInactive: boolean = false): Promise<ShippingProvider[]> {
    try {
      const response = await shippingApi.get<ApiResponse<{
        providers: ShippingProvider[];
        count: number;
      }>>('/shipping/providers', {
        params: { includeInactive }
      });
      
      if (response.data.success) {
        return response.data.data.providers;
      }
      
      throw new Error(response.data.message || 'Failed to fetch shipping providers');
    } catch (error: any) {
      console.error('Error fetching shipping providers:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch shipping providers');
    }
  }

  /**
   * Create shipping provider
   */
  async createProvider(providerData: Partial<ShippingProvider>): Promise<ShippingProvider> {
    try {
      const response = await shippingApi.post<ApiResponse<{
        provider: ShippingProvider;
      }>>('/shipping/providers', providerData);
      
      if (response.data.success) {
        return response.data.data.provider;
      }
      
      throw new Error(response.data.message || 'Failed to create shipping provider');
    } catch (error: any) {
      console.error('Error creating shipping provider:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create shipping provider');
    }
  }

  /**
   * Update shipping provider
   */
  async updateProvider(providerId: string, providerData: Partial<ShippingProvider>): Promise<ShippingProvider> {
    try {
      const response = await shippingApi.put<ApiResponse<{
        provider: ShippingProvider;
      }>>(`/shipping/providers/${providerId}`, providerData);
      
      if (response.data.success) {
        return response.data.data.provider;
      }
      
      throw new Error(response.data.message || 'Failed to update shipping provider');
    } catch (error: any) {
      console.error('Error updating shipping provider:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update shipping provider');
    }
  }

  /**
   * Delete shipping provider
   */
  async deleteProvider(providerId: string): Promise<void> {
    try {
      const response = await shippingApi.delete<ApiResponse<any>>(`/shipping/providers/${providerId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete shipping provider');
      }
    } catch (error: any) {
      console.error('Error deleting shipping provider:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete shipping provider');
    }
  }

  /**
   * Get shipping rates
   */
  async getAllRates(): Promise<ShippingRate[]> {
    try {
      // This would need to be implemented to get all rates across providers
      // For now, return empty array
      return [];
    } catch (error: any) {
      console.error('Error fetching shipping rates:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch shipping rates');
    }
  }

  /**
   * Get provider rates
   */
  async getProviderRates(providerId: string, includeInactive: boolean = false): Promise<ShippingRate[]> {
    try {
      const response = await shippingApi.get<ApiResponse<{
        rates: ShippingRate[];
        count: number;
      }>>(`/shipping/providers/${providerId}/rates`, {
        params: { includeInactive }
      });
      
      if (response.data.success) {
        return response.data.data.rates;
      }
      
      throw new Error(response.data.message || 'Failed to fetch provider rates');
    } catch (error: any) {
      console.error('Error fetching provider rates:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch provider rates');
    }
  }

  /**
   * Create shipping rate
   */
  async createRate(rateData: Partial<ShippingRate>): Promise<ShippingRate> {
    try {
      const response = await shippingApi.post<ApiResponse<{
        rate: ShippingRate;
      }>>('/shipping/rates', rateData);
      
      if (response.data.success) {
        return response.data.data.rate;
      }
      
      throw new Error(response.data.message || 'Failed to create shipping rate');
    } catch (error: any) {
      console.error('Error creating shipping rate:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create shipping rate');
    }
  }

  /**
   * Update shipping rate
   */
  async updateRate(rateId: string, rateData: Partial<ShippingRate>): Promise<ShippingRate> {
    try {
      const response = await shippingApi.put<ApiResponse<{
        rate: ShippingRate;
      }>>(`/shipping/rates/${rateId}`, rateData);
      
      if (response.data.success) {
        return response.data.data.rate;
      }
      
      throw new Error(response.data.message || 'Failed to update shipping rate');
    } catch (error: any) {
      console.error('Error updating shipping rate:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update shipping rate');
    }
  }

  /**
   * Delete shipping rate
   */
  async deleteRate(rateId: string): Promise<void> {
    try {
      const response = await shippingApi.delete<ApiResponse<any>>(`/shipping/rates/${rateId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete shipping rate');
      }
    } catch (error: any) {
      console.error('Error deleting shipping rate:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete shipping rate');
    }
  }

  /**
   * Get shipments
   */
  async getShipments(filters: {
    status?: string;
    providerId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<{
    shipments: Shipment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const response = await shippingApi.get<ApiResponse<{
        shipments: Shipment[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>>('/shipping/shipments', { params: filters });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch shipments');
    } catch (error: any) {
      console.error('Error fetching shipments:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch shipments');
    }
  }

  /**
   * Get shipment by ID
   */
  async getShipmentById(shipmentId: string): Promise<Shipment> {
    try {
      const response = await shippingApi.get<ApiResponse<{
        shipment: Shipment;
      }>>(`/shipping/shipments/${shipmentId}`);
      
      if (response.data.success) {
        return response.data.data.shipment;
      }
      
      throw new Error(response.data.message || 'Failed to fetch shipment');
    } catch (error: any) {
      console.error('Error fetching shipment:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch shipment');
    }
  }

  /**
   * Create shipment
   */
  async createShipment(shipmentData: {
    orderNumber: string;
    providerId: string;
    serviceType: string;
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
    notes?: string;
  }): Promise<Shipment> {
    try {
      const response = await shippingApi.post<ApiResponse<{
        shipment: Shipment;
      }>>('/shipping/shipments', shipmentData);
      
      if (response.data.success) {
        return response.data.data.shipment;
      }
      
      throw new Error(response.data.message || 'Failed to create shipment');
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create shipment');
    }
  }

  /**
   * Update shipment tracking
   */
  async updateShipmentTracking(shipmentId: string, trackingData: {
    status: string;
    location: string;
    description: string;
    estimatedDelivery?: string;
  }): Promise<Shipment> {
    try {
      const response = await shippingApi.put<ApiResponse<{
        shipment: Shipment;
      }>>(`/shipping/shipments/${shipmentId}/tracking`, trackingData);
      
      if (response.data.success) {
        return response.data.data.shipment;
      }
      
      throw new Error(response.data.message || 'Failed to update shipment tracking');
    } catch (error: any) {
      console.error('Error updating shipment tracking:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update shipment tracking');
    }
  }

  /**
   * Get tracking info
   */
  async getTrackingInfo(trackingNumber: string): Promise<{
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
  }> {
    try {
      const response = await shippingApi.get<ApiResponse<any>>(`/shipping/track/${trackingNumber}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch tracking info');
    } catch (error: any) {
      console.error('Error fetching tracking info:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch tracking info');
    }
  }

  /**
   * Get shipping analytics
   */
  async getShippingAnalytics(fromDate?: string, toDate?: string): Promise<ShippingAnalytics> {
    try {
      const params: any = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const response = await shippingApi.get<ApiResponse<ShippingAnalytics>>('/shipping/analytics', { params });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch shipping analytics');
    } catch (error: any) {
      console.error('Error fetching shipping analytics:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch shipping analytics');
    }
  }

  /**
   * Bulk update shipment status
   */
  async bulkUpdateShipmentStatus(updates: Array<{
    shipmentId: string;
    status: string;
    location: string;
    description: string;
    estimatedDelivery?: string;
  }>): Promise<{
    successful: number;
    failed: Array<{ shipmentId: string; error: string }>;
    total: number;
    successRate: string;
  }> {
    try {
      const response = await shippingApi.post<ApiResponse<{
        successful: number;
        failed: Array<{ shipmentId: string; error: string }>;
        total: number;
        successRate: string;
      }>>('/shipping/shipments/bulk-update', { updates });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to bulk update shipments');
    } catch (error: any) {
      console.error('Error bulk updating shipments:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to bulk update shipments');
    }
  }
}

export const shippingService = new ShippingService();
export default shippingService;