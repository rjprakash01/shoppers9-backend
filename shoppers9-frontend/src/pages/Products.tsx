import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Grid, List, Heart } from 'lucide-react';
import { productService, type Product, type ProductFilters } from '../services/products';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { formatPrice, formatPriceRange } from '../utils/currency';
import { getImageUrl } from '../utils/imageUtils';
import FilterSidebar from '../components/FilterSidebar';

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist: checkIsInWishlist, isLoading: wishlistLoading } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true); // Show filters by default on desktop
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Initialize from URL params
  useEffect(() => {
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const page = searchParams.get('page');
    
    if (search) setSearchQuery(search);
    
    setFilters(prev => ({
      ...prev,
      search: search || undefined,
      category: category || undefined,
      page: page ? parseInt(page) : 1
    }));
    
    setCurrentPage(page ? parseInt(page) : 1);
  }, [searchParams]);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await productService.getProducts(filters);
      setProducts(response.products);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchQuery.trim() || undefined, page: 1 });
  };

  const updateFilters = (newFilters: Partial<ProductFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Update URL
    const params = new URLSearchParams();
    if (updatedFilters.search) params.set('search', updatedFilters.search);
    if (updatedFilters.category) params.set('category', updatedFilters.category);
    if (updatedFilters.page && updatedFilters.page > 1) params.set('page', updatedFilters.page.toString());
    
    setSearchParams(params);
    setCurrentPage(updatedFilters.page || 1);
  };

  const handleFiltersChange = (newFilters: Partial<ProductFilters>) => {
    updateFilters({ ...newFilters, page: 1 });
  };

  const handleAddToCart = async (product: Product) => {
    if (!product || !product._id || !product.variants.length) {
      
      return;
    }
    
    const firstVariant = product.variants[0];
    const firstSize = firstVariant.sizes[0];
    
    if (!firstSize || !firstVariant._id) {
      
      return;
    }
    
    try {
      await addToCart(product, firstVariant._id, firstSize.size, 1);
    } catch (error) {
      
    }
  };

  const handleToggleWishlist = async (product: Product) => {
    if (!product || !product._id) {
      
      return;
    }

    try {
      
      const isCurrentlyInWishlist = checkIsInWishlist(product._id);

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

  const renderProductCard = (product: Product) => {
    const firstVariant = product.variants?.[0];
    const priceRange = product.minPrice !== product.maxPrice;
    
    if (viewMode === 'list') {
      return (
        <div key={product._id} className="bg-white border border-brand-gold/20 hover:shadow-md hover:border-brand-gold transition-all duration-200 rounded-2xl">
          <div className="flex p-4">
            <Link to={`/products/${product._id}`} className="flex-shrink-0">
              <img
                src={getImageUrl(product.images?.[0] || '/placeholder-image.svg')}
                alt={product.name}
                className="w-32 h-40 object-cover rounded-xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.svg';
                }}
              />
            </Link>
            
            <div className="flex-1 ml-4">
              <Link to={`/products/${product._id}`}>
                <h3 className="text-lg font-medium font-poppins text-brand-indigo mb-1 hover:text-brand-gold transition-colors">
                  {product.name}
                </h3>
              </Link>
              <p className="text-brand-indigo/70 text-sm mb-3 line-clamp-2 font-poppins">
                {product.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold font-poppins text-brand-indigo">
                      {formatPrice(product.price || 0)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <>
                        <span className="text-sm text-brand-indigo/50 line-through font-poppins">
                          {formatPrice(product.originalPrice)}
                        </span>
                        <span className="text-xs bg-brand-gold/20 text-brand-indigo px-2 py-1 rounded-full font-medium font-poppins">
                          {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleWishlist(product);
                    }}
                    disabled={wishlistLoading}
                    className={`p-2 transition-colors disabled:opacity-50 ${
                      checkIsInWishlist(product._id)
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${
                      checkIsInWishlist(product._id) ? 'fill-current' : ''
                    }`} />
                  </button>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.totalStock === 0}
                    className={`px-4 py-2 text-sm font-medium font-poppins rounded-xl transition-colors disabled:cursor-not-allowed ${
                      product.totalStock === 0 
                        ? 'bg-brand-slate/30 text-brand-indigo/50' 
                        : 'bg-brand-gold text-brand-indigo hover:bg-white hover:text-brand-indigo border border-brand-gold'
                    }`}
                  >
                    {product.totalStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div key={product._id} className="group bg-white border border-brand-gold/20 hover:shadow-lg hover:border-brand-gold transition-all duration-200 rounded-2xl overflow-hidden">
        <div className="relative overflow-hidden">
          <Link to={`/products/${product._id}`} className="block">
            <img
              src={getImageUrl(product.images?.[0] || '/placeholder-image.svg')}
              alt={product.name}
              className="w-full aspect-[3/4] object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-image.svg';
              }}
            />
            {product.totalStock === 0 && (
              <div className="absolute inset-0 bg-brand-indigo/80 flex items-center justify-center">
                <span className="text-white font-medium text-sm font-poppins bg-brand-gold/90 px-3 py-1 rounded-full">Out of Stock</span>
              </div>
            )}
          </Link>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleToggleWishlist(product);
            }}
            disabled={wishlistLoading}
            className={`absolute top-2 right-2 p-2 bg-brand-gold/90 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 disabled:opacity-50 ${
              checkIsInWishlist(product._id) ? 'opacity-100' : ''
            }`}
          >
            <Heart className={`h-4 w-4 transition-colors ${
              checkIsInWishlist(product._id)
                ? 'text-brand-indigo fill-current'
                : 'text-brand-indigo'
            }`} />
          </button>
        </div>
        
        <div className="p-3">
          <Link to={`/products/${product._id}`} className="block">
            <h3 className="text-sm font-medium font-poppins text-brand-indigo mb-1 line-clamp-2 group-hover:text-brand-gold transition-colors">
              {product.name}
            </h3>
          </Link>
          
          <div className="mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold font-poppins text-brand-indigo">
                {formatPrice(product.price || 0)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="text-xs text-brand-indigo/50 line-through font-poppins">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="text-xs bg-brand-gold/20 text-brand-indigo px-1 py-0.5 rounded text-xs font-medium font-poppins">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>
          </div>
          
          <button
            onClick={() => handleAddToCart(product)}
            disabled={product.totalStock === 0}
            className={`w-full py-2 text-xs font-medium font-poppins rounded-xl transition-colors disabled:cursor-not-allowed ${
              product.totalStock === 0 
                ? 'bg-brand-slate/30 text-brand-indigo/50' 
                : 'bg-brand-gold text-brand-indigo hover:bg-white hover:text-brand-indigo border border-brand-gold'
            }`}
          >
            {product.totalStock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1 && products.length <= 12) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => updateFilters({ page: i })}
          className={`px-3 py-2 text-sm font-medium font-poppins rounded-xl transition-colors ${
            i === currentPage
              ? 'bg-brand-gold text-brand-indigo shadow-sm'
              : 'bg-white text-brand-indigo border border-brand-gold/30 hover:bg-brand-gold/10'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return (
      <div className="mt-8 py-8">
        {/* Items per page selector and pagination info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPage" className="text-sm font-medium font-poppins text-brand-indigo">
                Items per page:
              </label>
              <select
                id="itemsPerPage"
                value={filters.limit || 12}
                onChange={(e) => updateFilters({ limit: parseInt(e.target.value), page: 1 })}
                className="px-3 py-1 border border-brand-gold/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold bg-white text-sm font-poppins text-brand-indigo"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={36}>36</option>
                <option value={48}>48</option>
                <option value={60}>60</option>
              </select>
            </div>
            
            <div className="text-sm text-brand-indigo/70 font-poppins">
              Showing {((currentPage - 1) * (filters.limit || 12)) + 1} to {Math.min(currentPage * (filters.limit || 12), products.length)} of {products.length} products
            </div>
          </div>
          
          {totalPages > 1 && (
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>
        
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => updateFilters({ page: 1 })}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium font-poppins bg-white text-brand-indigo border border-brand-gold/30 rounded-xl hover:bg-brand-gold/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
            >
              First
            </button>
            
            <button
              onClick={() => updateFilters({ page: currentPage - 1 })}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium font-poppins bg-white text-brand-indigo border border-brand-gold/30 rounded-xl hover:bg-brand-gold/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {startPage > 1 && (
                <>
                  <button
                    onClick={() => updateFilters({ page: 1 })}
                    className="px-3 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    1
                  </button>
                  {startPage > 2 && (
                    <span className="px-2 py-2 text-sm text-gray-500">...</span>
                  )}
                </>
              )}
              
              {pages}
              
              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && (
                    <span className="px-2 py-2 text-sm text-gray-500">...</span>
                  )}
                  <button
                    onClick={() => updateFilters({ page: totalPages })}
                    className="px-3 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => updateFilters({ page: currentPage + 1 })}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
            >
              Next
            </button>
            
            <button
              onClick={() => updateFilters({ page: totalPages })}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
            >
              Last
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-white to-brand-slate/5">
      <div className="flex">
        {/* Filter Sidebar */}
        <FilterSidebar
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          onFiltersChange={handleFiltersChange}
          currentFilters={filters}
        />
        
        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${showFilters ? 'lg:ml-80' : 'lg:ml-0'}`}>
          <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="py-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold font-playfair text-brand-indigo mb-2">
                All Products
              </h1>
              <p className="text-brand-indigo/70 font-poppins">
                {products.length > 0 ? `${products.length} products found` : 'Discover amazing products'}
              </p>
            </div>
            
            {/* Search and Controls */}
            <div className="bg-white border border-brand-gold/20 p-4 mb-6 rounded-2xl shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 gap-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex-1 max-w-md">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2 border border-brand-gold/30 rounded-xl focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 text-sm font-poppins"
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-gold" />
                  </div>
                </form>
                
                {/* Controls */}
                <div className="flex items-center space-x-4">
                  {/* Mobile Filter Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-brand-gold/30 text-brand-indigo hover:bg-brand-gold/10 text-sm font-medium font-poppins rounded-xl transition-colors"
                  >
                    <Filter className="h-4 w-4" />
                    <span>FILTER</span>
                  </button>
                  
                  {/* Desktop Filter Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="hidden lg:flex items-center space-x-2 px-4 py-2 border border-brand-gold/30 text-brand-indigo hover:bg-brand-gold/10 text-sm font-medium font-poppins rounded-xl transition-colors"
                  >
                    <Filter className="h-4 w-4" />
                    <span>{showFilters ? 'HIDE FILTERS' : 'SHOW FILTERS'}</span>
                  </button>
                
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    updateFilters({ sortBy: sortBy as any, sortOrder: sortOrder as any, page: 1 });
                  }}
                  className="px-3 py-2 border border-brand-gold/30 rounded-xl focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 bg-white text-brand-indigo text-sm font-poppins"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                </select>
                
                <div className="flex items-center border border-brand-gold/30 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${
                      viewMode === 'grid' ? 'bg-brand-gold text-brand-indigo' : 'text-brand-indigo hover:bg-brand-gold/10'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${
                      viewMode === 'list' ? 'bg-brand-gold text-brand-indigo' : 'text-brand-indigo hover:bg-brand-gold/10'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Results */}
        {isLoading ? (
          <div className={`grid gap-4 ${
            viewMode === 'grid'
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              : 'grid-cols-1'
          }`}>
            {[...Array(20)].map((_, index) => (
              <div key={index} className="bg-white border border-gray-200 animate-pulse">
                {viewMode === 'grid' ? (
                  <>
                    <div className="bg-gray-200 aspect-[3/4]"></div>
                    <div className="p-3 space-y-2">
                      <div className="bg-gray-200 h-4 rounded"></div>
                      <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                      <div className="bg-gray-200 h-8 rounded mt-2"></div>
                    </div>
                  </>
                ) : (
                  <div className="flex p-4">
                    <div className="bg-gray-200 w-32 h-40 flex-shrink-0"></div>
                    <div className="flex-1 ml-4 space-y-3">
                      <div className="bg-gray-200 h-5 rounded"></div>
                      <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                      <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                      <div className="flex justify-between items-center mt-4">
                        <div className="bg-gray-200 h-5 rounded w-20"></div>
                        <div className="bg-gray-200 h-8 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-xl font-medium text-gray-900 mb-2">No Products Found</h2>
              <p className="text-gray-600 mb-6">
                We couldn't find any products matching your criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  updateFilters({ search: undefined, category: undefined, page: 1 });
                }}
                className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={`grid gap-4 ${
              viewMode === 'grid'
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : 'grid-cols-1'
            }`}>
              {products.map(renderProductCard)}
            </div>
            
            {renderPagination()}
          </>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;