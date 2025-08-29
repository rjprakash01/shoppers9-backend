import api from './api';

export interface ProductSize {
  size: string;
  price: number;
  originalPrice: number;
  discount: number;
  stock: number;
  sku: string;
}

export interface ProductVariant {
  _id?: string;
  color: string;
  colorCode?: string;
  sizes: ProductSize[];
  images: string[];
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
  images: string[];
  variants: ProductVariant[];
  specifications: ProductSpecification;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Virtual fields
  minPrice?: number;
  maxPrice?: number;
  totalStock?: number;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  pages: number;
}

export interface ProductFilters {
  category?: string;
  subCategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  fabric?: string;
  fit?: string;
  material?: string;
  microwaveSafe?: boolean;
  inStock?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

class ProductService {
  async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/products?${params.toString()}`);
    return response.data;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
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
    const response = await this.getProducts({ limit, sortBy: 'createdAt', sortOrder: 'desc' });
    return response.products;
  }

  async getRelatedProducts(productId: string, category: string, limit: number = 4): Promise<Product[]> {
    const response = await this.getProducts({ 
      category, 
      limit: limit + 1 // Get one extra to exclude current product
    });
    
    // Filter out the current product
    return response.products.filter(product => product._id !== productId).slice(0, limit);
  }
}

export const productService = new ProductService();
export default productService;