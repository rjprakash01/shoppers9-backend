import api from './api';
import type { Product } from './products';

export interface CartItem {
  _id?: string;
  productId: string;
  variantId: string;
  size: string;
  quantity: number;
  price: number;
  originalPrice: number;
  discount: number;
  isSelected: boolean;
  product?: Product;
  variant?: {
    color: string;
    colorCode?: string;
    images: string[];
  };
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

class CartService {
  async getCart(): Promise<Cart> {
    const response = await api.get('/cart');
    return response.data.cart;
  }

  async addToCart(productId: string, variantId: string, size: string, quantity: number = 1): Promise<Cart> {
    const response = await api.post('/cart/add', {
      productId,
      variantId,
      size,
      quantity
    });
    return response.data.cart;
  }

  async updateCartItem(itemId: string, quantity: number): Promise<Cart> {
    const response = await api.put(`/cart/items/${itemId}`, {
      quantity
    });
    return response.data.cart;
  }

  async removeFromCart(itemId: string): Promise<Cart> {
    const response = await api.delete(`/cart/items/${itemId}`);
    return response.data.cart;
  }

  async clearCart(): Promise<void> {
    await api.delete('/cart/clear');
  }

  // Local cart management for non-authenticated users
  private getLocalCart(): CartItem[] {
    const cartStr = localStorage.getItem('localCart');
    return cartStr ? JSON.parse(cartStr) : [];
  }

  private setLocalCart(items: CartItem[]): void {
    localStorage.setItem('localCart', JSON.stringify(items));
  }

  addToLocalCart(product: Product, variantId: string, size: string, quantity: number = 1): CartItem[] {
    const cart = this.getLocalCart();
    const existingItem = cart.find(item => 
      item.productId === product._id && 
      item.variantId === variantId && 
      item.size === size
    );

    // Find the specific variant and size to get pricing
    const variant = product.variants.find(v => v._id === variantId);
    const sizeInfo = variant?.sizes.find(s => s.size === size);
    
    if (!variant || !sizeInfo) {
      throw new Error('Invalid variant or size selected');
    }

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        _id: `local_${Date.now()}`,
        productId: product._id,
        variantId,
        size,
        quantity,
        price: sizeInfo.price,
        originalPrice: sizeInfo.originalPrice,
        discount: sizeInfo.discount,
        isSelected: true,
        product,
        variant: {
          color: variant.color,
          colorCode: variant.colorCode,
          images: variant.images
        }
      });
    }

    this.setLocalCart(cart);
    return cart;
  }

  updateLocalCartItem(productId: string, variantId: string, size: string, quantity: number): CartItem[] {
    const cart = this.getLocalCart();
    const item = cart.find(item => 
      item.productId === productId && 
      item.variantId === variantId && 
      item.size === size
    );
    
    if (item) {
      if (quantity <= 0) {
        return this.removeFromLocalCart(productId, variantId, size);
      }
      item.quantity = quantity;
    }

    this.setLocalCart(cart);
    return cart;
  }

  removeFromLocalCart(productId: string, variantId?: string, size?: string): CartItem[] {
    const cart = this.getLocalCart().filter(item => {
      if (variantId && size) {
        return !(item.productId === productId && item.variantId === variantId && item.size === size);
      }
      return item.productId !== productId;
    });
    this.setLocalCart(cart);
    return cart;
  }

  clearLocalCart(): void {
    localStorage.removeItem('localCart');
  }

  getLocalCartTotal(): number {
    const cart = this.getLocalCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getLocalCartCount(): number {
    const cart = this.getLocalCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
  }

  // Sync local cart with server cart when user logs in
  async syncLocalCartWithServer(): Promise<Cart | null> {
    const localCart = this.getLocalCart();
    if (localCart.length === 0) return null;

    try {
      // Add each local cart item to server cart
      for (const item of localCart) {
        await this.addToCart(item.productId, item.variantId, item.size, item.quantity);
      }

      // Clear local cart after sync
      this.clearLocalCart();

      // Return updated server cart
      return await this.getCart();
    } catch (error) {
      console.error('Failed to sync local cart with server:', error);
      return null;
    }
  }
}

export const cartService = new CartService();
export default cartService;