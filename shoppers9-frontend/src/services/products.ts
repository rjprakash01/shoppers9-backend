import api from './api';
import axios from 'axios';

// Create a separate API instance for admin backend products
const adminApi = axios.create({
  baseURL: 'http://localhost:5001/api/public',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Available Color interface (from admin panel)
export interface AvailableColor {
  name: string;
  code: string;
  images: string[];
}

// Available Size interface (from admin panel)
export interface AvailableSize {
  name: string;
}

// Product Variant interface (color-size combination)
export interface ProductVariant {
  _id?: string;
  color: string;
  colorCode?: string;
  size: string;
  price: number;
  originalPrice: number;
  stock: number;
  sku: string; // Unique SKU for this variant
  images: string[];
}

// Legacy Product Size interface (for backward compatibility)
export interface ProductSize {
  size: string;
  price: number;
  originalPrice: number;
  discount: number;
  stock: number;
  sku: string;
}

export interface ProductSpecification {
  fabric?: string;
  fit?: string;
  washCare?: string;
  material?: string;
  capacity?: string;
  microwaveSafe?: boolean;
  dimensions?: string;
  weight?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  subCategory: string;
  brand: string;
  price?: number; // Legacy field, now populated with minPrice
  originalPrice?: number;
  images: string[]; // Master/Default images
  availableColors?: AvailableColor[]; // Master color list from admin panel
  availableSizes?: AvailableSize[]; // Master size list from admin panel
  variants: ProductVariant[]; // Color-size combinations
  specifications: ProductSpecification;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  displayFilters: string[];
  createdAt: string;
  updatedAt: string;
  // Virtual fields calculated from variants
  minPrice?: number; // Minimum price across all variants
  maxPrice?: number; // Maximum price across all variants
  minOriginalPrice?: number; // Minimum original price across all variants
  maxOriginalPrice?: number; // Maximum original price across all variants
  maxDiscount?: number; // Maximum discount percentage across all variants
  totalStock?: number; // Total stock across all variants
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ProductFilters {
  category?: string;
  subCategory?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  fabric?: string[];
  fit?: string;
  material?: string[];
  microwaveSafe?: boolean;
  inStock?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface FilterOption {
  name: string;
  count: number;
  colorCode?: string;
}

export interface FilterData {
  priceRange: { minPrice: number; maxPrice: number };
  brands: FilterOption[];
  sizes: FilterOption[];
  colors: FilterOption[];
  materials: FilterOption[];
  fabrics: FilterOption[];
  subcategories: { name: string; slug: string }[];
}

class ProductService {
  async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/products?${params.toString()}`);
      
      // Handle the nested response structure from backend
      if (response.data.success && response.data.data) {
        return {
          products: response.data.data.products,
          pagination: {
            totalItems: response.data.data.pagination.totalItems,
            currentPage: response.data.data.pagination.currentPage,
            totalPages: response.data.data.pagination.totalPages,
            hasNext: response.data.data.pagination.hasNext,
            hasPrev: response.data.data.pagination.hasPrev
          }
        };
      }
      
      // Fallback for direct response structure
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Error status:', error.response?.status);
      console.error('API URL being called:', `${api.defaults.baseURL}/products`);
      throw error;
    }
  }

  async getProduct(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    // Handle the nested response structure from backend
    if (response.data.success && response.data.data) {
      return response.data.data.product;
    }
    // Fallback for direct response structure
    return response.data.product;
  }

  async getCategories(): Promise<string[]> {
    const response = await api.get('/products/categories');
    return response.data.categories;
  }

  async getSubcategories(category: string): Promise<string[]> {
    const response = await api.get(`/products/categories/${category}/subcategories`);
    return response.data.subcategories;
  }

  async searchProducts(query: string, filters: Omit<ProductFilters, 'search'> = {}): Promise<ProductsResponse> {
    return this.getProducts({ ...filters, search: query });
  }

  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    try {
      const response = await api.get('/products/featured');
      if (response.data.success) {
        return response.data.data.products.slice(0, limit);
      }
      return [];
    } catch (error) {
      console.error('Error fetching featured products:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Error status:', error.response?.status);
      console.error('API URL being called:', `${api.defaults.baseURL}/products/featured`);
      return [];
    }
  }

  async getTrendingProducts(limit: number = 8): Promise<Product[]> {
    try {
      const response = await api.get('/products/trending');
      if (response.data.success) {
        return response.data.data.products.slice(0, limit);
      }
      return [];
    } catch (error) {
      
      return [];
    }
  }

  async getRelatedProducts(productId: string, category: string, limit: number = 4): Promise<Product[]> {
    const response = await this.getProducts({ 
      category, 
      limit: limit + 1 // Get one extra to exclude current product
    });
    
    // Filter out the current product
    return response.products.filter(product => product._id !== productId).slice(0, limit);
  }

  async getFilters(category?: string): Promise<{ success: boolean; data: FilterData }> {
    try {
      const params = new URLSearchParams();
      if (category) {
        params.append('category', category);
      }
      
      const response = await api.get(`/products/filters?${params.toString()}`);
      return response.data;
    } catch (error) {
      
      return {
        success: false,
        data: {
          priceRange: { minPrice: 0, maxPrice: 10000 },
          brands: [],
          sizes: [],
          colors: [],
          materials: [],
          fabrics: [],
          subcategories: []
        }
      };
    }
  }
}

export const productService = new ProductService();
export default productService;