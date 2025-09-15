import axios from 'axios';

// Create API instance for inventory operations
const inventoryApi = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.VITE_API_URL || 'https://api.shoppers9.com'
    : 'http://localhost:5002/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
inventoryApi.interceptors.request.use(
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

inventoryApi.interceptors.response.use(
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
export interface InventoryReport {
  totalProducts: number;
  totalVariants: number;
  totalStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  criticalStockItems: number;
  topSellingVariants: Array<{
    productId: string;
    productName: string;
    variantId: string;
    variant: {
      color: string;
      size: string;
      sku: string;
      stock: number;
    };
  }>;
}

export interface LowStockAlert {
  productId: string;
  productName: string;
  variantId: string;
  variant: {
    color: string;
    size: string;
    sku: string;
    currentStock: number;
  };
  threshold: number;
  severity: 'low' | 'critical' | 'out_of_stock';
}

export interface DetailedInventoryProduct {
  _id: string;
  name: string;
  brand: string;
  category: {
    _id: string;
    name: string;
  };
  subCategory: {
    _id: string;
    name: string;
  };
  totalStock: number;
  variants: Array<{
    _id: string;
    color: string;
    size: string;
    sku: string;
    price: number;
    originalPrice: number;
    stock: number;
    stockStatus: 'in_stock' | 'low' | 'critical' | 'out_of_stock';
    images: string[];
  }>;
  variantCount: number;
  lowStockVariants: number;
  outOfStockVariants: number;
}

export interface StockUpdateRequest {
  productId: string;
  variantId: string;
  stock: number;
  operation: 'set' | 'increase' | 'decrease';
  reason?: string;
}

export interface BulkUpdateRequest {
  updates: Array<{
    sku: string;
    newStock: number;
    reason?: string;
  }>;
}

export interface ReorderSuggestion {
  _id: string;
  name: string;
  brand: string;
  category: {
    _id: string;
    name: string;
  };
  subCategory: {
    _id: string;
    name: string;
  };
  lowStockVariants: Array<{
    _id: string;
    color: string;
    size: string;
    sku: string;
    currentStock: number;
    suggestedReorder: number;
    priority: 'urgent' | 'high' | 'medium';
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

class InventoryService {
  /**
   * Get inventory overview and statistics
   */
  async getInventoryReport(): Promise<InventoryReport> {
    try {
      const response = await inventoryApi.get<ApiResponse<InventoryReport>>('/inventory/overview');
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch inventory report');
    } catch (error: any) {
      console.error('Error fetching inventory report:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch inventory report');
    }
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(): Promise<{
    alerts: LowStockAlert[];
    count: number;
    summary: {
      outOfStock: number;
      critical: number;
      low: number;
    };
  }> {
    try {
      const response = await inventoryApi.get<ApiResponse<{
        alerts: LowStockAlert[];
        count: number;
        summary: {
          outOfStock: number;
          critical: number;
          low: number;
        };
      }>>('/inventory/alerts');
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch stock alerts');
    } catch (error: any) {
      console.error('Error fetching stock alerts:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch stock alerts');
    }
  }

  /**
   * Get detailed inventory for all products
   */
  async getDetailedInventory(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    stockStatus?: string;
  }): Promise<{
    products: DetailedInventoryProduct[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const response = await inventoryApi.get<ApiResponse<{
        products: DetailedInventoryProduct[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>>('/inventory/detailed', { params });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch detailed inventory');
    } catch (error: any) {
      console.error('Error fetching detailed inventory:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch detailed inventory');
    }
  }

  /**
   * Update stock for a specific variant
   */
  async updateVariantStock(request: StockUpdateRequest): Promise<any> {
    try {
      const { productId, variantId, ...updateData } = request;
      const response = await inventoryApi.put<ApiResponse<any>>(
        `/inventory/products/${productId}/variants/${variantId}/stock`,
        updateData
      );
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to update stock');
    } catch (error: any) {
      console.error('Error updating stock:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update stock');
    }
  }

  /**
   * Bulk update stock from CSV or form data
   */
  async bulkUpdateStock(request: BulkUpdateRequest): Promise<{
    successful: number;
    failed: Array<{ sku: string; error: string }>;
    total: number;
    successRate: string;
  }> {
    try {
      const response = await inventoryApi.post<ApiResponse<{
        successful: number;
        failed: Array<{ sku: string; error: string }>;
        total: number;
        successRate: string;
      }>>('/inventory/bulk-update', request);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to bulk update stock');
    } catch (error: any) {
      console.error('Error bulk updating stock:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to bulk update stock');
    }
  }

  /**
   * Get stock history for a product variant
   */
  async getStockHistory(productId: string, variantId: string): Promise<{
    history: any[];
    count: number;
  }> {
    try {
      const response = await inventoryApi.get<ApiResponse<{
        history: any[];
        count: number;
      }>>(`/inventory/products/${productId}/variants/${variantId}/history`);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch stock history');
    } catch (error: any) {
      console.error('Error fetching stock history:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch stock history');
    }
  }

  /**
   * Check stock availability for multiple items
   */
  async checkStockAvailability(items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
  }>): Promise<{
    inStock: boolean;
    unavailableItems: Array<{
      productId: string;
      variantId: string;
      requested: number;
      available: number;
    }>;
    availableItems: Array<{
      productId: string;
      variantId: string;
      quantity: number;
    }>;
  }> {
    try {
      const response = await inventoryApi.post<ApiResponse<{
        inStock: boolean;
        unavailableItems: Array<{
          productId: string;
          variantId: string;
          requested: number;
          available: number;
        }>;
        availableItems: Array<{
          productId: string;
          variantId: string;
          quantity: number;
        }>;
      }>>('/inventory/check-stock', { items });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to check stock availability');
    } catch (error: any) {
      console.error('Error checking stock availability:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to check stock availability');
    }
  }

  /**
   * Get products with low stock for reorder suggestions
   */
  async getReorderSuggestions(threshold?: number): Promise<{
    suggestions: ReorderSuggestion[];
    count: number;
    totalVariants: number;
  }> {
    try {
      const params = threshold ? { threshold } : {};
      const response = await inventoryApi.get<ApiResponse<{
        suggestions: ReorderSuggestion[];
        count: number;
        totalVariants: number;
      }>>('/inventory/reorder-suggestions', { params });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch reorder suggestions');
    } catch (error: any) {
      console.error('Error fetching reorder suggestions:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch reorder suggestions');
    }
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;