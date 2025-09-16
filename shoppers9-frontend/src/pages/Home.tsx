import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, Headphones, Sparkles, Gift, Heart, TrendingUp, Search, Grid, ShoppingCart } from 'lucide-react';
import type { Product } from '../services/products';
import { productService } from '../services/products';
import { formatPrice, formatPriceRange, calculateDiscountPercentage } from '../utils/currency';
import { getImageUrl } from '../utils/imageUtils';
import BannerCarousel from '../components/BannerCarousel';
import PriceRangeBanners from '../components/PriceRangeBanners';
import LazyImage from '../components/LazyImage';
import { bannerService, type Banner } from '../services/banners';
import { testimonialService, type Testimonial } from '../services/testimonials';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
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

    try {
      const isCurrentlyInWishlist = isInWishlist(product._id);

      if (isCurrentlyInWishlist) {
        await removeFromWishlist(product._id);
      } else {
        await addToWishlist(product);
      }
    } catch (error) {
      // For unauthenticated users trying to use server wishlist, redirect to login
      if (!isAuthenticated && (error as any)?.message?.includes('401')) {
        window.location.href = '/login';
      }
      // For other errors, just log them - don't crash the UI
    }
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


      {/* Elite Hero Banner Section - Admin Panel Content Only */}
      <section className="section-white w-full relative">
        <div className="h-48 sm:h-64 md:h-80 lg:h-96 xl:h-[500px] postcard-box">
          <BannerCarousel className="w-full h-full" />
        </div>
      </section>

      {/* Elite Price Range Section - Light Grey Background */}
      <section className="section-grey">
        <div className="elite-container">
          <PriceRangeBanners />
        </div>
      </section>

      {/* Elite Trending Products Section */}
      <section className="py-6 lg:py-12" style={{
        backgroundColor: 'var(--base-white)'
      }}>
        <div className="elite-container">
          <div className="text-center mb-6 lg:mb-8">
            <h2 className="text-lg lg:text-2xl font-bold mb-2" style={{
              color: 'var(--charcoal-black)'
            }}>
              Trending Now
            </h2>
            <p className="text-sm lg:text-base mb-4" style={{
              color: 'var(--medium-grey)'
            }}>
              Popular products everyone loves
            </p>
            <div className="w-12 h-1 rounded-full mx-auto" style={{
              backgroundColor: 'var(--cta-dark-purple)'
            }}></div>
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
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 lg:gap-4">
              {(trendingProducts || []).slice(0, 12).map((product) => (
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
          )}

          <div className="text-center mt-6 lg:mt-8">
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
        <div className="elite-container">
          <div className="text-center mb-6 lg:mb-8">
            <h2 className="text-lg lg:text-2xl font-bold mb-2" style={{
              color: 'var(--charcoal-black)'
            }}>
              Featured Collections
            </h2>
            <p className="text-sm lg:text-base mb-4" style={{
              color: 'var(--medium-grey)'
            }}>
              Handpicked products just for you
            </p>
            <div className="w-12 h-1 rounded-full mx-auto" style={{
              backgroundColor: 'var(--cta-dark-purple)'
            }}></div>
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
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
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
        <div className="elite-container">
          <div className="text-center mb-6 lg:mb-8">
            <h2 className="text-lg lg:text-2xl font-bold mb-2" style={{
              color: 'var(--charcoal-black)'
            }}>
              Customer Reviews
            </h2>
            <p className="text-sm lg:text-base mb-4" style={{
              color: 'var(--medium-grey)'
            }}>
              See what our happy customers have to say
            </p>
            <div className="w-12 h-1 rounded-full mx-auto" style={{
              backgroundColor: 'var(--cta-dark-purple)'
            }}></div>
          </div>
          
          {/* Mobile Carousel Layout */}
          <div>
            <div className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-4 pb-3" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              {testimonials.length > 0 ? (
                testimonials.map((testimonial, index) => (
                  <div key={testimonial._id} className={`flex-none w-72 lg:w-80 ${index % 2 === 0 ? 'bg-white' : 'postcard-box'} rounded-xl p-4 lg:p-6 snap-center`} style={{
                    boxShadow: index % 2 === 0 ? '0 2px 8px rgba(0,0,0,0.1)' : undefined
                  }}>
                    <div className="flex items-center mb-3">
                      <div className="flex text-elite-gold-highlight">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                        {[...Array(5 - testimonial.rating)].map((_, i) => (
                          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
                        ))}
                      </div>
                    </div>
                    <p className="font-inter text-elite-charcoal-black mb-3 italic text-xs lg:text-sm leading-relaxed">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-elite-cta-purple flex items-center justify-center text-elite-base-white font-bold font-playfair text-sm">
                        {testimonial.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-2">
                        <p className="font-playfair font-semibold text-sm text-elite-charcoal-black">{testimonial.customerName}</p>
                        <p className="text-xs text-elite-medium-grey">Verified Customer</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Fallback content when no testimonials are available
                <div className="flex-none w-72 lg:w-80 bg-white rounded-xl p-4 lg:p-6 snap-center" style={{
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div className="flex items-center mb-3">
                    <div className="flex text-elite-gold-highlight">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="font-inter text-elite-charcoal-black mb-3 italic text-xs lg:text-sm leading-relaxed">
                    "Great quality products and amazing service. Shopping here is always a wonderful experience!"
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-elite-cta-purple flex items-center justify-center text-elite-base-white font-bold font-playfair text-sm">
                      S
                    </div>
                    <div className="ml-2">
                      <p className="font-playfair font-semibold text-sm text-elite-charcoal-black">Shoppers9 Customer</p>
                      <p className="text-xs text-elite-medium-grey">Happy Customer</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Slider Dots Indicator */}
            {testimonials.length > 1 && (
              <div className="flex justify-center mt-4 space-x-1.5">
                {testimonials.map((_, index) => (
                  <div 
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full ${
                      index === 0 ? 'bg-elite-cta-purple' : 'bg-elite-medium-grey/30'
                    }`}
                  ></div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;