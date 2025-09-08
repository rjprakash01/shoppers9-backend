import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, Headphones, Sparkles, Gift, Heart, TrendingUp, Search, Grid } from 'lucide-react';
import type { Product } from '../services/products';
import { productService } from '../services/products';
import { formatPrice, formatPriceRange } from '../utils/currency';
import { getImageUrl } from '../utils/imageUtils';
import BannerCarousel from '../components/BannerCarousel';
import { bannerService, type Banner } from '../services/banners';
import api from '../services/api';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
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
    fetchCategoryBanners();

    fetchFilterData();

    // Set up periodic refresh for category banners to detect admin changes
    const bannerRefreshInterval = setInterval(() => {
      fetchCategoryBanners(true); // Force refresh every 30 seconds
    }, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(bannerRefreshInterval);
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      const products = await productService.getFeaturedProducts(8);
      setFeaturedProducts(products || []);
    } catch (error) {
      console.error('Failed to load featured products:', error);
      setFeaturedProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingProducts = async () => {
    try {
      setTrendingLoading(true);
      // Use regular products API with trending sort
      const response = await productService.getProducts({
        page: 1,
        limit: 12,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setTrendingProducts(response.products || []);
    } catch (error) {
      console.error('Failed to load trending products:', error);
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
      console.error('Failed to fetch filter data:', error);
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
        const level1Categories = data.data.categories.filter(cat => cat.level === 1 && cat.isActive);
        setCategories(level1Categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchCategoryBanners = async (forceRefresh = false) => {
    try {
      // Get all banners and filter for category-card type
      const allBanners = await bannerService.getActiveBanners(forceRefresh);
      const categoryCardBanners = allBanners.filter(banner => 
        banner.displayType === 'category-card' || banner.displayType === 'both'
      );
      setCategoryBanners(categoryCardBanners);
      console.log('Category banners updated:', categoryCardBanners.length, 'banners found');
    } catch (error) {
      console.error('Failed to fetch category banners:', error);
      setCategoryBanners([]);
    }
  };

  // Helper function to get banner for a category
  const getBannerForCategory = (category: Category): Banner | null => {
    // First try to find a banner specifically for this category
    const specificBanner = categoryBanners.find(banner => 
      banner.categoryId === category._id
    );
    if (specificBanner) return specificBanner;

    // Then try to find a banner that matches the category name
    const nameBanner = categoryBanners.find(banner => 
      banner.title.toLowerCase().includes(category.name.toLowerCase()) ||
      category.name.toLowerCase().includes(banner.title.toLowerCase())
    );
    if (nameBanner) return nameBanner;

    // Return the first available banner as fallback
    return categoryBanners[0] || null;
  };







  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Banner Carousel */}
      <section className="w-full relative">
        <BannerCarousel className="w-full" />
        {/* Enhanced Mobile CTA overlay */}
        <div className="absolute bottom-2 left-2 right-2 md:bottom-4 md:left-4 md:right-4 lg:hidden">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 md:p-4 shadow-xl border border-white/20">
            <p className="text-xs md:text-sm font-semibold text-gray-900 mb-2 text-center">🔥 Trending in Andaman Islands</p>
            <Link to="/products" className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2.5 md:py-3 rounded-xl font-semibold text-sm md:text-base shadow-lg hover:shadow-xl transition-all duration-300 transform active:scale-95">
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Category Banners - Mobile Optimized */}
      <section className="py-6 md:py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-6 md:mb-8 lg:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 md:mb-3 lg:mb-4 leading-tight">
              Shop by Category
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 px-2">Discover amazing deals across all categories</p>
          </div>
          
          {categoriesLoading ? (
            <div className="flex justify-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-4 border-purple-200"></div>
                <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-4 border-purple-600 border-t-transparent absolute top-0 left-0"></div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
              {categories.map((category) => {
                const banner = getBannerForCategory(category);
                return (
                  <Link
                     key={category._id}
                     to={`/categories/${category.slug}`}
                     className="group relative overflow-hidden rounded-lg sm:rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01] md:hover:scale-[1.02] lg:hover:scale-105 bg-white active:scale-95"
                   >
                    <div className="relative h-40 sm:h-48 md:h-56 lg:h-64 xl:h-80 flex flex-col justify-end p-3 sm:p-4 md:p-6 lg:p-8 text-white overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
                      {/* Overlay for better text readability */}
                      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                      
                      {/* Background Image - prioritize banner image over category image */}
                      <img 
                        key={`category-${category._id}-image`}
                        src={getImageUrl(banner?.image || category.image || '/placeholder-image.svg')} 
                        alt={banner?.title || category.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-image.svg';
                        }}
                      />
                      
                      {/* Content */}
                      <div className="relative z-20">
                        <h3 className="text-2xl md:text-3xl font-bold mb-2 text-white drop-shadow-lg">
                          {banner?.title || category.name}
                        </h3>
                        <p className="text-white/95 mb-4 drop-shadow-md">
                          {banner?.description || category.description || `Discover amazing ${category.name.toLowerCase()} products`}
                        </p>
                         <button className="bg-white text-gray-900 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-lg">
                           {banner?.buttonText || 'Shop Now'}
                         </button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Trending Products Section */}
      <section className="py-6 md:py-12 lg:py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="mb-5 md:mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 md:mb-4 gap-2 sm:gap-4">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 leading-tight">🔥 Trending Now</h2>
                <p className="text-gray-600 text-xs sm:text-sm md:text-base">Most popular among Andaman shoppers</p>
              </div>
              <Link
                to="/products"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-xs sm:text-sm md:text-base font-medium group self-start sm:self-center bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-all duration-200"
              >
                View All Trending
                <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              {(trendingProducts || []).slice(0, 10).map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="group bg-white rounded-lg md:rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-purple-200 transform hover:scale-[1.01] md:hover:scale-[1.02] lg:hover:scale-105 active:scale-95"
                >
                  <div className="relative overflow-hidden">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 aspect-[3/4] flex items-center justify-center relative">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={getImageUrl(product.images[0])}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-image.svg';
                          }}
                        />
                      ) : (
                        <span className="text-gray-400 text-xs md:text-sm">No Image</span>
                      )}
                      <div className="absolute top-1.5 md:top-2 left-1.5 md:left-2">
                        <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full shadow-lg">
                          50% OFF
                        </span>
                      </div>
                      {/* Quick view overlay for desktop */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center">
                        <span className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-medium shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          Quick View
                        </span>
                      </div>
                    </div>
                    <button className="absolute top-1.5 md:top-2 right-1.5 md:right-2 p-1.5 md:p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110">
                      <Heart className="h-3 w-3 md:h-4 md:w-4 text-gray-600 hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                  <div className="p-2 sm:p-3 md:p-4">
                    <h3 className="font-semibold text-xs sm:text-sm md:text-base mb-1.5 sm:mb-2 text-gray-900 line-clamp-2 leading-tight group-hover:text-purple-600 transition-colors">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-start justify-between mb-1.5 sm:mb-2 md:mb-3">
                      <div className="flex flex-col flex-1 min-w-0">
                        {product.minPrice && product.maxPrice && product.minPrice !== product.maxPrice ? (
                           <span key={`price-range-${product._id}`} className="text-xs sm:text-sm md:text-lg font-bold text-gray-900 truncate">
                             {formatPriceRange(product.minPrice, product.maxPrice)}
                           </span>
                         ) : (
                           <div key={`price-single-${product._id}`} className="flex items-center gap-1 md:gap-2">
                             <span className="text-xs sm:text-sm md:text-lg font-bold text-gray-900">
                               {formatPrice(product.minPrice || 0)}
                             </span>
                             <span className="text-xs md:text-sm text-gray-400 line-through">
                               {formatPrice((product.minPrice || 0) * 2)}
                             </span>
                           </div>
                         )}
                      </div>
                      <div className="flex items-center bg-gradient-to-r from-green-100 to-emerald-100 px-1 sm:px-1.5 md:px-2 py-0.5 md:py-1 rounded-full ml-1 sm:ml-2 flex-shrink-0">
                        <Star className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 text-green-600 fill-current" />
                        <span className="text-xs text-green-700 ml-0.5 font-medium">4.5</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="text-green-600 font-medium">
                        ✓ Free Delivery
                      </div>
                      <div className="text-gray-500">
                        Island Wide
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-4 sm:mt-6 md:mt-8">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-sm sm:text-base"
            >
              <Grid className="h-3 w-3 sm:h-4 sm:w-4" />
              View All Products
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Collections Section */}
      <section className="py-6 md:py-12 lg:py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-6 md:mb-8 lg:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2 md:mb-3 lg:mb-4 leading-tight">
              ✨ Featured Collections
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 px-2">Curated selections for island lifestyle</p>
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
                  className="group bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200"
                >
                  <div className="relative overflow-hidden">
                    <div className="bg-gray-50 aspect-[3/4] flex items-center justify-center relative">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={getImageUrl(product.images[0])}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-image.svg';
                          }}
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">No Image</span>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          FEATURED
                        </span>
                      </div>
                    </div>
                    <button className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white">
                      <Heart className="h-4 w-4 text-gray-600 hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-2 text-gray-900 line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col">
                        {product.minPrice && product.maxPrice && product.minPrice !== product.maxPrice ? (
                           <span key={`price-range-${product._id}`} className="text-lg font-bold text-gray-900">
                             {formatPriceRange(product.minPrice, product.maxPrice)}
                           </span>
                         ) : (
                           <div key={`price-single-${product._id}`} className="flex items-center gap-2">
                             <span className="text-lg font-bold text-gray-900">
                               {formatPrice(product.minPrice || 0)}
                             </span>
                             <span className="text-sm text-gray-400 line-through">
                               {formatPrice((product.minPrice || 0) * 2)}
                             </span>
                           </div>
                         )}
                      </div>
                      <div className="flex items-center bg-green-100 px-2 py-1 rounded-full">
                        <Star className="h-3 w-3 text-green-600 fill-current" />
                        <span className="text-xs text-green-700 ml-1 font-medium">4.5</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-2">
                      Free Delivery
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>





    </div>
  );
};

export default Home;