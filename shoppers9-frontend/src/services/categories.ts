import { api } from './api';

export interface Category {
  _id: string;
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
      const response = await api.get<CategoriesResponse>('/categories/tree');
      if (response.data.success && response.data.data.categories) {
        return response.data.data.categories;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch category tree:', error);
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
      console.error('Failed to fetch categories:', error);
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
      console.error(`Failed to fetch level ${level} categories:`, error);
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
      console.error('Failed to fetch category:', error);
      return null;
    }
  }
}

export const categoriesService = new CategoriesService();
export default categoriesService;