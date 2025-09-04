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
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load local cart on mount and when authentication changes
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        const savedCart = localStorage.getItem('localCart');
        if (savedCart) {
          setLocalCart(JSON.parse(savedCart));
        }
      } else {
        // When user logs in, prepare to sync local cart
        const savedCart = localStorage.getItem('localCart');
        if (savedCart) {
          setLocalCart(JSON.parse(savedCart));
        }
      }
    }
  }, [isAuthenticated, authLoading]);

  // Load server cart when user is authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      loadServerCart();
    } else if (!authLoading && !isAuthenticated) {
      setCart(null);
    }
  }, [isAuthenticated, user, authLoading]);

  const loadServerCart = async () => {
    try {
      setIsLoading(true);
      
      // First, sync local cart with server if there are local items
      if (localCart.length > 0) {
        const syncedCart = await cartService.syncLocalCartWithServer();
        if (syncedCart) {
          setCart(syncedCart);
          setLocalCart([]);
          return;
        }
      }
      
      // Load server cart
      const serverCart = await cartService.getCart();
      setCart(serverCart);
    } catch (error) {
      // Silently handle cart loading errors for unauthenticated users
      // This is expected behavior when users are not logged in
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (product: Product, variantId: string, size: string, quantity: number = 1) => {
    try {
      setIsLoading(true);
      console.log('CartContext - addToCart called with:', { productId: product._id, variantId, size, quantity });
      
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

  const updateCartItem = async (itemIdOrProductId: string, variantId: string, size: string, quantity: number) => {
    try {
      setIsLoading(true);
      
      if (isAuthenticated) {
        // For server cart, we need the item ID
        const updatedCart = await cartService.updateCartItem(itemIdOrProductId, variantId, size, quantity);
        setCart(updatedCart);
      } else {
        const updatedLocalCart = cartService.updateLocalCartItem(itemIdOrProductId, variantId, size, quantity);
        setLocalCart(updatedLocalCart);
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemIdOrProductId: string, variantId?: string, size?: string) => {
    try {
      setIsLoading(true);
      
      if (isAuthenticated) {
        // For server cart, we need the item ID
        const updatedCart = await cartService.removeFromCart(itemIdOrProductId, variantId, size);
        setCart(updatedCart);
      } else {
        const updatedLocalCart = cartService.removeFromLocalCart(itemIdOrProductId, variantId, size);
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
      try {
        setIsLoading(true);
        console.log('Refreshing cart from server...');
        const serverCart = await cartService.getCart();
        console.log('Server cart received:', serverCart);
        console.log('Server cart items:', serverCart?.items);
        setCart(serverCart);
      } catch (error) {
        console.error('Failed to refresh cart:', error);
        setCart(null);
      } finally {
        setIsLoading(false);
      }
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