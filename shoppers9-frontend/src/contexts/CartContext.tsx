import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Cart, CartItem } from '../services/cart';
import type { Product } from '../services/products';
import { cartService } from '../services/cart';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  localCart: CartItem[];
  cartCount: number;
  cartTotal: number;
  isLoading: boolean;
  addToCart: (product: Product, variantId: string, size: string, quantity?: number) => Promise<void>;
  updateCartItem: (productId: string, variantId: string, size: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string, variantId?: string, size?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load local cart on mount
  useEffect(() => {
    if (!isAuthenticated) {
      const savedCart = localStorage.getItem('localCart');
      if (savedCart) {
        setLocalCart(JSON.parse(savedCart));
      }
    }
  }, [isAuthenticated]);

  // Load server cart when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadServerCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated, user]);

  const loadServerCart = async () => {
    try {
      setIsLoading(true);
      const serverCart = await cartService.getCart();
      setCart(serverCart);
      
      // Sync local cart with server if there are local items
      if (localCart.length > 0) {
        await cartService.syncLocalCartWithServer();
        setLocalCart([]);
        // Reload cart after sync
        const updatedCart = await cartService.getCart();
        setCart(updatedCart);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (product: Product, variantId: string, size: string, quantity: number = 1) => {
    try {
      setIsLoading(true);
      
      if (isAuthenticated) {
        const updatedCart = await cartService.addToCart(product._id, variantId, size, quantity);
        setCart(updatedCart);
      } else {
        const updatedLocalCart = cartService.addToLocalCart(product, variantId, size, quantity);
        setLocalCart(updatedLocalCart);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartItem = async (productId: string, variantId: string, size: string, quantity: number) => {
    try {
      setIsLoading(true);
      
      if (isAuthenticated) {
        // For server cart, we need the item ID, not product ID
        // This would need to be updated based on how the backend handles updates
        const updatedCart = await cartService.updateCartItem(productId, quantity);
        setCart(updatedCart);
      } else {
        const updatedLocalCart = cartService.updateLocalCartItem(productId, variantId, size, quantity);
        setLocalCart(updatedLocalCart);
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (productId: string, variantId?: string, size?: string) => {
    try {
      setIsLoading(true);
      
      if (isAuthenticated) {
        // For server cart, we need the item ID, not product ID
        const updatedCart = await cartService.removeFromCart(productId);
        setCart(updatedCart);
      } else {
        const updatedLocalCart = cartService.removeFromLocalCart(productId, variantId, size);
        setLocalCart(updatedLocalCart);
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setIsLoading(true);
      
      if (isAuthenticated) {
        await cartService.clearCart();
        setCart(null);
      } else {
        cartService.clearLocalCart();
        setLocalCart([]);
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCart = async () => {
    if (isAuthenticated) {
      await loadServerCart();
    }
  };

  // Calculate cart metrics
  const cartCount = isAuthenticated 
    ? (cart?.items.reduce((count, item) => count + item.quantity, 0) || 0)
    : localCart.reduce((count, item) => count + item.quantity, 0);

  const cartTotal = isAuthenticated 
    ? (cart?.totalAmount || 0)
    : localCart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const value: CartContextType = {
    cart,
    localCart,
    cartCount,
    cartTotal,
    isLoading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};