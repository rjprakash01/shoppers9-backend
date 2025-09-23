import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Testimonial {
  _id: string;
  customerName: string;
  title: string;
  content: string;
  rating: number;
  isActive: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  category: 'product' | 'service' | 'delivery' | 'support' | 'general';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TestimonialResponse {
  success: boolean;
  message: string;
  data: Testimonial[];
}

class TestimonialService {
  private baseURL = `${API_BASE_URL}/testimonials`;

  // Get featured testimonials for homepage
  async getFeaturedTestimonials(limit = 6): Promise<Testimonial[]> {
    try {
      const response = await axios.get(`${this.baseURL}/featured?limit=${limit}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching featured testimonials:', error);
      return [];
    }
  }

  // Get testimonials by category
  async getTestimonialsByCategory(category: string, limit = 10): Promise<Testimonial[]> {
    try {
      const response = await axios.get(`${this.baseURL}/category/${category}?limit=${limit}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching testimonials by category:', error);
      return [];
    }
  }

  // Get testimonials by rating
  async getTestimonialsByRating(minRating = 4, limit = 10): Promise<Testimonial[]> {
    try {
      const response = await axios.get(`${this.baseURL}/rating/${minRating}?limit=${limit}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching testimonials by rating:', error);
      return [];
    }
  }

  // Get all active testimonials
  async getActiveTestimonials(limit = 20): Promise<Testimonial[]> {
    try {
      const response = await axios.get(`${this.baseURL}?limit=${limit}&isActive=true`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching active testimonials:', error);
      return [];
    }
  }
}

export const testimonialService = new TestimonialService();
export default testimonialService;