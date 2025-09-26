import axios from 'axios';
import { api } from './api';

// Use the same API configuration as other services
const API_BASE_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL || 'https://api.shoppers9.com'
  : import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

class AuthService {
  private getErrorMessage(error: unknown, defaultMessage: string): string {
    return error instanceof Error && 'response' in error && 
      typeof error.response === 'object' && error.response !== null &&
      'data' in error.response && typeof error.response.data === 'object' &&
      error.response.data !== null && 'message' in error.response.data
      ? String(error.response.data.message)
      : defaultMessage;
  }

  constructor() {
    // Use the shared API instance which already has proper interceptors configured
    // No need to set up additional interceptors here
  }

  setAuthToken(token: string | null) {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }

  async login(loginField: string, password: string, loginType: 'email' | 'phone' = 'email') {
    try {
      console.log('=== FRONTEND LOGIN ATTEMPT ===');
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Login field:', loginField);
      console.log('Login type:', loginType);
      
      const payload = loginType === 'email' 
        ? { email: loginField, password }
        : { phone: loginField, password };
      
      console.log('Payload:', payload);
      console.log('Making request to:', `/auth/login`);
      
      const response = await api.post('/auth/login', payload);
      
      console.log('Response received:', response.status, response.data);
      
      if (response.data.success) {
        const { accessToken, user } = response.data.data;
        localStorage.setItem('adminToken', accessToken);
        localStorage.setItem('adminUser', JSON.stringify(user));
        this.setAuthToken(accessToken);
        return { success: true, user };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error: unknown) {
      console.log('=== FRONTEND LOGIN ERROR ===');
      console.log('Error details:', error);
      if (error instanceof Error) {
        console.log('Error message:', error.message);
        console.log('Error stack:', error.stack);
      }
      if (error && typeof error === 'object' && 'response' in error) {
        console.log('Response error:', (error as any).response);
      }
      console.log('=== END FRONTEND LOGIN ERROR ===');
      return { success: false, message: this.getErrorMessage(error, 'Login failed') };
    }
  }

  async sendOTP(phone: string) {
    try {
      const response = await api.post('/auth/send-otp', {
        phone
      });
      
      return response.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to send OTP'));
    }
  }

  async verifyOTP(phone: string, otp: string) {
    try {
      const response = await api.post('/auth/verify-otp', {
        phone,
        otp
      });
      
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'OTP verification failed'));
    }
  }

  // Admin API methods
  async getDashboardStats(startDate?: string, endDate?: string) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/admin/analytics/dashboard?${params.toString()}`);
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to fetch dashboard stats'));
    }
  }

  async getSalesAnalytics(period: string = '30d') {
    try {
      const response = await api.get(`/admin/analytics/sales?period=${period}`);
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to fetch sales analytics'));
    }
  }

  async getAllUsers(page: number = 1, limit: number = 10, search?: string) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await api.get(`/admin/users?${params.toString()}`);
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to fetch users'));
    }
  }

  async updateUserStatus(userId: string, isVerified: boolean) {
    try {
      const response = await api.patch(`/admin/users/${userId}/status`, {
        isVerified
      });
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to update user status'));
    }
  }

  async getAllProducts(page: number = 1, limit: number = 10, search?: string, status?: string, category?: string) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (search) {
        params.append('search', search);
      }
      
      if (status) {
        params.append('status', status);
      }
      
      if (category) {
        params.append('category', category);
      }
      
      const response = await api.get(`/admin/products?${params.toString()}`);
      
      if (response.data.success) {
        return {
          products: response.data.data.products,
          pagination: {
            currentPage: response.data.data.pagination.page,
            totalPages: response.data.data.pagination.pages,
            totalProducts: response.data.data.pagination.total,
            hasNext: response.data.data.pagination.page < response.data.data.pagination.pages,
            hasPrev: response.data.data.pagination.page > 1
          }
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch products');
      }
    } catch (error) {
      throw new Error(this.getErrorMessage(error, 'Failed to fetch products'));
    }
  }

  async updateProductStatus(productId: string, isActive: boolean) {
    try {
      const response = await api.patch(`/admin/products/${productId}/status`, {
        isActive
      });
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to update product status'));
    }
  }

  // Product Review Queue Methods
  async getReviewQueue(page: number = 1, limit: number = 10, status?: string, search?: string) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (status) {
        params.append('status', status);
      }
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await api.get(`/admin/products/review-queue?${params.toString()}`);
      
      // Debug logging
      console.log('🔍 AuthService getReviewQueue response:', {
        success: response.data.success,
        hasData: !!response.data.data,
        hasProducts: !!response.data.data?.products,
        hasPagination: !!response.data.data?.pagination,
        productsLength: response.data.data?.products?.length || 0
      });
      
      if (response.data.success && response.data.data) {
        return {
          products: response.data.data.products || [],
          pagination: response.data.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalProducts: 0,
            hasNext: false,
            hasPrev: false
          }
        };
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: unknown) {
      console.error('🔍 AuthService getReviewQueue error:', error);
      throw new Error(this.getErrorMessage(error, 'Failed to fetch review queue'));
    }
  }

  async submitProductForReview(productId: string) {
    try {
      const response = await api.post(`/admin/products/${productId}/submit-for-review`);
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to submit product for review'));
    }
  }

  async approveProduct(productId: string, comments?: string) {
    try {
      const response = await api.patch(`/admin/products/${productId}/approve`, {
        comments
      });
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to approve product'));
    }
  }

  async rejectProduct(productId: string, reason: string, comments?: string) {
    try {
      console.log('🌐 authService.rejectProduct called with:', {
        productId,
        reason,
        comments
      });
      
      const requestData = {
        reason,
        comments
      };
      
      console.log('📤 Sending PATCH request to:', `/admin/products/${productId}/reject`);
      console.log('📤 Request data:', requestData);
      
      const response = await api.patch(`/admin/products/${productId}/reject`, requestData);
      
      console.log('📥 Response received:', {
        status: response.status,
        data: response.data
      });
      
      return response.data.data;
    } catch (error: unknown) {
      console.error('🚨 authService.rejectProduct error:', error);
      throw new Error(this.getErrorMessage(error, 'Failed to reject product'));
    }
  }

  async requestProductChanges(productId: string, reason: string, comments?: string) {
    try {
      const response = await api.patch(`/admin/products/${productId}/request-changes`, {
        reason,
        comments
      });
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to request product changes'));
    }
  }

  async bulkReviewAction(productIds: string[], action: string, reason?: string, comments?: string) {
    try {
      const response = await api.post('/admin/products/bulk-review-action', {
        productIds,
        action,
        reason,
        comments
      });
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to perform bulk review action'));
    }
  }

  async getAllOrders(page: number = 1, limit: number = 10, status?: string) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (status) {
        params.append('status', status);
      }
      
      const response = await api.get(`/admin/orders?${params.toString()}`);
      
      if (response.data.success) {
        // Debug: Log the raw API response
        console.log('=== FRONTEND ORDER DEBUG ===');
        console.log('Raw API response:', response.data);
        if (response.data.data.orders.length > 0) {
          console.log('First order raw data:', response.data.data.orders[0]);
          console.log('First order totalAmount:', response.data.data.orders[0].totalAmount);
          console.log('First order finalAmount:', response.data.data.orders[0].finalAmount);
        }
        console.log('=== END FRONTEND ORDER DEBUG ===');
        
        return {
          orders: response.data.data.orders.map((order: any) => ({
            id: order.id,
            orderId: order.orderNumber,
            userId: {
              id: order.userId?.id || order.userId,
              name: order.userId ? `${order.userId.firstName || ''} ${order.userId.lastName || ''}`.trim() || 'Unknown User' : 'Unknown User',
              phone: order.userId?.phone || 'N/A'
            },
            items: order.items?.map((item: any) => {
              // Find the variant for additional info like color
              const variant = item.product?.variants?.find((v: any) => v._id === item.variantId);
              // Use the original order item price, not current variant price
              const itemPrice = item.price || 0;
              
              return {
                productId: item.product?.id || item.product,
                productName: item.product?.name || item.name,
                quantity: item.quantity,
                price: itemPrice,
                originalPrice: item.originalPrice || itemPrice,
                variantId: item.variantId,
                size: item.size,
                color: variant?.color
              };
            }) || [],
            totalAmount: order.totalAmount,
            finalAmount: order.finalAmount,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            shippingAddress: {
              street: order.shippingAddress?.addressLine1 || '',
              city: order.shippingAddress?.city || '',
              state: order.shippingAddress?.state || '',
              pinCode: order.shippingAddress?.pincode || ''
            },
            trackingId: order.trackingId,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
          })),
          pagination: {
            currentPage: response.data.data.pagination.page,
            totalPages: response.data.data.pagination.pages,
            totalOrders: response.data.data.pagination.total,
            hasNext: response.data.data.pagination.page < response.data.data.pagination.pages,
            hasPrev: response.data.data.pagination.page > 1
          }
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      throw new Error(this.getErrorMessage(error, 'Failed to fetch orders'));
    }
  }

  async updateOrderStatus(orderId: string, status: string, trackingId?: string) {
    try {
      const response = await api.patch(`/admin/orders/${orderId}/status`, {
        status,
        trackingId
      });
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to update order status'));
    }
  }

  async getAllCategories(page: number = 1, limit: number = 10, search?: string, status?: string) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (search) {
        params.append('search', search);
      }
      
      if (status) {
        params.append('status', status);
      }
      
      const response = await api.get(`/admin/categories?${params.toString()}`);
      
      // Handle the backend response format: {success: true, data: {categories: [...], pagination: {...}}}
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: unknown) {
      
      throw new Error(this.getErrorMessage(error, 'Failed to fetch categories'));
    }
  }

  async updateCategoryStatus(categoryId: string, isActive: boolean) {
    try {
      const response = await api.patch(`/admin/categories/${categoryId}/status`, {
        isActive
      });
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to update category status'));
    }
  }

  async createProduct(productData: FormData | object) {
    try {
      const config = productData instanceof FormData ? {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      } : {};
      
      const response = await api.post('/admin/products', productData, config);
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to create product'));
    }
  }

  async createCategory(categoryData: FormData | object) {
    try {
      const config = categoryData instanceof FormData ? {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      } : {};
      
      const response = await api.post('/admin/categories', categoryData, config);
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to create category'));
    }
  }

  async updateProduct(productId: string, productData: FormData | object) {
    try {
      const config = productData instanceof FormData ? {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      } : {};
      
      const response = await api.put(`/admin/products/${productId}`, productData, config);
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to update product'));
    }
  }

  async updateCategory(categoryId: string, categoryData: FormData | object) {
    try {
      const config = categoryData instanceof FormData ? {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      } : {};
      
      const response = await api.put(`/admin/categories/${categoryId}`, categoryData, config);
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to update category'));
    }
  }

  async getProductById(productId: string) {
    try {
      const response = await api.get(`/admin/products/${productId}`);
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to get product'));
    }
  }

  async getCategoryById(categoryId: string) {
    try {
      const response = await api.get(`/admin/categories/${categoryId}`);
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to get category'));
    }
  }

  async getProductsByCategory(categoryId: string, page: number = 1, limit: number = 10) {
    try {
      const response = await api.get(`/admin/products?category=${categoryId}&page=${page}&limit=${limit}`);
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to get products by category'));
    }
  }

  async deleteProduct(productId: string) {
    try {
      const response = await api.delete(`/admin/products/${productId}`);
      return response.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to delete product'));
    }
  }

  async getCategoryTree() {
    try {
      const response = await api.get('/admin/categories/tree');
      return response.data;
    } catch (error: unknown) {
      throw new Error(this.getErrorMessage(error, 'Failed to get category tree'));
    }
  }

  async get(url: string) {
    try {
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      // Preserve the original error structure for better error handling
      throw error;
    }
  }

  async post(url: string, data?: any) {
    try {
      const response = await api.post(url, data);
      return response.data;
    } catch (error: any) {
      // Preserve the original error structure for better error handling
      throw error;
    }
  }

  async put(url: string, data?: any) {
    try {
      const response = await api.put(url, data);
      return response.data;
    } catch (error: any) {
      // Preserve the original error structure for better error handling
      throw error;
    }
  }

  async delete(url: string) {
    try {
      const response = await api.delete(url);
      return response.data;
    } catch (error: any) {
      // Preserve the original error structure for better error handling
      throw error;
    }
  }
}

export const authService = new AuthService();