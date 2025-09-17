import axios from 'axios';

// Create API instance for analytics operations
const analyticsApi = axios.create({
  baseURL: import.meta.env.PROD 
    ? import.meta.env.VITE_API_URL || 'https://api.shoppers9.com'
    : import.meta.env.VITE_API_URL || 'http://localhost:5003/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
analyticsApi.interceptors.request.use(
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

analyticsApi.interceptors.response.use(
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

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

class AnalyticsService {
  /**
   * Get analytics dashboard
   */
  async getDashboard(filters: {
    startDate?: string;
    endDate?: string;
    period?: string;
  } = {}): Promise<AnalyticsDashboard> {
    try {
      const response = await analyticsApi.get<ApiResponse<AnalyticsDashboard>>('/analytics/dashboard', {
        params: filters
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch dashboard data');
    } catch (error: any) {
      console.error('Error fetching dashboard:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch dashboard data');
    }
  }

  /**
   * Get revenue report
   */
  async getRevenueReport(filters: {
    startDate?: string;
    endDate?: string;
    period?: string;
    categoryId?: string;
  } = {}): Promise<RevenueReport> {
    try {
      const response = await analyticsApi.get<ApiResponse<RevenueReport>>('/analytics/reports/revenue', {
        params: filters
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch revenue report');
    } catch (error: any) {
      console.error('Error fetching revenue report:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch revenue report');
    }
  }

  /**
   * Get customer report
   */
  async getCustomerReport(filters: {
    startDate?: string;
    endDate?: string;
    segment?: string;
  } = {}): Promise<CustomerReport> {
    try {
      const response = await analyticsApi.get<ApiResponse<CustomerReport>>('/analytics/reports/customer', {
        params: filters
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch customer report');
    } catch (error: any) {
      console.error('Error fetching customer report:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch customer report');
    }
  }

  /**
   * Get conversion report
   */
  async getConversionReport(filters: {
    startDate?: string;
    endDate?: string;
    source?: string;
    device?: string;
  } = {}): Promise<ConversionReport> {
    try {
      const response = await analyticsApi.get<ApiResponse<ConversionReport>>('/analytics/reports/conversion', {
        params: filters
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch conversion report');
    } catch (error: any) {
      console.error('Error fetching conversion report:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch conversion report');
    }
  }

  /**
   * Get sales analytics
   */
  async getSalesAnalytics(filters: {
    startDate?: string;
    endDate?: string;
    period?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    analytics: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const response = await analyticsApi.get<ApiResponse<{
        analytics: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>>('/analytics/sales', {
        params: filters
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch sales analytics');
    } catch (error: any) {
      console.error('Error fetching sales analytics:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch sales analytics');
    }
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(filters: {
    segment?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<{
    analytics: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const response = await analyticsApi.get<ApiResponse<{
        analytics: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>>('/analytics/customers', {
        params: filters
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch customer analytics');
    } catch (error: any) {
      console.error('Error fetching customer analytics:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch customer analytics');
    }
  }

  /**
   * Get product analytics
   */
  async getProductAnalytics(filters: {
    productId?: string;
    startDate?: string;
    endDate?: string;
    period?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    analytics: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const response = await analyticsApi.get<ApiResponse<{
        analytics: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>>('/analytics/products', {
        params: filters
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch product analytics');
    } catch (error: any) {
      console.error('Error fetching product analytics:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch product analytics');
    }
  }

  /**
   * Get conversion tracking data
   */
  async getConversionTracking(filters: {
    sessionId?: string;
    customerId?: string;
    source?: string;
    device?: string;
    converted?: boolean;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    tracking: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const response = await analyticsApi.get<ApiResponse<{
        tracking: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>>('/analytics/conversions', {
        params: filters
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch conversion tracking data');
    } catch (error: any) {
      console.error('Error fetching conversion tracking:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch conversion tracking data');
    }
  }

  /**
   * Generate custom report
   */
  async generateReport(data: {
    reportType: 'revenue' | 'customer' | 'conversion';
    startDate?: string;
    endDate?: string;
    format?: 'json' | 'csv';
  }): Promise<any> {
    try {
      const response = await analyticsApi.post<ApiResponse<any>>('/analytics/reports/generate', data);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to generate report');
    } catch (error: any) {
      console.error('Error generating report:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to generate report');
    }
  }

  /**
   * Update customer analytics
   */
  async updateCustomerAnalytics(customerId: string): Promise<void> {
    try {
      const response = await analyticsApi.put<ApiResponse<any>>(`/analytics/customers/${customerId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update customer analytics');
      }
    } catch (error: any) {
      console.error('Error updating customer analytics:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update customer analytics');
    }
  }

  /**
   * Generate daily analytics
   */
  async generateDailyAnalytics(date?: string): Promise<void> {
    try {
      const response = await analyticsApi.post<ApiResponse<any>>('/analytics/generate-daily', {
        date
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to generate daily analytics');
      }
    } catch (error: any) {
      console.error('Error generating daily analytics:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to generate daily analytics');
    }
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(period: string = '30d'): Promise<{
    period: string;
    summary: {
      salesRecords: number;
      customerProfiles: number;
      conversionSessions: number;
      productAnalytics: number;
    };
    dateRange: {
      startDate: string;
      endDate: string;
    };
  }> {
    try {
      const response = await analyticsApi.get<ApiResponse<{
        period: string;
        summary: {
          salesRecords: number;
          customerProfiles: number;
          conversionSessions: number;
          productAnalytics: number;
        };
        dateRange: {
          startDate: string;
          endDate: string;
        };
      }>>('/analytics/summary', {
        params: { period }
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch analytics summary');
    } catch (error: any) {
      console.error('Error fetching analytics summary:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch analytics summary');
    }
  }

  /**
   * Track event (for admin actions)
   */
  async trackEvent(eventData: {
    sessionId: string;
    eventType: string;
    data?: any;
    value?: number;
    productId?: string;
    categoryId?: string;
    orderId?: string;
  }): Promise<void> {
    try {
      const response = await analyticsApi.post<ApiResponse<any>>('/analytics/track', eventData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to track event');
      }
    } catch (error: any) {
      console.error('Error tracking event:', error);
      // Don't throw error for tracking failures to avoid disrupting user experience
    }
  }

  /**
   * Get real-time analytics
   */
  async getRealtimeAnalytics(): Promise<{
    activeUsers: number;
    ordersLast24h: number;
    revenueLast24h: number;
    topEvents: Array<{ _id: string; count: number }>;
    timestamp: Date;
  }> {
    try {
      const response = await analyticsApi.get<ApiResponse<{
        activeUsers: number;
        ordersLast24h: number;
        revenueLast24h: number;
        topEvents: Array<{ _id: string; count: number }>;
        timestamp: Date;
      }>>('/analytics/realtime');
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch real-time analytics');
    } catch (error: any) {
      console.error('Error fetching real-time analytics:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch real-time analytics');
    }
  }

  /**
   * Get geographic analytics
   */
  async getGeographicAnalytics(filters: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<Array<{
    country: string;
    city: string;
    visitors: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
  }>> {
    try {
      const response = await analyticsApi.get<ApiResponse<Array<{
        country: string;
        city: string;
        visitors: number;
        conversions: number;
        revenue: number;
        conversionRate: number;
      }>>>('/analytics/geographic', {
        params: filters
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch geographic analytics');
    } catch (error: any) {
      console.error('Error fetching geographic analytics:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch geographic analytics');
    }
  }

  /**
   * Get device analytics
   */
  async getDeviceAnalytics(filters: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    byDevice: Record<string, { visitors: number; conversions: number; revenue: number }>;
    byBrowser: Record<string, { visitors: number; conversions: number; revenue: number }>;
    byOS: Record<string, { visitors: number; conversions: number; revenue: number }>;
  }> {
    try {
      const response = await analyticsApi.get<ApiResponse<{
        byDevice: Record<string, { visitors: number; conversions: number; revenue: number }>;
        byBrowser: Record<string, { visitors: number; conversions: number; revenue: number }>;
        byOS: Record<string, { visitors: number; conversions: number; revenue: number }>;
      }>>('/analytics/devices', {
        params: filters
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch device analytics');
    } catch (error: any) {
      console.error('Error fetching device analytics:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch device analytics');
    }
  }

  /**
   * Get hourly trends
   */
  async getHourlyTrends(filters: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<Array<{
    hour: number;
    visitors: number;
    conversions: number;
    conversionRate: number;
  }>> {
    try {
      const response = await analyticsApi.get<ApiResponse<Array<{
        hour: number;
        visitors: number;
        conversions: number;
        conversionRate: number;
      }>>>('/analytics/hourly-trends', {
        params: filters
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch hourly trends');
    } catch (error: any) {
      console.error('Error fetching hourly trends:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch hourly trends');
    }
  }

  /**
   * Get cohort analysis
   */
  async getCohortAnalysis(filters: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<Array<{
    cohort: string;
    customers: number;
    totalRevenue: number;
    avgLifetimeValue: number;
  }>> {
    try {
      const response = await analyticsApi.get<ApiResponse<Array<{
        cohort: string;
        customers: number;
        totalRevenue: number;
        avgLifetimeValue: number;
      }>>>('/analytics/cohort-analysis', {
        params: filters
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch cohort analysis');
    } catch (error: any) {
      console.error('Error fetching cohort analysis:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch cohort analysis');
    }
  }

  /**
   * Get predictive insights
   */
  async getPredictiveInsights(filters: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    revenueGrowthTrend: number;
    predictedNextMonthRevenue: number;
    customerSegmentInsights: Array<{ _id: string; count: number; avgValue: number }>;
    seasonalTrends: Array<{ _id: { month: number }; avgRevenue: number }>;
    recommendations: string[];
  }> {
    try {
      const response = await analyticsApi.get<ApiResponse<{
        revenueGrowthTrend: number;
        predictedNextMonthRevenue: number;
        customerSegmentInsights: Array<{ _id: string; count: number; avgValue: number }>;
        seasonalTrends: Array<{ _id: { month: number }; avgRevenue: number }>;
        recommendations: string[];
      }>>('/analytics/predictive-insights', {
        params: filters
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch predictive insights');
    } catch (error: any) {
      console.error('Error fetching predictive insights:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch predictive insights');
    }
  }

  /**
   * Export analytics data
   */
  async exportData(type: 'dashboard' | 'revenue' | 'customer' | 'conversion', format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    try {
      const response = await analyticsApi.get(`/analytics/export/${type}`, {
        params: { format },
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error exporting analytics data:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to export analytics data');
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any, type: string): string {
    // This is a simplified CSV conversion
    // In a real implementation, you'd want more sophisticated CSV handling
    try {
      const jsonString = JSON.stringify(data, null, 2);
      return `"Analytics Export - ${type}","${new Date().toISOString()}"\n"Data","${jsonString.replace(/"/g, '""')}"`;
    } catch (error) {
      return `"Analytics Export - ${type}","${new Date().toISOString()}"\n"Error","Failed to convert data"`;
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;