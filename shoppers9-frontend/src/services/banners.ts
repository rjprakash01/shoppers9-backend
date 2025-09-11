import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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
  displayType: 'carousel' | 'category-card' | 'both';
  categoryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BannerResponse {
  success: boolean;
  message: string;
  data: Banner[];
}

// Optimized mock banners with smaller, faster-loading images
const FALLBACK_BANNERS: Banner[] = [
  {
    _id: 'fallback1',
    id: 'fallback1',
    title: 'Welcome to Shoppers9',
    subtitle: 'Discover Amazing Deals',
    description: 'Shop the best products at unbeatable prices!',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzBfMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMTIwMCIgeTI9IjQwMCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjNjY2NkZGIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzMzMzNGRiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPgo=',
    link: '/products',
    buttonText: 'Shop Now',
    isActive: true,
    order: 1,
    displayType: 'carousel' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'fallback2',
    id: 'fallback2',
    title: 'New Arrivals',
    subtitle: 'Fresh Collection',
    description: 'Discover the latest trends and styles!',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzBfMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMTIwMCIgeTI9IjQwMCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjRkY2NjY2Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0ZGMzMzMyIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPgo=',
    link: '/products',
    buttonText: 'Explore',
    isActive: true,
    order: 2,
    displayType: 'carousel' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

class BannerService {
  private baseURL = `${API_BASE_URL}/banners`;
  private adminBaseURL = `${API_BASE_URL}/admin/banners`;
  private cache: { data: Banner[]; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 60 * 1000; // 1 minute cache to reduce server load

  // Get active banners for frontend carousel with caching
  async getActiveBanners(forceRefresh = false): Promise<Banner[]> {
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh && this.cache && Date.now() - this.cache.timestamp < this.CACHE_DURATION) {
      return this.cache.data;
    }

    try {
      const response = await axios.get<BannerResponse>(`${this.baseURL}/active`, {
        timeout: 5000 // Increased timeout to 5 seconds to prevent premature failures
      });
      
      const banners = response.data.data || [];


      
      // Cache successful response - always use API data, even if empty
      this.cache = {
        data: banners,
        timestamp: Date.now()
      };
      
      // Always return API data, even if empty - don't use fallback
      
      return banners;
    } catch (error: any) {

      // Try to return cached data first
      if (this.cache && this.cache.data.length > 0 && !this.cache.data[0].id.startsWith('fallback')) {
        
        return this.cache.data;
      }

      // Return empty array instead of fallback to force proper loading
      return [];
    }
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache = null;
    // Also clear any localStorage cache
    try {
      localStorage.removeItem('bannerCache');
      localStorage.removeItem('banners');
    } catch (error) {
      
    }
  }

  // Admin methods (require authentication)
  async getAllBanners(page = 1, limit = 20): Promise<{ banners: Banner[]; pagination: any }> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${this.adminBaseURL}`, {
        params: { page, limit },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.data;
    } catch (error) {
      
      throw error;
    }
  }

  async getBannerById(bannerId: string): Promise<Banner> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${this.adminBaseURL}/${bannerId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.data;
    } catch (error) {
      
      throw error;
    }
  }

  async createBanner(bannerData: Partial<Banner>): Promise<Banner> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${this.adminBaseURL}`, bannerData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data.data;
    } catch (error) {
      
      throw error;
    }
  }

  async updateBanner(bannerId: string, bannerData: Partial<Banner>): Promise<Banner> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${this.adminBaseURL}/${bannerId}`, bannerData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data.data;
    } catch (error) {
      
      throw error;
    }
  }

  async deleteBanner(bannerId: string): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${this.adminBaseURL}/${bannerId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      
      throw error;
    }
  }

  async updateBannerStatus(bannerId: string, isActive: boolean): Promise<Banner> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${this.adminBaseURL}/${bannerId}/status`, 
        { isActive }, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.data;
    } catch (error) {
      
      throw error;
    }
  }

  async reorderBanners(bannerOrders: { id: string; order: number }[]): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${this.adminBaseURL}/reorder`, 
        { bannerOrders }, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      
      throw error;
    }
  }
}

export const bannerService = new BannerService();
export default bannerService;