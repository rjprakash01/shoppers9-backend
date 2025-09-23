import axios from 'axios';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: import.meta.env.PROD 
    ? import.meta.env.VITE_API_URL || 'https://api.shoppers9.com'
    : import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor to handle auth errors and missing endpoints
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only clear token, don't force redirect to avoid conflicts with AuthContext
      // Let the AuthContext handle authentication state and redirects
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      // Don't force redirect here - let the app handle it naturally
      // window.location.href = '/login';
    } else if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
      // Handle missing endpoints gracefully
      console.warn(`API endpoint not found: ${error.config?.url}`);
      // Return empty data structure to prevent app crashes
      return Promise.resolve({
        data: {
          success: false,
          message: 'Feature temporarily unavailable',
          data: null
        }
      });
    }
    return Promise.reject(error);
  }
);

export default api;