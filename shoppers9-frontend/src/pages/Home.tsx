import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, Headphones, Sparkles, Gift, Zap, Heart, ShoppingBag, TrendingUp, Tag, Percent, Clock, Users } from 'lucide-react';
import type { Product } from '../services/products';
import { productService } from '../services/products';
import { formatPrice, formatPriceRange } from '../utils/currency';
import BannerCarousel from '../components/BannerCarousel';

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      const products = await productService.getFeaturedProducts(8);
      setFeaturedProducts(products);
    } catch (error) {
      console.error('Failed to load featured products:', error);
    } finally {
      setIsLoading(false);
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { 
                name: 'Men', 
                description: 'Stylish clothing and accessories for men',
                bgImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJtZW5HcmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzJkM2E4YztzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3R5bGU9InN0b3AtY29sb3I6IzM3NDBkYjtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM1YjIxYjY7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjbWVuR3JhZGllbnQpIi8+PGcgb3BhY2l0eT0iMC4xNSI+PHJlY3QgeD0iNjAwIiB5PSI1MCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxNTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMyIgcng9IjEwIi8+PHJlY3QgeD0iNjIwIiB5PSI3MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjE1IiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC4zIi8+PHJlY3QgeD0iMTAwIiB5PSI0MDAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI5MCIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMiIgcng9IjUiLz48Y2lyY2xlIGN4PSIyNjAiIGN5PSIzMDAiIHI9IjE1IiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC4yNSIvPjxjaXJjbGUgY3g9IjI3MCIgY3k9IjMwMCIgcj0iMTUiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjI1Ii8+PHRleHQgeD0iNTUwIiB5PSI1MDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4MCIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMiI+8J+RlDwvdGV4dD48cmVjdCB4PSI0NTAiIHk9IjE1MCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjMwIiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHRyYW5zZm9ybT0icm90YXRlKDQ1IDQ2NSAxNjUpIi8+PHJlY3QgeD0iMTUwIiB5PSI0NTAiIHdpZHRoPSI0NSIgaGVpZ2h0PSI4IiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC4zIi8+PC9nPjwvc3ZnPg=='
              },
              { 
                name: 'Women', 
                description: 'Trendy fashion and beauty essentials',
                bgImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJ3b21lbkdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZWMzODk5O3N0b3Atb3BhY2l0eToxIiAvPjxzdG9wIG9mZnNldD0iNTAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZjQzZjVlO3N0b3Atb3BhY2l0eToxIiAvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6I2VmNDQ0NDtzdG9wLW9wYWNpdHk6MSIgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0idXJsKCN3b21lbkdyYWRpZW50KSIvPjxnIG9wYWNpdHk9IjAuMTUiPjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEyMCIgcj0iNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iNCIvPjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEyMCIgcj0iNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjY1MCIgY3k9IjQ1MCIgcj0iMzAiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjMiLz48ZWxsaXBzZSBjeD0iNTUwIiBjeT0iMjAwIiByeD0iNDAiIHJ5PSI4MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiB0cmFuc2Zvcm09InJvdGF0ZSgxMiA1NTAgMjAwKSIvPjx0ZXh0IHg9IjEwMCIgeT0iNTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iODAiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjIiPvCfkZc8L3RleHQ+PGVsbGlwc2UgY3g9IjI2MCIgY3k9IjE1MCIgcng9IjEwIiByeT0iNDAiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjI1Ii8+PGVsbGlwc2UgY3g9IjUwMCIgY3k9IjQwMCIgcng9IjQwIiByeT0iMTAiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjMiLz48Y2lyY2xlIGN4PSI0MDAiIGN5PSIzMDAiIHI9IjE1IiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC40Ii8+PC9nPjwvc3ZnPg=='
              },
              { 
                name: 'Household Items', 
                description: 'Essential items for your home',
                bgImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJob3VzZWhvbGRHcmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzEwYjk4MTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3R5bGU9InN0b3AtY29sb3I6IzA1OWY2OTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwZDk0ODg7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9InVybCgjaG91c2Vob2xkR3JhZGllbnQpIi8+PGcgb3BhY2l0eT0iMC4xNSI+PHJlY3QgeD0iNTUwIiB5PSIxMDAiIHdpZHRoPSI5MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSI0IiByeD0iNSIvPjxyZWN0IHg9IjU3MCIgeT0iMTIwIiB3aWR0aD0iNTAiIGhlaWdodD0iMjAiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjMiIHJ4PSI1Ii8+PHJlY3QgeD0iMTAwIiB5PSI0MDAiIHdpZHRoPSI0NSIgaGVpZ2h0PSI4MCIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMjUiIHJ4PSIxMCIvPjxyZWN0IHg9IjExNSIgeT0iNDIwIiB3aWR0aD0iMTUiIGhlaWdodD0iNDAiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjQiLz48cmVjdCB4PSIzNTAiIHk9IjI1MCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHRyYW5zZm9ybT0icm90YXRlKDQ1IDM4MCAyODApIi8+PHJlY3QgeD0iMjAwIiB5PSIyMDAiIHdpZHRoPSIzMCIgaGVpZ2h0PSI0NSIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMiIgcng9IjUiLz48dGV4dCB4PSI1NTAiIHk9IjUwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgwIiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC4yIj7wn4+gPC90ZXh0PjxyZWN0IHg9IjQwMCIgeT0iNDAwIiB3aWR0aD0iNDUiIGhlaWdodD0iMTUiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjMiLz48Y2lyY2xlIGN4PSI0NTAiIGN5PSIxNTAiIHI9IjE1IiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC4zNSIvPjwvZz48L3N2Zz4='
              }
            ].map((category) => (
              <Link
                key={category.name}
                to={`/products?category=${category.name}`}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="relative h-64 md:h-80 flex flex-col justify-end p-6 md:p-8 text-white overflow-hidden" style={{ backgroundImage: `url(${category.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  {/* Overlay for better text readability */}
                  <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                  

                  
                  {/* Content */}
                  <div className="relative z-20">
                    <h3 className="text-2xl md:text-3xl font-bold mb-2 text-white drop-shadow-lg">{category.name}</h3>
                    <p className="text-white/95 mb-4 drop-shadow-md">{category.description}</p>
                     <button className="bg-white text-gray-900 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-lg">
                       Shop Now
                     </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
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
              {featuredProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="group bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200"
                >
                  <div className="relative overflow-hidden">
                    <div className="bg-gray-50 aspect-[3/4] flex items-center justify-center relative">
                      {product.variants.length > 0 && product.variants[0].images.length > 0 ? (
                        <img
                          src={product.variants[0].images[0]}
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