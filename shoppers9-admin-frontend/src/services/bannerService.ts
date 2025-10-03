import axios from 'axios';

// Use relative URL in production to leverage nginx proxy, localhost in development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const ADMIN_API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface Banner {
  _id: string;
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  link?: string;
  buttonText?: string;
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
  displayType?: 'hero-banner';
  categoryId?: string;
  categoryType?: 'men' | 'women' | 'electronics' | 'household' | 'gifts';
  priceRange?: {
    minPrice?: number;
    maxPrice?: number;
    label: string;
    color?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BannerResponse {
  success: boolean;
  message: string;
  data: Banner[];
}

export interface BannerPaginationResponse {
  success: boolean;
  message: string;
  data: {
    banners: Banner[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

class AdminBannerService {
  private baseURL = `${API_BASE_URL}/admin/banners`;

  private getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  private getUploadHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
      Authorization: `Bearer ${token}`
    };
  }

  // Get all banners with pagination
  async getAllBanners(page: number = 1, limit: number = 20): Promise<BannerPaginationResponse> {
    try {
      const response = await axios.get<BannerPaginationResponse>(
        `${this.baseURL}?page=${page}&limit=${limit}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }

  // Get banner by ID
  async getBannerById(bannerId: string): Promise<Banner> {
    try {
      const response = await axios.get(`${this.baseURL}/${bannerId}`, {
        headers: this.getAuthHeaders()
      });
      return response.data.data;
    } catch (error) {
      
      throw error;
    }
  }

  // Create new banner
  async createBanner(bannerData: Omit<Banner, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<Banner> {
    try {
      const response = await axios.post(this.baseURL, bannerData, {
        headers: this.getAuthHeaders()
      });
      return response.data.data;
    } catch (error) {
      
      throw error;
    }
  }

  // Update banner
  async updateBanner(bannerId: string, bannerData: Partial<Banner>): Promise<Banner> {
    try {
      const response = await axios.put(`${this.baseURL}/${bannerId}`, bannerData, {
        headers: this.getAuthHeaders()
      });
      return response.data.data;
    } catch (error) {
      
      throw error;
    }
  }

  // Delete banner
  async deleteBanner(bannerId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseURL}/${bannerId}`, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      
      throw error;
    }
  }

  // Update banner status
  async updateBannerStatus(bannerId: string, isActive: boolean): Promise<Banner> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/${bannerId}/status`,
        { isActive },
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error) {
      
      throw error;
    }
  }

  // Reorder banners
  async reorderBanners(bannerIds: string[]): Promise<void> {
    try {
      await axios.put(
        `${this.baseURL}/reorder`,
        { bannerIds },
        { headers: this.getAuthHeaders() }
      );
    } catch (error) {
      
      throw error;
    }
  }

  // Upload banner image
  async uploadBannerImage(file: File): Promise<string> {
    try {

      const formData = new FormData();
      formData.append('image', file);

      const uploadUrl = `${API_BASE_URL}/admin/banners/upload/banner`;

      const headers = this.getUploadHeaders();

      const response = await axios.post(
        uploadUrl,
        formData,
        { headers }
      );

      return response.data.data.imageUrl;
    } catch (error: any) {
      
      throw error;
    }
  }
}

export const adminBannerService = new AdminBannerService();
export default adminBannerService;