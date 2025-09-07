import api from './api';
import type { Product } from './products';

export interface WishlistItem {
  _id: string;
  product: Product;
  addedAt: string;
}

export interface Wishlist {
  _id: string;
  user: string;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}

class WishlistService {
  async getWishlist(): Promise<Wishlist> {
    const response = await api.get('/wishlist');
    return response.data.data.wishlist;
  }

  async addToWishlist(productId: string, _variantId?: string): Promise<Wishlist> {
    const requestBody: any = { product: productId };
    if (_variantId && _variantId !== 'default') {
      requestBody.variantId = _variantId;
    }
    const response = await api.post('/wishlist/add', requestBody);
    return response.data.data.wishlist;
  }

  async removeFromWishlist(productId: string): Promise<Wishlist> {
    const response = await api.delete(`/wishlist/${productId}`);
    return response.data.data.wishlist;
  }

  async clearWishlist(): Promise<{ message: string }> {
    const response = await api.delete('/wishlist/clear');
    return response.data;
  }

  async isInWishlist(productId: string): Promise<boolean> {
    try {
      const wishlist = await this.getWishlist();
      return wishlist.items.some(item => item.product._id === productId);
    } catch {
      return false;
    }
  }
}

export const wishlistService = new WishlistService();
export default wishlistService;