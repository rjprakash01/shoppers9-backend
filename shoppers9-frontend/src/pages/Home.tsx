import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, Headphones, Sparkles, Gift, Heart, TrendingUp, Search, Grid, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../services/products';
import { productService } from '../services/products';
import { formatPrice, formatPriceRange, calculateDiscountPercentage } from '../utils/currency';
import { getImageUrl } from '../utils/imageUtils';


import HeroWithCategories from '../components/HeroWithCategories';
import LazyImage from '../components/LazyImage';
import { bannerService, type Banner } from '../services/banners';
import { testimonialService, type Testimonial } from '../services/testimonials';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from '../components/LoginModal';
import api from '../services/api';
import shoppers9Logo from '../assets/shoppers9-logo.svg';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  level: number;
  isActive: boolean;
}

interface FilterData {
  priceRange: {
    minPrice: number;
    maxPrice: number;
  };
}

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryBanners, setCategoryBanners] = useState<Banner[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  const [, setFilterData] = useState<FilterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingWishlistProduct, setPendingWishlistProduct] = useState<Product | null>(null);

  // Ref for trending products container
  const trendingContainerRef = useRef<HTMLDivElement>(null);

  // Scroll function for trending products
  const scrollTrending = (direction: 'left' | 'right') => {
    if (trendingContainerRef.current) {
      const scrollAmount = 300; // Adjust scroll distance as needed
      const currentScroll = trendingContainerRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      trendingContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  // Wishlist context
  const { addToWishlist, removeFromWishlist, isInWishlist, isLoading: wishlistLoading } = useWishlist();
  const { cartCount } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadFeaturedProducts();
    loadTrendingProducts();
    fetchCategories();
    
    // Fetch category banners (use cache if available)
    fetchCategoryBanners(false);

    fetchFilterData();
    fetchTestimonials();

    // Set up periodic refresh for category banners to detect admin changes (reduced frequency)
    const bannerRefreshInterval = setInterval(() => {
      fetchCategoryBanners(true); // Force refresh every 2 minutes to reduce server load
    }, 120000);

    // Cleanup interval on component unmount
    return () => clearInterval(bannerRefreshInterval);
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      const products = await productService.getFeaturedProducts(8);
      setFeaturedProducts(products || []);
    } catch (error) {
      
      setFeaturedProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingProducts = async () => {
    try {
      setTrendingLoading(true);
      // Use the dedicated trending products API
      const products = await productService.getTrendingProducts(12);
      setTrendingProducts(products || []);
    } catch (error) {
      
      setTrendingProducts([]);
    } finally {
      setTrendingLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      const response = await api.get('/products/filters');
      if (response.data.success) {
        setFilterData(response.data.data);
      }
    } catch (error) {
      
    }
  };

  const fetchTestimonials = async () => {
    try {
      const fetchedTestimonials = await testimonialService.getFeaturedTestimonials(6);
      setTestimonials(fetchedTestimonials);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      // Fetch categories from tree API to get proper hierarchy
      const response = await api.get('/categories/tree');
      const data = response.data;
      if (data.success && data.data.categories) {
        // Filter only level 1 categories for display
        const level1Categories = data.data.categories.filter((cat: Category) => cat.level === 1 && cat.isActive);
        setCategories(level1Categories);
      }
    } catch (error) {
      
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchCategoryBanners = async (forceRefresh = false) => {
    try {
      // Clear cache and get fresh banners
      if (forceRefresh) {
        bannerService.clearCache();
      }
      
      // Get all banners and filter for category-card type
      const allBanners = await bannerService.getActiveBanners(forceRefresh);
      const categoryCardBanners = allBanners.filter(banner => 
        banner.displayType === 'category-card' || banner.displayType === 'both'
      );
      
      // Sort category banners by order field
      const sortedCategoryBanners = categoryCardBanners.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      setCategoryBanners(sortedCategoryBanners);
    } catch (error) {
      
      setCategoryBanners([]);
    }
  };

  // Helper function to calculate maximum discount percentage from product variants
  const getMaxDiscountPercentage = (product: Product): number => {
    let maxDiscount = 0;
    
    product.variants?.forEach(variant => {
      if (variant.originalPrice && variant.price) {
        const discount = calculateDiscountPercentage(variant.originalPrice, variant.price);
        maxDiscount = Math.max(maxDiscount, discount);
      }
    });
    
    return maxDiscount;
  };

  const handleToggleWishlist = async (product: Product, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!product || !product._id) {
      return;
    }

    // If user is not authenticated, show login modal
    if (!isAuthenticated) {
      setPendingWishlistProduct(product);
      setShowLoginModal(true);
      return;
    }

    try {
      const isCurrentlyInWishlist = isInWishlist(product._id);

      if (isCurrentlyInWishlist) {
        await removeFromWishlist(product._id);
      } else {
        await addToWishlist(product);
      }
    } catch (error) {
      // For other errors, just log them - don't crash the UI
      console.error('Error toggling wishlist:', error);
    }
  };

  const handleLoginSuccess = async () => {
    setShowLoginModal(false);
    // If there's a pending wishlist product, add it after successful login
    if (pendingWishlistProduct) {
      try {
        await addToWishlist(pendingWishlistProduct);
      } catch (error) {
        console.error('Error adding to wishlist after login:', error);
      } finally {
        setPendingWishlistProduct(null);
      }
    }
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
    setPendingWishlistProduct(null);
  };

  // Helper function to get the minimum original price from product variants
  const getMinOriginalPrice = (product: Product): number => {
    let minOriginalPrice = Infinity;
    
    product.variants?.forEach(variant => {
      if (variant.originalPrice && variant.originalPrice > 0) {
        minOriginalPrice = Math.min(minOriginalPrice, variant.originalPrice);
      }
    });
    
    return minOriginalPrice === Infinity ? 0 : minOriginalPrice;
  };

  // Helper function to get the maximum original price from product variants
  const getMaxOriginalPrice = (product: Product): number => {
    let maxOriginalPrice = 0;
    
    product.variants?.forEach(variant => {
      if (variant.originalPrice && variant.originalPrice > 0) {
        maxOriginalPrice = Math.max(maxOriginalPrice, variant.originalPrice);
      }
    });
    
    return maxOriginalPrice;
  };

  // Helper function to get banner for a category
  const getBannerForCategory = (category: Category): Banner | null => {
    // Only return a banner if there's a specific match by categoryId
    const specificBanner = categoryBanners.find(banner => 
      banner.categoryId === category.id
    );
    if (specificBanner) {
      return specificBanner;
    }

    // Try to find a banner that matches the category name as secondary option
    const nameBanner = categoryBanners.find(banner => 
      banner.title.toLowerCase().includes(category.name.toLowerCase()) ||
      category.name.toLowerCase().includes(banner.title.toLowerCase())
    );
    if (nameBanner) {
      return nameBanner;
    }

    // Return null if no specific match - don't use fallback to avoid banner duplication
    return null;
  };

  return (
    <div className="min-h-screen bg-elite-base-white">


      {/* Hero Banner Section - Main Website Banners */}
      <section className="section-white w-full" style={{ zIndex: 1 }}>
        <HeroWithCategories className="w-full" />
      </section>



      {/* Elite Trending Products Section */}
      <section className="py-6 lg:py-12" style={{
        backgroundColor: 'var(--base-white)'
      }}>
        <div className="w-full px-2 sm:px-4">
          <div className="flex items-center justify-between mb-6 lg:mb-8 px-12">
            <div className="mx-12 text-center lg:text-left w-full lg:w-auto">
              <h2 className="text-lg lg:text-2xl font-bold mb-2 whitespace-nowrap" style={{
                color: 'var(--charcoal-black)'
              }}>
                Trending Products
              </h2>
              <p className="text-sm lg:text-base whitespace-nowrap" style={{
                color: 'var(--medium-grey)'
              }}>
                Discover the latest fashion trends.
              </p>
            </div>
          </div>

          {trendingLoading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="animate-spin rounded-none h-16 w-16 md:h-20 md:w-20 border-4 border-elite-light-grey"></div>
                  <div className="animate-spin rounded-none h-16 w-16 md:h-20 md:w-20 border-4 border-elite-cta-purple border-t-transparent absolute top-0 left-0"></div>
                </div>
                <p className="font-inter text-elite-medium-grey text-sm animate-pulse">Loading trending products...</p>
              </div>
            </div>
          ) : (
            <div className="relative px-2 lg:px-12">
              {/* Left Navigation Button - Hidden on mobile */}
              <button 
                onClick={() => scrollTrending('left')}
                className="hidden lg:block absolute left-2 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-lg rounded-lg"
                aria-label="Previous products"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              
              {/* Right Navigation Button - Hidden on mobile */}
              <button 
                onClick={() => scrollTrending('right')}
                className="hidden lg:block absolute right-2 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-lg rounded-lg"
                aria-label="Next products"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
              
              <div 
                ref={trendingContainerRef}
                className="grid grid-cols-2 gap-2 lg:flex lg:gap-2 lg:overflow-x-auto lg:scrollbar-hide pb-4 mx-2 lg:mx-12 overflow-x-auto"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
              {(trendingProducts || []).slice(0, 12).map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="bg-white overflow-hidden group transition-all duration-300 hover:shadow-lg w-full lg:flex-shrink-0 lg:w-[160px]"
                  style={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <div className="relative overflow-hidden">
                    <div className="aspect-[3/4] flex items-center justify-center relative" style={{
                      backgroundColor: 'var(--light-grey)'
                    }}>
                      {product.images && product.images.length > 0 ? (
                        <LazyImage
                          src={getImageUrl(product.images[0])}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">No Image</span>
                      )}
                      {(() => {
                        const discountPercentage = getMaxDiscountPercentage(product);
                        return discountPercentage > 0 ? (
                          <div className="absolute top-2 left-2">
                            <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{
                              backgroundColor: 'var(--cta-dark-purple)'
                            }}>
                              {discountPercentage}% OFF
                            </span>
                          </div>
                        ) : null;
                      })()}

                    </div>
                    <button 
                      onClick={(e) => handleToggleWishlist(product, e)}
                      disabled={wishlistLoading}
                      className={`absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:shadow-lg disabled:opacity-50 ${
                        isInWishlist(product._id) ? 'opacity-100' : ''
                      }`}
                    >
                      <Heart className={`h-3 w-3 transition-colors ${
                        isInWishlist(product._id)
                          ? 'text-red-500 fill-current'
                          : 'text-gray-500 hover:text-red-500'
                      }`} />
                    </button>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm mb-2 text-gray-900 line-clamp-2 leading-tight transition-colors" style={{
                      color: 'var(--charcoal-black)'
                    }}>
                      {product.name}
                    </h3>
                    
                    {/* Star Rating */}
                    <div className="flex items-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="h-3 w-3 text-yellow-400 fill-current"
                        />
                      ))}
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold" style={{
                          color: 'var(--cta-dark-purple)'
                        }}>
                          {product.minPrice && product.maxPrice && product.minPrice !== product.maxPrice ? 
                            `From ${formatPrice(product.minPrice)}` : 
                            formatPrice(product.minPrice || 0)
                          }
                        </span>
                        {product.maxDiscount && product.maxDiscount > 0 && (
                          <span className="text-xs text-gray-500 line-through">
                            {product.minOriginalPrice && product.maxOriginalPrice && product.minOriginalPrice !== product.maxOriginalPrice ? 
                              `From ${formatPrice(product.minOriginalPrice)}` : 
                              formatPrice(product.minOriginalPrice || 0)
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          )}

          <div className="text-center mt-6 lg:mt-8 hidden">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg"
              style={{
                backgroundColor: 'var(--cta-dark-purple)',
                color: 'var(--base-white)'
              }}
            >
              <Grid className="h-4 w-4" />
              View All Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Elite Featured Products Section */}
      <section className="py-6 lg:py-12" style={{
        backgroundColor: 'var(--light-grey)'
      }}>
        <div className="w-full px-2 sm:px-4">
          <div className="text-center mb-6 lg:mb-8">
            <h2 className="text-lg lg:text-2xl font-bold mb-2" style={{
              color: 'var(--charcoal-black)'
            }}>
              Featured Collections
            </h2>
            <p className="text-sm lg:text-base" style={{
              color: 'var(--medium-grey)'
            }}>
              Handpicked products just for you
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="animate-spin rounded-none h-16 w-16 md:h-20 md:w-20 border-4 border-elite-light-grey"></div>
                  <div className="animate-spin rounded-none h-16 w-16 md:h-20 md:w-20 border-4 border-elite-cta-purple border-t-transparent absolute top-0 left-0"></div>
                </div>
                <p className="font-inter text-elite-medium-grey text-sm animate-pulse">Loading featured collections...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8 gap-1 lg:gap-2">
              {(featuredProducts || []).map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="bg-white rounded-xl overflow-hidden group transition-all duration-300 hover:shadow-lg"
                  style={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <div className="relative overflow-hidden">
                    <div className="aspect-[3/4] flex items-center justify-center relative" style={{
                      backgroundColor: 'var(--light-grey)'
                    }}>
                      {product.images && product.images.length > 0 ? (
                        <LazyImage
                          src={getImageUrl(product.images[0])}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">No Image</span>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{
                          backgroundColor: 'var(--gold-highlight)'
                        }}>
                          FEATURED
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleToggleWishlist(product, e)}
                      disabled={wishlistLoading}
                      className={`absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:shadow-lg disabled:opacity-50 ${
                        isInWishlist(product._id) ? 'opacity-100' : ''
                      }`}
                    >
                      <Heart className={`h-3 w-3 transition-colors ${
                        isInWishlist(product._id)
                          ? 'text-red-500 fill-current'
                          : 'text-gray-500 hover:text-red-500'
                      }`} />
                    </button>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm mb-2 text-gray-900 line-clamp-2 leading-tight transition-colors" style={{
                      color: 'var(--charcoal-black)'
                    }}>
                      {product.name}
                    </h3>
                    
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold" style={{
                          color: 'var(--cta-dark-purple)'
                        }}>
                          {product.minPrice && product.maxPrice && product.minPrice !== product.maxPrice ? 
                            `From ${formatPrice(product.minPrice)}` : 
                            formatPrice(product.minPrice || 0)
                          }
                        </span>
                        {product.maxDiscount && product.maxDiscount > 0 && (
                          <>
                            <span className="text-xs text-gray-500 line-through">
                              {product.minOriginalPrice && product.maxOriginalPrice && product.minOriginalPrice !== product.maxOriginalPrice ? 
                                `From ${formatPrice(product.minOriginalPrice)}` : 
                                formatPrice(product.minOriginalPrice || 0)
                              }
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Elite Customer Reviews Section */}
      <section className="py-6 lg:py-12" style={{
        backgroundColor: 'var(--base-white)'
      }}>
        <div className="w-full px-2 sm:px-4">
          <div className="text-center mb-6 lg:mb-8">
            <h2 className="text-lg lg:text-2xl font-bold mb-2" style={{
              color: 'var(--charcoal-black)'
            }}>
              Customer Reviews
            </h2>
            <p className="text-sm lg:text-base" style={{
              color: 'var(--medium-grey)'
            }}>
              See what our happy customers have to say
            </p>
          </div>
          
          {/* Mobile Carousel Layout */}
          <div className="flex justify-center">
            <div className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-4 pb-3 justify-center" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              {testimonials.length > 0 ? (
                testimonials.map((testimonial, index) => (
                  <div key={testimonial._id} className={`flex-none w-72 lg:w-80 ${index % 2 === 0 ? 'bg-white' : 'postcard-box'} rounded-xl p-4 lg:p-6 snap-center`} style={{
                    boxShadow: index % 2 === 0 ? '0 2px 8px rgba(0,0,0,0.1)' : undefined
                  }}>
                    <p className="font-inter text-elite-charcoal-black mb-3 italic text-xs lg:text-sm leading-relaxed">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-elite-cta-purple flex items-center justify-center text-elite-base-white font-bold font-playfair text-sm">
                        {testimonial.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-2">
                        <p className="font-playfair font-semibold text-sm text-elite-charcoal-black">{testimonial.customerName}</p>
                        <div className="flex text-elite-gold-highlight">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-current" />
                          ))}
                          {[...Array(5 - testimonial.rating)].map((_, i) => (
                            <Star key={`empty-${i}`} className="h-3 w-3 text-gray-300" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Empty state when no testimonials are available
                <div className="flex-none w-full flex justify-center py-8">
                  <p className="text-elite-medium-grey text-sm text-center">
                    No customer reviews available at the moment.
                  </p>
                </div>
              )}
            </div>
            

          </div>
        </div>
      </section>
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={handleCloseLoginModal}
        onLoginSuccess={handleLoginSuccess}
      />

    </div>
  );
};

export default Home;