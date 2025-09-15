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
  const { addToCart, cartCount } = useCart();
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
    <div className="min-h-screen" style={{backgroundColor: 'var(--light-grey)'}}>
      {/* Desktop Header */}
      <div className="hidden lg:block" style={{backgroundColor: 'var(--cta-dark-purple)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
        <div className="elite-container">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-white hover:bg-opacity-10 rounded"
                style={{color: 'var(--base-white)'}}
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="text-xl font-semibold" style={{fontFamily: 'Inter, sans-serif', color: 'var(--base-white)'}}>
                My Wishlist
              </h1>
            </div>
            <div className="flex items-center">
              <span className="text-sm px-3 py-1 rounded-full" style={{fontFamily: 'Inter, sans-serif', color: 'var(--cta-dark-purple)', backgroundColor: 'var(--base-white)'}}>
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
        </div>
      </div>



      {/* Mobile Wishlist Header - Clean */}
      <div className="lg:hidden p-4">
        <div className="bg-white" style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-bold" style={{
                fontFamily: 'Inter, sans-serif',
                color: '#1e293b',
                letterSpacing: '-0.025em'
              }}>My Wishlist</h1>
              
              {/* Mobile Cart Icon */}
              <Link to="/cart" className="relative p-2 rounded-lg transition-all duration-200" style={{
                backgroundColor: 'var(--cta-dark-purple)',
                color: 'white'
              }}>
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium" style={{
                    fontSize: '10px'
                  }}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
            
            <div className="space-y-1">
              <div className="w-full flex items-center space-x-2 px-2 py-1.5 text-left font-medium" style={{
                fontFamily: 'Inter, sans-serif',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                color: '#475569',
                border: '1px solid #e2e8f0'
              }}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.05) 100%)'
                }}>
                  <Heart className="h-3 w-3" style={{color: 'var(--cta-dark-purple)'}} />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-xs">Saved Items</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                    fontFamily: 'Inter, sans-serif',
                    color: 'var(--cta-dark-purple)',
                    backgroundColor: 'rgba(99,102,241,0.1)'
                  }}>
                    {items.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="elite-container py-3 lg:py-6">

        {items.length === 0 ? (
          <div className="postcard-box p-4 lg:p-6 text-center" style={{backgroundColor: 'var(--base-white)', boxShadow: 'var(--card-shadow)'}}>
            <Heart className="h-16 w-16 lg:h-20 lg:w-20 mx-auto mb-4" style={{color: 'var(--gold-highlight)'}} />
            <h2 className="text-lg lg:text-xl font-bold mb-2" style={{fontFamily: 'Playfair Display, serif', color: 'var(--charcoal-black)'}}>Your wishlist is empty</h2>
            <p className="text-sm lg:text-base mb-4" style={{fontFamily: 'Inter, sans-serif', color: 'var(--medium-grey)'}}>Save items you love to buy them later</p>
            <Link
              to="/products"
              className="px-4 py-2 font-semibold transition-colors inline-flex items-center text-sm"
              style={{
                fontFamily: 'Inter, sans-serif',
                backgroundColor: 'var(--cta-dark-purple)',
                color: 'var(--base-white)',
                border: '1px solid var(--cta-dark-purple)',
                borderRadius: '0px'
              }}
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
            {items.map((item) => {
              const firstVariant = item.product.variants?.[0];
              const isOutOfStock = !firstVariant || firstVariant.stock === 0;
              
              return (
                <div key={item._id} className="bg-white rounded-xl lg:rounded-lg overflow-hidden group transition-all duration-300 hover:shadow-lg" style={{boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
                  <div className="relative">
                    <Link to={`/products/${item.product._id}`}>
                      <img
                        src={firstVariant?.images?.[0] || item.product.images?.[0] || '/placeholder-image.svg'}
                        alt={item.product.name}
                        className="w-full h-40 lg:h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>
                    
                    {/* Remove from wishlist button */}
                    <button
                      onClick={() => handleRemoveFromWishlist(item.product._id)}
                      className="absolute top-2 right-2 p-1.5 lg:p-2 transition-all duration-200 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white hover:shadow-lg"
                    >
                      <Heart className="h-3 w-3 lg:h-4 lg:w-4 text-red-500 fill-current" />
                    </button>
                    
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="px-3 py-1 text-xs font-medium bg-red-500 text-white rounded-full">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 lg:p-4">
                    <Link to={`/products/${item.product._id}`}>
                      <h3 className="font-semibold mb-2 transition-colors line-clamp-2 text-sm lg:text-base text-gray-900 hover:text-purple-600">
                        {item.product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm lg:text-base font-bold text-purple-600">
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
                        className="flex-1 py-2 px-3 font-medium transition-all duration-200 flex items-center justify-center text-xs lg:text-sm rounded-lg"
                         style={{
                           backgroundColor: isOutOfStock ? '#f3f4f6' : 'var(--cta-dark-purple)',
                           color: isOutOfStock ? '#9ca3af' : 'var(--base-white)',
                           cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                         }}
                         onMouseEnter={(e) => {
                           if (!isOutOfStock) {
                             e.target.style.backgroundColor = '#4c1d95';
                           }
                         }}
                         onMouseLeave={(e) => {
                           if (!isOutOfStock) {
                             e.target.style.backgroundColor = 'var(--cta-dark-purple)';
                           }
                         }}
                      >
                        <ShoppingCart className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                        <span className="hidden lg:inline">{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                        <span className="lg:hidden">{isOutOfStock ? 'Out' : 'Add'}</span>
                      </button>
                      
                      <button
                        onClick={() => handleRemoveFromWishlist(item.product._id)}
                        className="p-2 transition-all duration-200 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 active:scale-95"
                      >
                        <Trash2 className="h-3 w-3 lg:h-4 lg:w-4 text-gray-600 hover:text-red-500" />
                      </button>
                    </div>
                    
                    <div className="text-xs mt-2 hidden lg:block text-gray-500">
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