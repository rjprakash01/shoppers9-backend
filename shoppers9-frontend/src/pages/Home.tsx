import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, Headphones, Sparkles, Gift, Zap, Heart, ShoppingBag, TrendingUp, Tag, Percent, Clock, Users } from 'lucide-react';
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

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
    fetchCategories();
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

      {/* Featured Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">🔥 Trending Products</h2>
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
                      {product.variants.length > 0 && product.variants[0].images.length > 0 ? (
                        <img
                          src={getImageUrl(product.variants[0].images[0])}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
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
                        {product.minPrice && product.maxPrice ? (
                          product.minPrice === product.maxPrice ? (
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-gray-900">
                                {formatPrice(product.minPrice)}
                              </span>
                              <span className="text-sm text-gray-400 line-through">
                                {formatPrice(product.minPrice * 2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">
                              {formatPriceRange(product.minPrice, product.maxPrice)}
                            </span>
                          )
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">
                              {formatPrice(product.variants[0]?.sizes[0]?.price || 0)}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              {formatPrice((product.variants[0]?.sizes[0]?.price || 0) * 2)}
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



    </div>
  );
};

export default Home;