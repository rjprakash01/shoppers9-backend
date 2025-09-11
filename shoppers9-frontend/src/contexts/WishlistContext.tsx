import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { wishlistService, type Wishlist, type WishlistItem } from '../services/wishlist';
import { useAuth } from './AuthContext';
import type { Product } from '../services/products';

interface LocalWishlistItem {
  product: Product;
  variantId?: string;
  addedAt: string;
}

interface WishlistContextType {
  wishlist: Wishlist | null;
  localWishlist: LocalWishlistItem[];
  wishlistCount: number;
  isLoading: boolean;
  addToWishlist: (product: Product | null, variantId?: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  syncWishlistOnLogin: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

interface WishlistProviderProps {
  children: ReactNode;
}

const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [localWishlist, setLocalWishlist] = useState<LocalWishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Load local wishlist from localStorage on mount
  useEffect(() => {
    loadLocalWishlist();
  }, []);

  // Load server wishlist when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadServerWishlist();
    } else if (!isAuthenticated) {
      setWishlist(null);
    }
  }, [isAuthenticated, user]);

  const loadLocalWishlist = () => {
    try {
      const stored = localStorage.getItem('localWishlist');
      if (stored) {
        const parsedWishlist = JSON.parse(stored);
        setLocalWishlist(Array.isArray(parsedWishlist) ? parsedWishlist : []);
      }
    } catch (error) {
      
      setLocalWishlist([]);
    }
  };

  const saveLocalWishlist = (items: LocalWishlistItem[]) => {
    try {
      localStorage.setItem('localWishlist', JSON.stringify(items));
      setLocalWishlist(items);
    } catch (error) {
      
    }
  };

  const loadServerWishlist = async () => {
    try {
      setIsLoading(true);
      
      // First, sync local wishlist with server if there are local items
      if (localWishlist.length > 0) {
        await syncWishlistOnLogin();
        return;
      }
      
      // Load server wishlist
      const serverWishlist = await wishlistService.getWishlist();
      setWishlist(serverWishlist);
    } catch (error) {
      
      setWishlist(null);
    } finally {
      setIsLoading(false);
    }
  };

  const syncWishlistOnLogin = async () => {
    try {
      setIsLoading(true);
      
      // Add all local wishlist items to server
      for (const localItem of localWishlist) {
        try {
          await wishlistService.addToWishlist(localItem.product._id, localItem.variantId);
        } catch (error) {
          // Item might already exist in server wishlist, continue with others
          
        }
      }
      
      // Load updated server wishlist
      const serverWishlist = await wishlistService.getWishlist();
      setWishlist(serverWishlist);
      
      // Clear local wishlist
      saveLocalWishlist([]);
    } catch (error) {
      
    } finally {
      setIsLoading(false);
    }
  };

  const addToWishlist = async (product: Product | null, variantId?: string) => {
    try {
      setIsLoading(true);
      
      // Validate input parameters
      if (!product) {
        
        throw new Error('Product is required to add to wishlist');
      }
      
      if (!product._id) {
        
        throw new Error('Product ID is required');
      }

      if (isAuthenticated) {
        // User is logged in - add to server wishlist
        
        const updatedWishlist = await wishlistService.addToWishlist(product._id, variantId);
        
        setWishlist(updatedWishlist);
      } else {
        // User is not logged in - add to local wishlist
        
        const existingIndex = localWishlist.findIndex(
          item => item.product._id === product._id && item.variantId === variantId
        );
        
        if (existingIndex === -1) {
          const newItem: LocalWishlistItem = {
            product,
            variantId,
            addedAt: new Date().toISOString()
          };
          const updatedLocalWishlist = [...localWishlist, newItem];
          
          saveLocalWishlist(updatedLocalWishlist);
        } else {
          
        }
      }
    } catch (error) {
      
      // Don't re-throw the error to prevent UI crashes
      // Just log it and let the UI handle the failure gracefully
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      setIsLoading(true);
      
      if (isAuthenticated) {
        // User is logged in - remove from server wishlist
        const updatedWishlist = await wishlistService.removeFromWishlist(productId);
        setWishlist(updatedWishlist);
      } else {
        // User is not logged in - remove from local wishlist
        const updatedLocalWishlist = localWishlist.filter(
          item => item.product._id !== productId
        );
        saveLocalWishlist(updatedLocalWishlist);
      }
    } catch (error) {
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearWishlist = async () => {
    try {
      setIsLoading(true);
      
      if (isAuthenticated) {
        // User is logged in - clear server wishlist
        await wishlistService.clearWishlist();
        setWishlist(prev => prev ? { ...prev, items: [] } : null);
      } else {
        // User is not logged in - clear local wishlist
        saveLocalWishlist([]);
      }
    } catch (error) {
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const isInWishlist = (productId: string): boolean => {
    if (isAuthenticated && wishlist) {
      return wishlist.items.some(item => item.product && item.product._id === productId);
    } else {
      return localWishlist.some(item => item.product && item.product._id === productId);
    }
  };

  const wishlistCount = isAuthenticated 
    ? (wishlist?.items.length || 0) 
    : localWishlist.length;

  const value: WishlistContextType = {
    wishlist,
    localWishlist,
    wishlistCount,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
    syncWishlistOnLogin
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export { WishlistProvider };
export default WishlistProvider;