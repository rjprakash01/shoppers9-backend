import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, Headphones, Sparkles, Gift, Heart, TrendingUp, Search, Grid } from 'lucide-react';
import type { Product } from '../services/products';
import { productService } from '../services/products';
import { formatPrice, formatPriceRange, calculateDiscountPercentage } from '../utils/currency';
import { getImageUrl } from '../utils/imageUtils';
import BannerCarousel from '../components/BannerCarousel';
import LazyImage from '../components/LazyImage';
import { bannerService, type Banner } from '../services/banners';
import api from '../services/api';

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

  const [, setFilterData] = useState<FilterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    loadFeaturedProducts();
    loadTrendingProducts();
    fetchCategories();
    
    // Fetch category banners (use cache if available)
    fetchCategoryBanners(false);

    fetchFilterData();

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
    <div className="min-h-screen bg-gradient-to-b from-brand-white to-brand-slate/10">
      {/* Banner Carousel */}
      <section className="w-full relative">
        <div className="h-48 sm:h-64 md:h-80 lg:h-96 xl:h-[500px]">
          <BannerCarousel className="w-full h-full" />
        </div>

      </section>

      {/* Category Banners - Mobile Optimized */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-br from-brand-indigo to-brand-indigo/90">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-playfair text-brand-gold mb-3 sm:mb-4 md:mb-6 leading-tight">
              Shop by Category
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-brand-slate font-poppins max-w-2xl mx-auto px-4">Find amazing products across all categories</p>
          </div>
          
          {categoriesLoading ? (
            <div className="flex justify-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-4 border-purple-200"></div>
                <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-4 border-purple-600 border-t-transparent absolute top-0 left-0"></div>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop: Single row layout */}
              <div className="hidden lg:grid lg:grid-cols-4 gap-6">
              {categories.map((category) => {
                const banner = getBannerForCategory(category);
                return (
                  <Link
                     key={category.id}
                     to={`/categories/${category.slug}`}
                     className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-brand-gold/20 to-brand-gold/10 border border-brand-gold/30 hover:border-brand-gold/50"
                   >
                    <div className="relative h-52 flex flex-col justify-end p-4 text-white overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600">
                      {/* Overlay for better text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                      
                      {/* Background Image - prioritize banner image over category image */}
                      <LazyImage 
                        key={`category-${category.id}-image`}
                        src={getImageUrl(banner?.image || category.image || '/placeholder-image.svg')} 
                        alt={banner?.title || category.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      
                      {/* Enhanced Content */}
                      <div className="relative z-20">
                        <h3 className="text-lg font-bold font-playfair mb-2 text-brand-gold drop-shadow-lg leading-tight">
                          {banner?.title || category.name}
                        </h3>
                        <p className="text-brand-slate mb-3 drop-shadow-md text-xs font-poppins leading-relaxed line-clamp-2">
                          {banner?.description || category.description || `Shop amazing ${category.name.toLowerCase()} products`}
                        </p>
                         <button className="inline-flex items-center justify-center bg-brand-gold text-brand-indigo px-4 py-2 rounded-lg font-bold font-poppins hover:bg-white hover:text-brand-indigo border border-brand-gold hover:border-white transition-all duration-300 shadow-lg hover:shadow-xl text-xs uppercase tracking-wide transform hover:scale-105">
                           {banner?.buttonText || 'Shop Now'}
                         </button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {/* Mobile: Horizontal scroll layout */}
            <div className="lg:hidden overflow-x-auto scrollbar-hide">
              <div className="flex space-x-4 pb-4" style={{width: 'max-content'}}>
                {categories.map((category) => {
                  const banner = getBannerForCategory(category);
                  return (
                    <Link
                       key={category.id}
                       to={`/categories/${category.slug}`}
                       className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-brand-gold/20 to-brand-gold/10 border border-brand-gold/30 hover:border-brand-gold/50 flex-shrink-0"
                       style={{width: '280px'}}
                     >
                      <div className="relative h-52 flex flex-col justify-end p-4 text-white overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600">
                      {/* Overlay for better text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                      
                      {/* Background Image - prioritize banner image over category image */}
                      <LazyImage 
                        key={`category-${category.id}-image`}
                        src={getImageUrl(banner?.image || category.image || '/placeholder-image.svg')} 
                        alt={banner?.title || category.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      
                      {/* Enhanced Content */}
                      <div className="relative z-20">
                        <h3 className="text-lg font-bold font-playfair mb-2 text-brand-gold drop-shadow-lg leading-tight">
                          {banner?.title || category.name}
                        </h3>
                        <p className="text-brand-slate mb-3 drop-shadow-md text-xs font-poppins leading-relaxed line-clamp-2">
                          {banner?.description || category.description || `Shop amazing ${category.name.toLowerCase()} products`}
                        </p>
                         <button className="inline-flex items-center justify-center bg-brand-gold text-brand-indigo px-4 py-2 rounded-lg font-bold font-poppins hover:bg-white hover:text-brand-indigo border border-brand-gold hover:border-white transition-all duration-300 shadow-lg hover:shadow-xl text-xs uppercase tracking-wide transform hover:scale-105">
                           {banner?.buttonText || 'Shop Now'}
                         </button>
                      </div>
                    </div>
                  </Link>
                );
              })}
              </div>
            </div>
            </>
          )}
        </div>
      </section>

      {/* Trending Products Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-b from-brand-white to-brand-slate/5">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="mb-8 sm:mb-10 md:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-playfair text-brand-indigo mb-2 sm:mb-3 leading-tight">
                  Trending Now
                </h2>
                <p className="text-brand-indigo/70 text-base sm:text-lg md:text-xl font-poppins">Popular products everyone loves</p>
              </div>
              <Link
                to="/products"
                className="inline-flex items-center justify-center text-brand-indigo hover:text-brand-gold text-sm sm:text-base md:text-lg font-bold font-poppins group bg-brand-gold/10 hover:bg-brand-gold/20 border border-brand-gold/30 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg uppercase tracking-wide"
              >
                View All Products
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {trendingLoading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 md:h-20 md:w-20 border-4 border-purple-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 md:h-20 md:w-20 border-4 border-purple-600 border-t-transparent absolute top-0 left-0"></div>
                </div>
                <p className="text-gray-500 text-sm animate-pulse">Loading trending products...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
              {(trendingProducts || []).slice(0, 10).map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="group bg-white rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-brand-gold/20 hover:border-brand-gold"
                >
                  <div className="relative overflow-hidden">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 aspect-[4/5] flex items-center justify-center relative">
                      {product.images && product.images.length > 0 ? (
                        <LazyImage
                          src={getImageUrl(product.images[0])}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs md:text-sm">No Image</span>
                      )}
                      {(() => {
                        const discountPercentage = getMaxDiscountPercentage(product);
                        return discountPercentage > 0 ? (
                          <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                            <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl shadow-lg">
                              {discountPercentage}% OFF
                            </span>
                          </div>
                        ) : null;
                      })()}
                      {/* Quick view overlay for desktop */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center">
                        <span className="bg-white text-gray-900 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          Quick View
                        </span>
                      </div>
                    </div>
                    <button className="absolute top-2 sm:top-3 right-2 sm:right-3 p-2 sm:p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white">
                      <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                  <div className="p-3 sm:p-4 md:p-5">
                    <h3 className="font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 text-gray-900 line-clamp-2 leading-tight group-hover:text-purple-600 transition-colors">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div className="flex flex-col flex-1 min-w-0">
                        <div key={`price-single-${product._id}`} className="flex items-center gap-2 mb-2">
                          <span className="text-sm sm:text-base md:text-xl font-bold font-poppins text-brand-indigo">
                            {formatPrice(product.price || 0)}
                          </span>
                          {product.originalPrice && product.originalPrice > (product.price || 0) && (
                            <>
                              <span className="text-xs sm:text-sm text-brand-indigo/50 line-through font-poppins">
                                {formatPrice(product.originalPrice)}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-brand-indigo bg-brand-gold/20 px-2 py-1 rounded-full font-poppins">
                                {Math.round(((product.originalPrice - (product.price || 0)) / product.originalPrice) * 100)}% off
                              </span>
                            </>
                          )}
                        </div>
                        
                        {/* Star rating */}
                        <div className="flex items-center">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                  i < 4 ? 'text-brand-gold fill-current' : 'text-brand-slate/30'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs sm:text-sm text-brand-indigo/70 ml-2 font-poppins">(4.0)</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-8 sm:mt-10 md:mt-12">
            <Link
              to="/products"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 rounded-2xl sm:rounded-3xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-bold text-base sm:text-lg md:text-xl shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95"
            >
              <Grid className="h-5 w-5 sm:h-6 sm:w-6" />
              View All Products
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Collections Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-b from-brand-indigo to-brand-indigo/95">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-playfair text-brand-gold mb-3 sm:mb-4 md:mb-6 leading-tight">
              Featured Products
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-brand-slate font-poppins max-w-2xl mx-auto px-4">Our best picks just for you</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 md:h-20 md:w-20 border-4 border-purple-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 md:h-20 md:w-20 border-4 border-purple-600 border-t-transparent absolute top-0 left-0"></div>
                </div>
                <p className="text-gray-500 text-sm animate-pulse">Loading featured collections...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              {(featuredProducts || []).map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="group bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-brand-gold/30 hover:border-brand-gold"
                >
                  <div className="relative overflow-hidden">
                    <div className="bg-brand-gold/5 aspect-[4/5] flex items-center justify-center relative">
                      {product.images && product.images.length > 0 ? (
                        <LazyImage
                          src={getImageUrl(product.images[0])}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-brand-slate text-sm font-poppins">No Image</span>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className="bg-brand-gold text-brand-indigo text-xs font-bold font-poppins px-2 py-1 rounded-full uppercase tracking-wide">
                          FEATURED
                        </span>
                      </div>
                    </div>
                    <button className="absolute top-2 right-2 p-2 bg-brand-gold/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-brand-gold">
                      <Heart className="h-4 w-4 text-brand-indigo hover:text-white transition-colors" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold font-poppins text-sm mb-2 text-white line-clamp-2 leading-tight group-hover:text-brand-gold transition-colors">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col">
                        <div key={`price-single-${product._id}`} className="flex items-center gap-2">
                          <span className="text-lg font-bold font-poppins text-brand-gold">
                            {formatPrice(product.price || 0)}
                          </span>
                          {product.originalPrice && product.originalPrice > (product.price || 0) && (
                            <>
                              <span className="text-sm text-brand-slate line-through font-poppins">
                                {formatPrice(product.originalPrice)}
                              </span>
                              <span className="text-xs bg-brand-gold/20 text-brand-gold px-1 py-0.5 rounded text-xs font-medium font-poppins">
                                {Math.round(((product.originalPrice - (product.price || 0)) / product.originalPrice) * 100)}% OFF
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center bg-brand-gold/20 px-2 py-1 rounded-full">
                        <Star className="h-3 w-3 text-brand-gold fill-current" />
                        <span className="text-xs text-brand-gold ml-1 font-medium font-poppins">4.5</span>
                      </div>
                    </div>

                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gradient-to-br from-brand-white to-brand-slate/10">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-playfair text-brand-indigo mb-4">
              💬 Customer Reviews
            </h2>
            <p className="text-lg text-brand-indigo/70 font-poppins max-w-2xl mx-auto">
              See what our happy customers have to say
            </p>
          </div>
          
          {/* Desktop Grid Layout */}
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-brand-gold/20 hover:border-brand-gold">
              <div className="flex items-center mb-4">
                <div className="flex text-brand-gold">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-brand-indigo/80 mb-4 italic font-poppins leading-relaxed">
                "Great quality products and amazing service. Shopping here is always a wonderful experience. Highly recommend!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-brand-indigo to-brand-gold rounded-full flex items-center justify-center text-white font-bold font-playfair">
                  S
                </div>
                <div className="ml-3">
                  <p className="font-semibold font-poppins text-brand-indigo">Sarah Johnson</p>
                  <p className="text-sm text-brand-indigo/60 font-poppins">Happy Customer</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-brand-gold/20 hover:border-brand-gold">
              <div className="flex items-center mb-4">
                <div className="flex text-brand-gold">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-brand-indigo/80 mb-4 italic font-poppins leading-relaxed">
                "Love shopping at Shoppers9! Great selection and friendly service. Every order arrives quickly and exactly as expected."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-brand-gold to-brand-indigo rounded-full flex items-center justify-center text-white font-bold font-playfair">
                  M
                </div>
                <div className="ml-3">
                  <p className="font-semibold font-poppins text-brand-indigo">Mike Davis</p>
                  <p className="text-sm text-gray-500">Hulhumalé, Maldives</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Love the variety of products and competitive prices. Free delivery across all islands is a game changer!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">Mariyam Hassan</p>
                  <p className="text-sm text-gray-500">Addu City, Maldives</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Slider Layout */}
          <div className="md:hidden">
            <div className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-4 pb-4" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              {/* Testimonial 1 */}
              <div className="flex-none w-80 bg-white rounded-2xl p-6 shadow-lg snap-center">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-4 italic text-sm leading-relaxed">
                  "Amazing quality products and super fast delivery! I ordered a dress and it arrived the next day. Highly recommended!"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">Aisha Mohamed</p>
                    <p className="text-sm text-gray-500">Malé, Maldives</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="flex-none w-80 bg-white rounded-2xl p-6 shadow-lg snap-center">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-4 italic text-sm leading-relaxed">
                  "Best online shopping experience in Maldives! Great customer service and the trending products section helped me find exactly what I wanted."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold">
                    I
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">Ibrahim Ali</p>
                    <p className="text-sm text-gray-500">Hulhumalé, Maldives</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="flex-none w-80 bg-white rounded-2xl p-6 shadow-lg snap-center">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-4 italic text-sm leading-relaxed">
                  "Love the variety of products and competitive prices. Free delivery across all islands is a game changer!"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">Mariyam Hassan</p>
                    <p className="text-sm text-gray-500">Addu City, Maldives</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Slider Dots Indicator */}
            <div className="flex justify-center mt-6 space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            </div>
            
            {/* Swipe Hint */}
            <p className="text-center text-sm text-gray-500 mt-4">
              👈 Swipe to see more reviews
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;