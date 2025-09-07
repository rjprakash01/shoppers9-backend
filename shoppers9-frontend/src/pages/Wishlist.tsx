import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { formatPrice, formatPriceRange } from '../utils/currency';
import type { WishlistItem } from '../services/wishlist';

const WishlistPage: React.FC = () => {
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
        console.error('Cannot add to cart: invalid product data', { product: item.product?._id });
        setError('Invalid product data');
        return;
      }
      
      const firstVariant = item.product.variants?.[0];
      const firstSize = firstVariant?.sizes?.[0];
      
      if (firstVariant && firstVariant._id && firstSize) {
        await addToCart(item.product, firstVariant._id, firstSize.size, 1);
        // Optionally remove from wishlist after adding to cart
        await handleRemoveFromWishlist(item.product._id);
      } else {
        console.error('Cannot add to cart: missing variant or size data', { variantId: firstVariant?._id, size: firstSize?.size });
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view your wishlist</h2>
          <p className="text-gray-600 mb-6">Save your favorite items for later</p>
          <Link
            to="/login"
            className="bg-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const items = wishlist?.items || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600 mt-2">
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleClearWishlist}
              className="text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8">Save items you love to buy them later</p>
            <Link
              to="/products"
              className="bg-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors inline-flex items-center"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => {
              const firstVariant = item.product.variants?.[0];
              const firstSize = firstVariant?.sizes?.[0];
              const isOutOfStock = !firstSize || firstSize.stock === 0;
              
              return (
                <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <Link to={`/products/${item.product._id}`}>
                      <img
                        src={firstVariant?.images?.[0] || item.product.images?.[0] || '/placeholder-image.svg'}
                        alt={item.product.name}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                    
                    {/* Remove from wishlist button */}
                    <button
                      onClick={() => handleRemoveFromWishlist(item.product._id)}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                    >
                      <Heart className="h-5 w-5 text-red-500 fill-current" />
                    </button>
                    
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <Link to={`/products/${item.product._id}`}>
                      <h3 className="font-semibold text-gray-900 mb-2 hover:text-pink-600 transition-colors line-clamp-2">
                        {item.product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-lg font-bold text-gray-900">
                        {item.product.minPrice !== item.product.maxPrice ? (
                          formatPriceRange(item.product.minPrice || 0, item.product.maxPrice || 0)
                        ) : (
                          formatPrice(firstSize?.price || item.product.minPrice || 0)
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={isOutOfStock}
                        className="flex-1 bg-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                      
                      <button
                        onClick={() => handleRemoveFromWishlist(item.product._id)}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-2">
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