import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
  private cache: { data: Banner[]; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 10 * 1000; // 10 seconds for faster updates

  // Get active banners for frontend carousel with caching
  async getActiveBanners(forceRefresh = false): Promise<Banner[]> {
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh && this.cache && Date.now() - this.cache.timestamp < this.CACHE_DURATION) {
      return this.cache.data;
    }

    try {
      const response = await axios.get<BannerResponse>(`${this.baseURL}/active`, {
        timeout: 1000 // Reduced timeout to 1 second for faster fallback
      });
      
      const banners = response.data.data || [];
      
      // Cache successful response
      this.cache = {
        data: banners.length > 0 ? banners : FALLBACK_BANNERS,
        timestamp: Date.now()
      };
      
      return this.cache.data;
    } catch (error: any) {
      console.warn('Banner API unavailable, using fallback banners:', error.message);
      
      // Cache fallback data for shorter duration
      this.cache = {
        data: FALLBACK_BANNERS,
        timestamp: Date.now() - (this.CACHE_DURATION - 30000) // Cache for only 30 seconds
      };
      
      return FALLBACK_BANNERS;
    }
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache = null;
  }

  // Admin methods (require authentication)
  async getAllBanners(page = 1, limit = 20): Promise<{ banners: Banner[]; pagination: any }> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${this.baseURL}`, {
        params: { page, limit },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching banners:', error);
      throw error;
    }
  }

  async getBannerById(bannerId: string): Promise<Banner> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${this.baseURL}/${bannerId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching banner:', error);
      throw error;
    }
  }

  async createBanner(bannerData: Partial<Banner>): Promise<Banner> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${this.baseURL}`, bannerData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating banner:', error);
      throw error;
    }
  }

  async updateBanner(bannerId: string, bannerData: Partial<Banner>): Promise<Banner> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${this.baseURL}/${bannerId}`, bannerData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error updating banner:', error);
      throw error;
    }
  }

  async deleteBanner(bannerId: string): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${this.baseURL}/${bannerId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error deleting banner:', error);
      throw error;
    }
  }

  async updateBannerStatus(bannerId: string, isActive: boolean): Promise<Banner> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${this.baseURL}/${bannerId}/status`, 
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
      console.error('Error updating banner status:', error);
      throw error;
    }
  }

  async reorderBanners(bannerOrders: { id: string; order: number }[]): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${this.baseURL}/reorder`, 
        { bannerOrders }, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error reordering banners:', error);
      throw error;
    }
  }
}

export const bannerService = new BannerService();
export default bannerService;