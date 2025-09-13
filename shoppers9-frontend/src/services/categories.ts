import { api } from './api';

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
      console.log('Making API call to /categories/tree');
      // Add cache-busting parameter to force fresh data
      const response = await api.get<CategoriesResponse>(`/categories/tree?t=${Date.now()}`);
      console.log('API response:', response);
      console.log('Response data:', response.data);
      
      // Handle different possible response structures
      if (response.data.success && response.data.data && response.data.data.categories) {
        console.log('Categories found in nested structure:', response.data.data.categories.length);
        return response.data.data.categories;
      }
      
      // Try direct data.categories structure
      if (response.data.data && Array.isArray(response.data.data)) {
        console.log('Categories found in data array:', response.data.data.length);
        return response.data.data;
      }
      
      // Try direct array response
      if (Array.isArray(response.data)) {
        console.log('Direct array response:', response.data.length);
        return response.data;
      }
      
      // Try response.data.categories directly
      if (response.data.categories && Array.isArray(response.data.categories)) {
        console.log('Categories found in direct categories:', response.data.categories.length);
        return response.data.categories;
      }
      
      console.log('No categories found in response');
      return [];
    } catch (error) {
      console.error('Error in getCategoryTree:', error);
      return [];
    }
  }

  /**
   * Get all categories (flat list)
   */
  async getAllCategories(): Promise<Category[]> {
    try {
      const response = await api.get<CategoriesResponse>('/categories');
      if (response.data.success && response.data.data.categories) {
        return response.data.data.categories;
      }
      return [];
    } catch (error) {
      
      return [];
    }
  }

  /**
   * Get categories by level
   */
  async getCategoriesByLevel(level: number): Promise<Category[]> {
    try {
      const response = await api.get<CategoriesResponse>(`/categories/level/${level}`);
      if (response.data.success && response.data.data.categories) {
        return response.data.data.categories;
      }
      return [];
    } catch (error) {
      
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