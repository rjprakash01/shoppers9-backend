import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if we're not already on the login page
      // and if this isn't an initial auth check (fetchCurrentUser)
      const isLoginPage = window.location.pathname === '/login';
      const isAuthCheck = error.config?.url?.includes('/auth/me');
      
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Only redirect if we're not on login page and this isn't an auth validation call
      if (!isLoginPage && !isAuthCheck) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;