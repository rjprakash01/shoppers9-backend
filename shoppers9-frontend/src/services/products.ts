import api from './api';

export interface ProductColor {
  name: string;
  code: string;
  images?: string[];
}

export interface ProductSizeOption {
  name: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discount?: number;
  images: string[];
  category: {
    _id: string;
    name: string;
    slug: string;
    level?: number;
    parentCategory?: string | null;
  } | string;
  subCategory?: {
    _id: string;
    name: string;
    slug: string;
    level?: number;
    parentCategory?: string;
  };
  subcategory?: string;
  subsubcategory?: string;
  brand: string;
  variants: ProductVariant[];
  availableColors?: ProductColor[];
  availableSizes?: ProductSizeOption[];
  specifications: Record<string, any>;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  stock: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  _id: string;
  size: string;
  color?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  sku: string;
  images?: string[];
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  subsubcategory?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
  sortBy?: 'price_low' | 'price_high' | 'newest' | 'rating' | 'popularity';
  page?: number;
  limit?: number;
  search?: string;
  filters?: Record<string, string[]>;
  _t?: number; // Cache busting
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface FiltersResponse {
  brands: Array<{ name: string; count: number }>;
  categories: Array<{ name: string; slug: string; count: number }>;
  priceRanges: Array<{ min: number; max: number; count: number }>;
  dynamicFilters: Record<string, Array<{ value: string; displayValue: string; count: number }>>;
}

class ProductService {
  async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await api.get(`/products?${params.toString()}`);
    return response.data.data;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data.data.product;
  }

  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    const response = await api.get(`/products/featured?limit=${limit}`);
    return response.data.data.products || [];
  }

  async getTrendingProducts(limit: number = 12): Promise<Product[]> {
    const response = await api.get(`/products/trending?limit=${limit}`);
    return response.data.data.products || [];
  }

  async getFilters(category?: string): Promise<FiltersResponse> {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    const response = await api.get(`/products/filters${params}`);
    return response.data.data;
  }

  async searchProducts(query: string, filters: ProductFilters = {}): Promise<ProductsResponse> {
    const searchFilters = { ...filters, search: query };
    return this.getProducts(searchFilters);
  }

  async getProductsByCategory(category: string, filters: ProductFilters = {}): Promise<ProductsResponse> {
    const categoryFilters = { ...filters, category };
    return this.getProducts(categoryFilters);
  }

  async getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
    const response = await api.get(`/products/${productId}/related?limit=${limit}`);
    return response.data.data.products || [];
  }
}

export const productService = new ProductService();
export default productService;