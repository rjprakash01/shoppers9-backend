import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, Headphones, Sparkles, Gift, Heart, TrendingUp, Search, Grid, Tag } from 'lucide-react';
import type { Product } from '../services/products';
import { productService } from '../services/products';
import { formatPrice, formatPriceRange } from '../utils/currency';
import { getImageUrl } from '../utils/imageUtils';
import BannerCarousel from '../components/BannerCarousel';
import api from '../services/api';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

interface Brand {
  _id: string;
  name: string;
  count: number;
}

interface FilterData {
  priceRange: {
    minPrice: number;
    maxPrice: number;
  };
  brands: Brand[];
}

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [, setFilterData] = useState<FilterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');


  useEffect(() => {
    loadFeaturedProducts();
    loadTrendingProducts();
    fetchCategories();
    fetchBrands();
    fetchFilterData();
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

  const fetchBrands = async () => {
    try {
      const response = await api.get('/products/brands');
      if (response.data.success) {
        setBrands(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        setBrands([]);
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error);
      setBrands([]);
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
      // Fetch categories from API
      const response = await api.get('/products/categories');
      const data = response.data;
      if (data.success && data.data.categories) {
        setCategories(data.data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };



  const handleBrandFilter = (brandName: string) => {
    // Navigate to products page with brand filter
    window.location.href = `/products?brand=${brandName}`;
  };



  return (
    <div className="min-h-screen bg-white">
      {/* Banner Carousel */}
      <section className="w-full">
        <BannerCarousel className="w-full" />
      </section>


      {/* Category Banners - Meesho Style */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-gray-600 text-lg">Discover amazing deals across all categories</p>
          </div>
          
          {categoriesLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {categories.slice(0, 3).map((category) => (
                <Link
                   key={category._id}
                   to={`/categories/${category.slug}`}
                   className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                 >
                  <div className="relative h-64 md:h-80 flex flex-col justify-end p-6 md:p-8 text-white overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
                    {/* Overlay for better text readability */}
                    <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                    
                    {/* Background Image if available */}
                    {category.image && (
                      <img 
                        src={category.image} 
                        alt={category.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Content */}
                    <div className="relative z-20">
                      <h3 className="text-2xl md:text-3xl font-bold mb-2 text-white drop-shadow-lg">{category.name}</h3>
                      <p className="text-white/95 mb-4 drop-shadow-md">{category.description || `Discover amazing ${category.name.toLowerCase()} products`}</p>
                       <button className="bg-white text-gray-900 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-lg">
                         Shop Now
                       </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trending Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                🔥 Trending Now
              </h2>
              <p className="text-lg text-gray-600">Most popular products this week</p>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Link
                to="/products"
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Grid className="h-4 w-4" />
                View All
              </Link>
            </div>
          </div>

          {trendingLoading ? (
            <div className="flex justify-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-32 w-32 border-4 border-gray-200"></div>
                <div className="animate-spin rounded-full h-32 w-32 border-4 border-purple-600 border-t-transparent absolute top-0 left-0"></div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
              {(trendingProducts || []).map((product) => (
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
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          50% OFF
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
                           <span className="text-lg font-bold text-gray-900">
                             {formatPriceRange(product.minPrice, product.maxPrice)}
                           </span>
                         ) : (
                           <div className="flex items-center gap-2">
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

          <div className="text-center mt-12">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-10 py-4 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              View All Products
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
              <Sparkles className="h-8 w-8 text-yellow-500" />
              ✨ Featured Products
            </h2>
            <p className="text-lg text-gray-600">Handpicked bestsellers at unbeatable prices</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-32 w-32 border-4 border-gray-200"></div>
                <div className="animate-spin rounded-full h-32 w-32 border-4 border-purple-600 border-t-transparent absolute top-0 left-0"></div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
                           <span className="text-lg font-bold text-gray-900">
                             {formatPriceRange(product.minPrice, product.maxPrice)}
                           </span>
                         ) : (
                           <div className="flex items-center gap-2">
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

      {/* Brands Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
              <Tag className="h-8 w-8 text-blue-600" />
              🏷️ Shop by Brand
            </h2>
            <p className="text-lg text-gray-600">Discover your favorite brands</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(Array.isArray(brands) ? brands : []).slice(0, 12).map((brand) => (
              <button
                key={brand._id}
                onClick={() => handleBrandFilter(brand.name)}
                className="group p-6 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-lg transition-all duration-200 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center group-hover:from-purple-200 group-hover:to-pink-200 transition-colors">
                  <span className="text-2xl font-bold text-purple-600">
                    {brand.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{brand.name}</h3>
                <p className="text-sm text-gray-500">{brand.count} products</p>
              </button>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-600 hover:text-white transition-all duration-200"
            >
              View All Brands
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Shoppers9?</h2>
            <p className="text-lg text-gray-600">Experience the best online shopping</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-colors">
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Free Shipping</h3>
              <p className="text-gray-600">Free delivery on orders above ₹499</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center group-hover:from-green-200 group-hover:to-green-300 transition-colors">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Payment</h3>
              <p className="text-gray-600">100% secure and encrypted payments</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center group-hover:from-purple-200 group-hover:to-purple-300 transition-colors">
                <Headphones className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600">Round the clock customer support</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center group-hover:from-yellow-200 group-hover:to-yellow-300 transition-colors">
                <Gift className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Returns</h3>
              <p className="text-gray-600">Hassle-free returns within 30 days</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;