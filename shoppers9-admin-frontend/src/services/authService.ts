import axios from 'axios';

const API_BASE_URL = 'http://localhost:5002/api';

class AuthService {
  private token: string | null = null;

  constructor() {
    // Set up axios defaults
    axios.defaults.baseURL = API_BASE_URL;
    
    // Add request interceptor to handle authentication
    axios.interceptors.request.use(
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
    
    // Add response interceptor to handle authentication errors
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear invalid token and redirect to login
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string | null) {
    this.token = token;
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }

  async login(loginField: string, password: string, loginType: 'email' | 'phone' = 'email') {
    try {
      const payload = loginType === 'email' 
        ? { email: loginField, password }
        : { phoneNumber: loginField, password };
      
      const response = await axios.post('/auth/login', payload);
      
      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify(user));
        this.setAuthToken(token);
        return { success: true, user };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  }

  async sendOTP(phone: string) {
    try {
      const response = await axios.post('/auth/send-otp', {
        phone
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send OTP');
    }
  }

  async verifyOTP(phone: string, otp: string) {
    try {
      const response = await axios.post('/auth/verify-otp', {
        phone,
        otp
      });
      
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'OTP verification failed');
    }
  }

  // Admin API methods
  async getDashboardStats(startDate?: string, endDate?: string) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await axios.get(`/analytics/dashboard?${params}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard stats');
    }
  }

  async getSalesAnalytics(period: string = '30d') {
    try {
      const response = await axios.get(`/analytics/sales?period=${period}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch sales analytics');
    }
  }

  async getAllUsers(page: number = 1, limit: number = 10, search?: string) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (search) params.append('search', search);
      
      const response = await axios.get(`/users?${params}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  }

  async updateUserStatus(userId: string, isVerified: boolean) {
    try {
      const response = await axios.patch(`/users/${userId}/toggle-status`, {
        isVerified
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update user status');
    }
  }

  async getAllProducts(page: number = 1, limit: number = 10, search?: string) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (search) params.append('search', search);
      
      const response = await axios.get(`/products?${params}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch products');
    }
  }

  async updateProductStatus(productId: string, isActive: boolean) {
    try {
      const response = await axios.put(`/products/${productId}/toggle-status`, {
        isActive
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update product status');
    }
  }

  async getAllOrders(page: number = 1, limit: number = 10, status?: string) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (status) params.append('status', status);
      
      const response = await axios.get(`/orders?${params}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch orders');
    }
  }

  async updateOrderStatus(orderId: string, status: string, trackingId?: string) {
    try {
      const response = await axios.patch(`/orders/${orderId}/status`, {
        status,
        trackingId
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update order status');
    }
  }

  async getAllCategories(page: number = 1, limit: number = 10, search?: string, status?: string) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      
      const response = await axios.get(`/categories?${params}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  }

  async updateCategoryStatus(categoryId: string, isActive: boolean) {
    try {
      const response = await axios.patch(`/categories/${categoryId}/status`, {
        isActive
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update category status');
    }
  }

  async createProduct(productData: any) {
    try {
      const config = productData instanceof FormData ? {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      } : {};
      
      const response = await axios.post('/products', productData, config);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create product');
    }
  }

  async createCategory(categoryData: any) {
    try {
      const config = categoryData instanceof FormData ? {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      } : {};
      
      const response = await axios.post('/categories', categoryData, config);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create category');
    }
  }

  async updateProduct(productId: string, productData: any) {
    try {
      const config = productData instanceof FormData ? {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      } : {};
      
      const response = await axios.put(`/products/${productId}`, productData, config);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update product');
    }
  }

  async updateCategory(categoryId: string, categoryData: any) {
    try {
      const config = categoryData instanceof FormData ? {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      } : {};
      
      const response = await axios.put(`/categories/${categoryId}`, categoryData, config);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update category');
    }
  }
}

export const authService = new AuthService();