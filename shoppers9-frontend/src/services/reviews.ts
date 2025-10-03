import api from './api';
import type { Review, ReviewSummary, ReviewsResponse, CreateReviewData } from '../types/review';

// Re-export types for convenience
export type { Review, ReviewSummary, ReviewsResponse, CreateReviewData }

class ReviewService {
  async getProductReviews(productId: string, page = 1, limit = 10): Promise<ReviewsResponse> {
    try {
      const response = await api.get(`/products/${productId}/reviews`, {
        params: { page, limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      throw error;
    }
  }

  async createReview(reviewData: CreateReviewData): Promise<Review> {
    try {
      const response = await api.post('/reviews', reviewData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  async updateReview(reviewId: string, reviewData: Partial<CreateReviewData>): Promise<Review> {
    try {
      const response = await api.put(`/reviews/${reviewId}`, reviewData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  async deleteReview(reviewId: string): Promise<void> {
    try {
      await api.delete(`/reviews/${reviewId}`);
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }

  async getUserReviewForProduct(productId: string): Promise<Review | null> {
    try {
      const response = await api.get(`/products/${productId}/my-review`);
      return response.data.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // User hasn't reviewed this product
      }
      console.error('Error fetching user review:', error);
      throw error;
    }
  }
}

export const reviewService = new ReviewService();
export default reviewService;