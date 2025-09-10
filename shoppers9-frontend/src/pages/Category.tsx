import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService, type Product, type ProductFilters } from '../services/products';
import { formatPrice, formatPriceRange } from '../utils/currency';
import { getImageUrl } from '../utils/imageUtils';
import { Heart, Grid, List, Filter } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import FilterSidebar from '../components/FilterSidebar';

const Category: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categoryName, setCategoryName] = useState('');
  const [showFilters, setShowFilters] = useState(true); // Show filters by default on desktop
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    if (categorySlug) {
      fetchCategoryProducts();
    }
  }, [categorySlug, filters]);

  const fetchCategoryProducts = async () => {
    try {
      setIsLoading(true);
      // Set category filter based on slug
      const categoryFilters = {
        ...filters,
        category: categorySlug
      };
      
      const response = await productService.getProducts(categoryFilters);
      setProducts(response.products);
      setTotalPages(response.pagination.totalPages);
      
      // Set category name from slug (capitalize first letter)
      if (categorySlug) {
        setCategoryName(categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1));
      }
    } catch (error) {
      console.error('Failed to fetch category products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<ProductFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setCurrentPage(updatedFilters.page || 1);
  };

  const handleFiltersChange = (newFilters: Partial<ProductFilters>) => {
    updateFilters({ ...newFilters, page: 1 });
  };

  const renderProductCard = (product: Product) => {
    const firstVariant = product.variants?.[0];
    const priceRange = product.minPrice !== product.maxPrice;
    
    if (viewMode === 'list') {
      return (
        <div key={product._id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="flex p-4">
            <Link to={`/products/${product._id}`} className="flex-shrink-0">
              <img
                src={getImageUrl(product.images?.[0] || '/placeholder-image.svg')}
                alt={product.name}
                className="w-32 h-40 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.svg';
                }}
              />
            </Link>
            
            <div className="flex-1 ml-4">
              <Link to={`/products/${product._id}`}>
                <h3 className="text-lg font-medium text-gray-900 mb-1 hover:text-pink-600 transition-colors">
                  {product.name}
                </h3>
              </Link>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {product.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(product.price || 0)}
                    </span>
                    {product.originalPrice && product.originalPrice > (product.price || 0) && (
                      <>
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                          {Math.round(((product.originalPrice - (product.price || 0)) / product.originalPrice) * 100)}% OFF
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <Heart className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={product._id} className="group relative bg-white border border-gray-200 hover:shadow-lg transition-all duration-200">
        <Link to={`/products/${product._id}`}>
          <div className="relative overflow-hidden">
            <img
              src={getImageUrl(product.images?.[0] || '/placeholder-image.svg')}
              alt={product.name}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-image.svg';
              }}
            />
            {/* Discount Badge */}
            {firstVariant && firstVariant.originalPrice > firstVariant.price && (
              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                {Math.round(((firstVariant.originalPrice - firstVariant.price) / firstVariant.originalPrice) * 100)}% OFF
              </div>
            )}
            <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Heart className="h-4 w-4 text-gray-600 hover:text-pink-500" />
            </button>
          </div>
        </Link>
        
        <div className="p-3">
          <Link to={`/products/${product._id}`} className="block">
            <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 group-hover:text-pink-600 transition-colors">
              {product.name}
            </h3>
          </Link>
          
          <div className="mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-gray-900">
                {formatPrice(product.price || 0)}
              </span>
              {product.originalPrice && product.originalPrice > (product.price || 0) && (
                <>
                  <span className="text-xs text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded text-xs font-medium">
                    {Math.round(((product.originalPrice - (product.price || 0)) / product.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => updateFilters({ page: i })}
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            i === currentPage
              ? 'bg-pink-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return (
      <div className="flex items-center justify-center space-x-2 mt-8 py-8">
        <button
          onClick={() => updateFilters({ page: currentPage - 1 })}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
        >
          Previous
        </button>
        <div className="flex items-center space-x-1">
          {pages}
        </div>
        <button
          onClick={() => updateFilters({ page: currentPage + 1 })}
          disabled={currentPage === totalPages}
          className="px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
        >
          Next
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-gray-300 h-64 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Filter Sidebar */}
        <FilterSidebar
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          onFiltersChange={handleFiltersChange}
          currentFilters={filters}
          category={categorySlug}
        />
        
        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${showFilters ? 'lg:ml-0' : ''}`}>
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{categoryName}</h1>
                <p className="text-gray-600 mt-2">
                  {products && products.length > 0 ? `${products.length} products found` : 'No products found'}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Filter Toggle Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </button>
                
                {/* Desktop Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="hidden lg:flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <Filter className="h-4 w-4" />
                  <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                </button>
                
                {/* Sort Options */}
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-') as [string, 'asc' | 'desc'];
                    updateFilters({ sortBy: sortBy as any, sortOrder, page: 1 });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="price-asc">Price Low to High</option>
                  <option value="price-desc">Price High to Low</option>
                </select>
                
                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-md">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${
                      viewMode === 'grid'
                        ? 'bg-pink-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${
                      viewMode === 'list'
                        ? 'bg-pink-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

        {/* Products Grid/List */}
        {!products || products.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">Try browsing other categories or check back later.</p>
            <Link
              to="/products"
              className="inline-flex items-center px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-md transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <>
            <div className={`grid gap-4 ${
              viewMode === 'grid'
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : 'grid-cols-1'
            }`}>
              {products && products.map(renderProductCard)}
            </div>

            
            {renderPagination()}
          </>
        )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Category;