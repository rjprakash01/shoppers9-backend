import { api } from './api';
import axios from 'axios';

// Create a separate API instance for main backend categories
const mainApi = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.VITE_API_URL || 'https://api.shoppers9.com'
    : 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Category {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentCategory?: string;
  level: number;
  isActive: boolean;
  sortOrder: number;
  children?: Category[];
}

export interface CategoriesResponse {
  success: boolean;
  data: {
    categories: Category[];
  };
}

class CategoriesService {
  /**
   * Get category tree structure (hierarchical)
   */
  async getCategoryTree(): Promise<Category[]> {
    try {
      console.log('Making API call to main backend /categories/tree');
      // Add cache-busting parameter to force fresh data
      const response = await mainApi.get(`/categories/tree?t=${Date.now()}`);
      console.log('Main API response:', response);
      console.log('Response data:', response.data);
      
      // Handle the main API response structure: {success: true, data: [...]}
      if (response.data.success && response.data.data && Array.isArray(response.data.data)) {
        console.log('Categories found from main backend:', response.data.data.length);
        return response.data.data;
      }
      
      // Fallback: try direct array response
      if (Array.isArray(response.data)) {
        console.log('Direct array response from main backend:', response.data.length);
        return response.data;
      }
      
      console.log('No categories found in main backend response');
      return [];
    } catch (error) {
      console.error('Error in getCategoryTree from main backend:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Error status:', error.response?.status);
      console.error('Main API URL being called:', `${mainApi.defaults.baseURL}/categories/tree`);
      
      return [];
    }
  }

  /**
   * Get all categories (flat list)
   */
  async getAllCategories(): Promise<Category[]> {
    try {
      const response = await mainApi.get('/categories');
      if (response.data.success && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (response.data.success && response.data.data && response.data.data.categories) {
        return response.data.data.categories;
      }
      return [];
    } catch (error) {
      console.error('Error in getAllCategories from main backend:', error);
      return [];
    }
  }

  /**
   * Get categories by level
   */
  async getCategoriesByLevel(level: number): Promise<Category[]> {
    try {
      const response = await api.get<CategoriesResponse>(`/categories/level/${level}`);
      if (response.data.success && response.data.data && response.data.data.categories) {
        return response.data.data.categories;
      }
      return [];
    } catch (error) {
      console.error('Error in getCategoriesByLevel:', error);
      return [];
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<Category | null> {
    try {
      const response = await api.get(`/categories/${id}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      
      return null;
    }
  }
}

export const categoriesService = new CategoriesService();
export default categoriesService;