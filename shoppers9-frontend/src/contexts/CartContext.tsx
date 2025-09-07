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
  addToCart: (product: Product | null, variantId: string, size: string, quantity?: number) => Promise<void>;
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

  // Load local cart on mount
  useEffect(() => {
    loadLocalCart();
  }, []);

  // Handle authentication changes
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated && user) {
        // User logged in - sync local cart with server
        syncCartOnLogin();
      } else {
        // User logged out - clear server cart
        setCart(null);
      }
    }
  }, [isAuthenticated, user, authLoading]);

  const loadLocalCart = () => {
    try {
      const savedCart = localStorage.getItem('localCart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setLocalCart(Array.isArray(parsedCart) ? parsedCart : []);
      }
    } catch (error) {
      console.error('Error loading local cart:', error);
      setLocalCart([]);
    }
  };

  const saveLocalCart = (items: CartItem[]) => {
    try {
      localStorage.setItem('localCart', JSON.stringify(items));
      setLocalCart(items);
    } catch (error) {
      console.error('Error saving local cart:', error);
    }
  };

  const syncCartOnLogin = async () => {
    try {
      setIsLoading(true);
      
      // If there are local cart items, sync them with server
      if (localCart.length > 0) {
        const syncedCart = await cartService.syncLocalCartWithServer();
        if (syncedCart) {
          setCart(syncedCart);
          // Clear local cart after successful sync
          saveLocalCart([]);
          return;
        }
      }
      
      // Load existing server cart
      const serverCart = await cartService.getCart();
      setCart(serverCart);
    } catch (error) {
      console.error('Error syncing cart on login:', error);
      // If sync fails, keep local cart
    } finally {
      setIsLoading(false);
    }
  };

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
    } catch {
      // Silently handle cart loading errors for unauthenticated users
      // This is expected behavior when users are not logged in
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (product: Product | null, variantId: string, size: string, quantity: number = 1) => {
    try {
      setIsLoading(true);
      
      // Validate input parameters
      if (!product) {
        throw new Error('Product is required to add to cart');
      }
      
      if (!product._id) {
        throw new Error('Product ID is required');
      }
      
      if (!variantId) {
        throw new Error('Variant ID is required');
      }
      
      if (!size) {
        throw new Error('Size is required');
      }
      
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      
      console.log('CartContext - addToCart called with:', { 
        productId: product._id, 
        variantId, 
        size, 
        quantity,
        isAuthenticated 
      });
      
      if (isAuthenticated) {
        // User is logged in - add to server cart
        const updatedCart = await cartService.addToCart(product._id, variantId, size, quantity);
        setCart(updatedCart);
      } else {
        // User is not logged in - add to local cart
        const updatedLocalCart = cartService.addToLocalCart(product, variantId, size, quantity);
        saveLocalCart(updatedLocalCart);
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
        // For server cart, we only need the item ID
        const updatedCart = await cartService.removeFromCart(itemIdOrProductId);
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
    ? (cart?.items.reduce((count, item) => count + (item?.quantity || 0), 0) || 0)
    : localCart.reduce((count, item) => count + (item?.quantity || 0), 0);

  const cartTotal = isAuthenticated 
    ? (cart?.totalAmount || 0)
    : localCart.reduce((total, item) => total + ((item?.price || 0) * (item?.quantity || 0)), 0);

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