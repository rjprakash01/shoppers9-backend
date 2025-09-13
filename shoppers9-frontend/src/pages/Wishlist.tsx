import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { formatPrice, formatPriceRange } from '../utils/currency';
import type { WishlistItem } from '../services/wishlist';

const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { wishlist, isLoading, removeFromWishlist, clearWishlist } = useWishlist();

  useEffect(() => {
    if (!isAuthenticated) {
      setError(null);
    }
  }, [isAuthenticated]);

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove item from wishlist');
    }
  };

  const handleAddToCart = async (item: WishlistItem) => {
    try {
      if (!item.product || !item.product._id) {
        
        setError('Invalid product data');
        return;
      }
      
      const firstVariant = item.product.variants?.[0];
      
      if (firstVariant && firstVariant._id && firstVariant.size) {
        await addToCart(item.product, firstVariant._id, firstVariant.size, 1);
        // Optionally remove from wishlist after adding to cart
        await handleRemoveFromWishlist(item.product._id);
      } else {
        
        setError('Product variant or size not available');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add item to cart');
    }
  };

  const handleClearWishlist = async () => {
    try {
      await clearWishlist();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to clear wishlist');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-white to-brand-slate/5 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-16 w-16 text-brand-gold mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-playfair text-brand-indigo mb-2">Sign in to view your wishlist</h2>
          <p className="text-brand-indigo/70 font-poppins mb-6">Save your favorite items for later</p>
          <Link
            to="/login"
            className="bg-brand-gold text-brand-indigo px-6 py-3 rounded-xl font-semibold font-poppins hover:bg-white hover:text-brand-indigo border border-brand-gold transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-white to-brand-slate/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-gold border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-white to-brand-slate/5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-brand-indigo text-xl mb-4 font-poppins">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-brand-gold text-brand-indigo px-6 py-3 rounded-xl font-semibold font-poppins hover:bg-white hover:text-brand-indigo border border-brand-gold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const items = wishlist?.items || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-white to-brand-slate/5">
      {/* Desktop Header */}
      <div className="hidden lg:block py-8">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center text-brand-indigo/70 hover:text-brand-gold transition-colors font-poppins"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold font-playfair text-brand-indigo">My Wishlist</h1>
              <p className="text-brand-indigo/70 font-poppins mt-2">
                {items.length} {items.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
            {items.length > 0 && (
              <button
                onClick={handleClearWishlist}
                className="text-brand-indigo hover:text-brand-gold font-medium font-poppins transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-black shadow-sm">
        <div className="w-full px-4">
          <div className="flex items-center h-14">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-white hover:text-gray-300 transition-colors mr-3"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-white flex-1">
              My Wishlist
            </h1>
            {items.length > 0 && (
              <button
                onClick={handleClearWishlist}
                className="text-white hover:text-gray-300 font-medium transition-colors text-sm"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-0">

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-24 w-24 text-brand-gold mx-auto mb-6" />
            <h2 className="text-2xl font-bold font-playfair text-brand-indigo mb-4">Your wishlist is empty</h2>
            <p className="text-brand-indigo/70 font-poppins mb-8">Save items you love to buy them later</p>
            <Link
              to="/products"
              className="bg-brand-gold text-brand-indigo px-8 py-3 rounded-xl font-semibold font-poppins hover:bg-white hover:text-brand-indigo border border-brand-gold transition-colors inline-flex items-center"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => {
              const firstVariant = item.product.variants?.[0];
              const isOutOfStock = !firstVariant || firstVariant.stock === 0;
              
              return (
                <div key={item._id} className="bg-white rounded-2xl shadow-md overflow-hidden group hover:shadow-lg transition-shadow border border-brand-gold/20 hover:border-brand-gold">
                  <div className="relative">
                    <Link to={`/products/${item.product._id}`}>
                      <img
                        src={firstVariant?.images?.[0] || item.product.images?.[0] || '/placeholder-image.svg'}
                        alt={item.product.name}
                        className="w-full h-64 object-cover"
                      />
                    </Link>
                    
                    {/* Remove from wishlist button */}
                    <button
                      onClick={() => handleRemoveFromWishlist(item.product._id)}
                      className="absolute top-3 right-3 p-2 bg-elite-base-white/90 shadow-card"
                    >
                      <Heart className="h-5 w-5 text-red-500 fill-current" />
                    </button>
                    
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-brand-indigo/80 flex items-center justify-center">
                        <span className="bg-brand-gold/90 text-brand-indigo px-3 py-1 rounded-full text-sm font-medium font-poppins">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <Link to={`/products/${item.product._id}`}>
                      <h3 className="font-semibold font-poppins text-brand-indigo mb-2 hover:text-brand-gold transition-colors line-clamp-2">
                        {item.product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-lg font-bold font-poppins text-brand-indigo">
                        {item.product.minPrice !== item.product.maxPrice ? (
                          formatPriceRange(item.product.minPrice || 0, item.product.maxPrice || 0)
                        ) : (
                          formatPrice(firstVariant?.price || item.product.minPrice || 0)
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={isOutOfStock}
                        className="flex-1 bg-brand-gold text-brand-indigo py-2 px-4 font-medium font-poppins border border-brand-gold disabled:bg-brand-slate/30 disabled:text-brand-indigo/50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                      
                      <button
                        onClick={() => handleRemoveFromWishlist(item.product._id)}
                        className="p-2 border border-brand-gold/30"
                      >
                        <Trash2 className="h-4 w-4 text-brand-indigo" />
                      </button>
                    </div>
                    
                    <div className="text-xs text-brand-indigo/70 font-poppins mt-2">
                      Added {new Date(item.addedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;