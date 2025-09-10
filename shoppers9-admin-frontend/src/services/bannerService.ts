import axios from 'axios';

// Use relative URL in development to leverage Vite proxy, absolute URL in production
const API_BASE_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4000';
const ADMIN_API_BASE_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4000';

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
  displayType?: 'carousel' | 'category-card' | 'both';
  categoryId?: string;
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
  private baseURL = `${API_BASE_URL}/api/admin/banners`;

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
      console.error('Error fetching banners:', error);
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
      console.error('Error fetching banner:', error);
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
      console.error('Error creating banner:', error);
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
      console.error('Error updating banner:', error);
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
      console.error('Error deleting banner:', error);
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
      console.error('Error updating banner status:', error);
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
      console.error('Error reordering banners:', error);
      throw error;
    }
  }

  // Upload banner image
  async uploadBannerImage(file: File): Promise<string> {
    try {
      console.log('Starting banner image upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      
      const formData = new FormData();
      formData.append('image', file);

      const uploadUrl = `${API_BASE_URL}/api/admin/banners/upload/banner`;
      console.log('Upload URL:', uploadUrl);
      
      const headers = this.getUploadHeaders();
      console.log('Upload headers:', { ...headers, Authorization: headers.Authorization ? '[PRESENT]' : '[MISSING]' });

      const response = await axios.post(
        uploadUrl,
        formData,
        { headers }
      );
      
      console.log('Upload response:', response.data);
      return response.data.data.imageUrl;
    } catch (error: any) {
      console.error('Error uploading banner image:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code
      });
      throw error;
    }
  }
}

export const adminBannerService = new AdminBannerService();
export default adminBannerService;