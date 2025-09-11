import api from './api';
import type { Product } from './products';

export interface CartItem {
  _id?: string;
  product: string;
  productId?: string; // Keep for backward compatibility during transition
  variantId: string;
  size: string;
  quantity: number;
  price: number;
  originalPrice: number;
  discount: number;
  isSelected: boolean;
  productData?: Product;
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
    const cart = response.data.data.cart;
    
    // Map populated product data to productData field
    if (cart && cart.items) {
      cart.items = cart.items.map((item: any) => ({
        ...item,
        productData: item.product, // Map the populated product to productData
        product: typeof item.product === 'object' && item.product ? item.product._id : item.product
      }));
    }
    
    return cart;
  }

  async addToCart(productId: string, variantId: string, size: string, quantity: number = 1): Promise<Cart> {
    const payload = {
      product: productId,
      variantId,
      size,
      quantity
    };
    
    const response = await api.post('/cart/add', payload);
    const cart = response.data.data.cart;
    
    // Map populated product data to productData field
    if (cart && cart.items) {
      cart.items = cart.items.map((item: any) => ({
        ...item,
        productData: item.product, // Map the populated product to productData
        product: typeof item.product === 'object' && item.product ? item.product._id : item.product
      }));
    }
    
    return cart;
  }

  async updateCartItem(itemId: string, _variantId: string, _size: string, quantity: number): Promise<Cart> {
    const response = await api.put(`/cart/item/${itemId}/quantity`, { quantity });
    const cart = response.data.data.cart;
    
    // Map populated product data to productData field
    if (cart && cart.items) {
      cart.items = cart.items.map((item: any) => ({
        ...item,
        productData: item.product, // Map the populated product to productData
        product: typeof item.product === 'object' && item.product ? item.product._id : item.product
      }));
    }
    
    return cart;
  }

  async removeFromCart(itemId: string): Promise<Cart> {
    const response = await api.delete(`/cart/item/${itemId}`);
    const cart = response.data.data.cart;

    // Map populated product data to productData field
    if (cart && cart.items) {
      cart.items = cart.items.map((item: any) => ({
        ...item,
        productData: item.product, // Map the populated product to productData
        product: typeof item.product === 'object' && item.product ? item.product._id : item.product
      }));
    }
    
    return cart;
  }

  async clearCart(): Promise<void> {
    await api.delete('/cart/clear');
  }

  async applyCoupon(couponCode: string): Promise<{ cart: Cart; discount: number }> {
    const response = await api.post('/cart/coupon/apply', { couponCode });
    return response.data.data;
  }

  async removeCoupon(): Promise<Cart> {
    const response = await api.delete('/cart/coupon/remove');
    return response.data.data.cart;
  }

  async getCartSummary(): Promise<{ cart: Cart; summary: any }> {
    const response = await api.get('/cart/summary');
    return response.data.data;
  }

  // Local cart management for non-authenticated users
  private getLocalCart(): CartItem[] {
    try {
      const cartStr = localStorage.getItem('localCart');
      if (!cartStr) return [];
      
      const cart = JSON.parse(cartStr);
      // Filter out any null or invalid items
      return Array.isArray(cart) ? cart.filter(item => 
        item && 
        typeof item === 'object' && 
        (item.product || item.productId) &&
        item.variantId &&
        item.size &&
        typeof item.quantity === 'number'
      ) : [];
    } catch (error) {
      
      // Clear corrupted cart data
      localStorage.removeItem('localCart');
      return [];
    }
  }

  private setLocalCart(items: CartItem[]): void {
    localStorage.setItem('localCart', JSON.stringify(items));
  }

  addToLocalCart(product: Product, variantId: string, size: string, quantity: number = 1): CartItem[] {
    const cart = this.getLocalCart();
    const existingItem = cart.find(item => 
      (item.product || item.productId) === product._id && 
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
        product: product._id,
        productId: product._id, // Keep for backward compatibility
        variantId,
        size,
        quantity,
        price: sizeInfo.price,
        originalPrice: sizeInfo.originalPrice,
        discount: sizeInfo.discount,
        isSelected: true,
        productData: product,
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
    // Check if user is authenticated before attempting sync
    const token = localStorage.getItem('authToken');
    if (!token) {
      
      return null;
    }

    const localCart = this.getLocalCart();
    if (localCart.length === 0) return null;

    try {
      // Add each local cart item to server cart
      for (const item of localCart) {
        const productId = item.product || item.productId;
        if (productId && item.variantId && item.size) {
          await this.addToCart(productId, item.variantId, item.size, item.quantity);
        } else {
          
        }
      }

      // Clear local cart after sync
      this.clearLocalCart();

      // Return updated server cart
      return await this.getCart();
    } catch (error) {
      
      return null;
    }
  }
}

export const cartService = new CartService();
export default cartService;