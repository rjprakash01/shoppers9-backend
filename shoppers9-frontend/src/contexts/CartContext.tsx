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
  moveToWishlist: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  isInCart: (productId: string, variantId: string, size: string) => boolean;
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
      
      setLocalCart([]);
    }
  };

  const saveLocalCart = (items: CartItem[]) => {
    try {
      localStorage.setItem('localCart', JSON.stringify(items));
      setLocalCart(items);
    } catch (error) {
      
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
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const moveToWishlist = async (itemId: string) => {
    try {
      setIsLoading(true);
      
      if (isAuthenticated) {
        // User is logged in - use server moveToWishlist
        const updatedCart = await cartService.moveToWishlist(itemId);
        setCart(updatedCart);
      } else {
        // For local cart, we need to find the item and handle it manually
        // This is a fallback for non-authenticated users
        throw new Error('Please log in to save items for later');
      }
    } catch (error) {
      console.error('Error moving item to wishlist:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCart = async () => {
    if (isAuthenticated) {
      try {
        setIsLoading(true);
        
        const serverCart = await cartService.getCart();

        setCart(serverCart);
      } catch (error) {
        
        setCart(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Check if a specific variant is in cart
  const isInCart = (productId: string, variantId: string, size: string): boolean => {
    if (isAuthenticated && cart) {
      return cart.items.some(item => 
        item.product === productId && 
        item.variantId === variantId && 
        item.size === size
      );
    } else {
      return localCart.some(item => 
        (item.product === productId || item.productId === productId) && 
        item.variantId === variantId && 
        item.size === size
      );
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
    moveToWishlist,
    clearCart,
    refreshCart,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};