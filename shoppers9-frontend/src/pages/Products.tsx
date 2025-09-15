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
import EnhancedSearch from '../components/EnhancedSearch';
import AdvancedFilters from '../components/AdvancedFilters';
import { searchService } from '../services/searchService';

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
  const [showFilters, setShowFilters] = useState(false); // Hide filters by default, show only when clicked
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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
    const subcategory = searchParams.get('subcategory');
    const subsubcategory = searchParams.get('subsubcategory');
    const page = searchParams.get('page');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    
    if (search) setSearchQuery(search);
    
    // Build category filter based on hierarchy
    let categoryFilter = category;
    if (subsubcategory) {
      // If subsubcategory is selected, use the full path
      categoryFilter = `${category}-${subcategory}-${subsubcategory}`;
    } else if (subcategory) {
      // If subcategory is selected, use category-subcategory
      categoryFilter = `${category}-${subcategory}`;
    }
    
    setFilters(prev => ({
      ...prev,
      search: search || undefined,
      category: categoryFilter || undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      page: page ? parseInt(page) : 1
    }));
    
    setCurrentPage(page ? parseInt(page) : 1);
  }, [searchParams]);

  // Handle responsive filter display - only set initial state
  useEffect(() => {
    // Show filters by default on desktop (lg and above), hide on mobile - only on initial load
    if (window.innerWidth >= 1024) {
      setShowFilters(true);
    } else {
      setShowFilters(false);
    }
  }, []); // Empty dependency array to run only once on mount

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      console.log('\n=== FRONTEND FILTERS DEBUG ===');
      console.log('Filters being sent to API:', JSON.stringify(filters, null, 2));
      
      // Add cache-busting parameter to ensure fresh data
      const filtersWithCacheBust = {
        ...filters,
        _t: Date.now()
      };
      
      const response = await productService.getProducts(filtersWithCacheBust);
      console.log('API Response - Total products:', response.products.length);
      console.log('First 3 products from API:');
      response.products.slice(0, 3).forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
      });
      console.log('=== END FRONTEND FILTERS DEBUG ===\n');
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
    
    // Update URL - preserve existing category hierarchy unless explicitly changing category
    const params = new URLSearchParams();
    if (updatedFilters.search) params.set('search', updatedFilters.search);
    
    // Preserve category hierarchy from current URL unless category filter is being updated
    if (!newFilters.hasOwnProperty('category')) {
      const currentCategory = searchParams.get('category');
      const currentSubcategory = searchParams.get('subcategory');
      const currentSubsubcategory = searchParams.get('subsubcategory');
      
      if (currentCategory) params.set('category', currentCategory);
      if (currentSubcategory) params.set('subcategory', currentSubcategory);
      if (currentSubsubcategory) params.set('subsubcategory', currentSubsubcategory);
    } else if (updatedFilters.category) {
      // If category is being updated, parse the hierarchical category string
      const categoryParts = updatedFilters.category.split('-');
      if (categoryParts.length >= 1) params.set('category', categoryParts[0]);
      if (categoryParts.length >= 2) params.set('subcategory', categoryParts[1]);
      if (categoryParts.length >= 3) params.set('subsubcategory', categoryParts[2]);
    }
    
    if (updatedFilters.minPrice) params.set('minPrice', updatedFilters.minPrice.toString());
    if (updatedFilters.maxPrice) params.set('maxPrice', updatedFilters.maxPrice.toString());
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
    
    if (!firstVariant._id || !firstVariant.size) {
      
      return;
    }
    
    try {
      await addToCart(product, firstVariant._id, firstVariant.size, 1);
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
        <div key={product._id} className="postcard-box">
          <div className="flex p-3">
            <Link to={`/products/${product._id}`} className="flex-shrink-0">
              <img
                src={getImageUrl(product.images?.[0] || '/placeholder-image.svg')}
                alt={product.name}
                className="w-24 h-32 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.svg';
                }}
              />
            </Link>
            
            <div className="flex-1 ml-3">
              <Link to={`/products/${product._id}`}>
                <h3 className="font-playfair text-base font-semibold text-elite-charcoal-black mb-1 hover:text-elite-cta-purple transition-colors">
                  {product.name}
                </h3>
              </Link>
              <p className="font-inter text-elite-medium-grey text-sm mb-2 line-clamp-2">
                {product.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="font-inter font-bold text-elite-charcoal-black" style={{ fontSize: '13px' }}>
                      {product.minPrice && product.maxPrice && product.minPrice !== product.maxPrice ? 
                        `${formatPrice(product.minPrice)} - ${formatPrice(product.maxPrice)}` : 
                        formatPrice(product.minPrice || 0)
                      }
                    </span>
                    {product.maxDiscount && product.maxDiscount > 0 && (
                      <>
                        <span className="font-inter text-elite-medium-grey line-through" style={{ fontSize: '10px' }}>
                          {product.minOriginalPrice && product.maxOriginalPrice && product.minOriginalPrice !== product.maxOriginalPrice ? 
                            formatPriceRange(product.minOriginalPrice, product.maxOriginalPrice) : 
                            formatPrice(product.minOriginalPrice || 0)
                          }
                        </span>
                        <span className="bg-elite-cta-purple text-elite-base-white font-bold font-inter px-1 py-0.5 uppercase tracking-wide" style={{ fontSize: '9px' }}>
                          {product.maxDiscount}%
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
                    className={`p-1 transition-colors disabled:opacity-50 ${
                      checkIsInWishlist(product._id)
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-elite-medium-grey hover:text-red-500'
                    }`}
                  >
                    <Heart className={`h-3 w-3 ${
                      checkIsInWishlist(product._id) ? 'fill-current' : ''
                    }`} />
                  </button>

                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
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
            <img
              src={getImageUrl(product.images?.[0] || '/placeholder-image.svg')}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-image.svg';
              }}
            />
            {product.totalStock === 0 && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <span className="text-white font-medium text-xs px-2 py-1 rounded" style={{
                  backgroundColor: 'var(--cta-dark-purple)'
                }}>Out of Stock</span>
              </div>
            )}
          </div>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleToggleWishlist(product);
            }}
            disabled={wishlistLoading}
            className={`absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:shadow-lg disabled:opacity-50 ${
              checkIsInWishlist(product._id) ? 'opacity-100' : ''
            }`}
          >
            <Heart className={`h-3 w-3 transition-colors ${
              checkIsInWishlist(product._id)
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
              {/* Show price range if min and max prices are different */}
              {product.minPrice && product.maxPrice && product.minPrice !== product.maxPrice ? (
                <span className="text-sm font-bold" style={{
                  color: 'var(--cta-dark-purple)'
                }}>
                  {formatPrice(product.minPrice)}
                </span>
              ) : (
                <span className="text-sm font-bold" style={{
                  color: 'var(--cta-dark-purple)'
                }}>
                  {formatPrice(product.minPrice || 0)}
                </span>
              )}
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
          className={`px-2 py-1 text-xs font-medium font-poppins rounded-lg transition-colors ${
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
      <div className="mt-4 py-4">
        {/* Items per page selector and pagination info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPage" className="text-xs font-medium font-poppins text-brand-indigo">
                Items per page:
              </label>
              <select
                id="itemsPerPage"
                value={filters.limit || 12}
                onChange={(e) => updateFilters({ limit: parseInt(e.target.value), page: 1 })}
                className="input-field px-2 py-1 border border-brand-light-grey focus:outline-none bg-white text-xs font-inter text-brand-charcoal-black"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={36}>36</option>
                <option value={48}>48</option>
                <option value={60}>60</option>
              </select>
            </div>
            
            <div className="text-xs text-brand-indigo/70 font-poppins">
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
          <div className="flex items-center justify-center space-x-1">
            <button
              onClick={() => updateFilters({ page: 1 })}
              disabled={currentPage === 1}
              className="btn-secondary px-2 py-1 text-xs font-medium font-montserrat disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              First
            </button>
            
            <button
              onClick={() => updateFilters({ page: currentPage - 1 })}
              disabled={currentPage === 1}
              className="btn-secondary px-3 py-1 text-xs font-medium font-montserrat disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {startPage > 1 && (
                <>
                  <button
                    onClick={() => updateFilters({ page: 1 })}
                    className="px-2 py-1 text-xs font-medium bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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
                    className="px-2 py-1 text-xs font-medium bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => updateFilters({ page: currentPage + 1 })}
              disabled={currentPage === totalPages}
              className="btn-secondary px-3 py-1 text-xs font-medium font-montserrat disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
            
            <button
              onClick={() => updateFilters({ page: totalPages })}
              disabled={currentPage === totalPages}
              className="btn-secondary px-2 py-1 text-xs font-medium font-montserrat disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Last
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-white to-brand-light-grey">
      <div className="flex">
        {/* Filter Sidebar */}
        <FilterSidebar
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          onFiltersChange={handleFiltersChange}
          currentFilters={filters}
        />

        {/* Advanced Filters */}
        <AdvancedFilters
          isOpen={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          onFiltersChange={handleFiltersChange}
          currentFilters={filters}
          category={searchParams.get('category') || undefined}
        />
        
        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${showFilters ? 'lg:ml-72' : 'lg:ml-0'}`}>
          <div className="w-full px-4 sm:px-6 lg:px-8">
          
          {/* Mobile Header and Controls - Single Line */}
          <div className="lg:hidden px-3 py-1">
            <div className="bg-white rounded-md p-2" style={{
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div className="flex items-center justify-between space-x-2 mb-2">
                {/* Category Title */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-bold truncate" style={{
                    fontFamily: 'Inter, sans-serif',
                    color: '#1f2937'
                  }}>
                    {(() => {
                      const category = searchParams.get('category');
                      const subcategory = searchParams.get('subcategory');
                      const subsubcategory = searchParams.get('subsubcategory');
                      
                      if (subsubcategory) {
                        return `${category?.charAt(0).toUpperCase()}${category?.slice(1)} > ${subcategory?.charAt(0).toUpperCase()}${subcategory?.slice(1)} > ${subsubcategory?.charAt(0).toUpperCase()}${subsubcategory?.slice(1)}`;
                      } else if (subcategory) {
                        return `${category?.charAt(0).toUpperCase()}${category?.slice(1)} > ${subcategory?.charAt(0).toUpperCase()}${subcategory?.slice(1)}`;
                      } else if (category) {
                        return category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
                      }
                      return 'All Products';
                    })()
                    }
                  </h1>
                  <p className="text-xs" style={{
                    color: 'var(--medium-grey)'
                  }}>
                    {products.length > 0 ? `${products.length} found` : 'No products'}
                  </p>
                </div>
                
                {/* Filter and Sort Controls */}
                <div className="flex items-center space-x-1.5">
                  {/* Filter Button */}
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded transition-colors relative" style={{
                      backgroundColor: showAdvancedFilters ? 'var(--cta-dark-purple)' : 'transparent',
                      color: showAdvancedFilters ? 'white' : 'var(--cta-dark-purple)',
                      border: '1px solid var(--cta-dark-purple)'
                    }}
                  >
                    <Filter className="h-3 w-3" />
                    <span className="hidden xs:inline">{showAdvancedFilters ? 'HIDE' : 'FILTER'}</span>
                    {Object.keys(filters).filter(key => !['search', 'category', 'page', 'limit', 'sortBy', 'sortOrder'].includes(key) && filters[key as keyof ProductFilters] !== undefined).length > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-1 py-0.5 rounded-full ml-1">
                        {Object.keys(filters).filter(key => !['search', 'category', 'page', 'limit', 'sortBy', 'sortOrder'].includes(key) && filters[key as keyof ProductFilters] !== undefined).length}
                      </span>
                    )}
                  </button>
                  
                  {/* Sort Dropdown */}
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      updateFilters({ sortBy: sortBy as any, sortOrder: sortOrder as any, page: 1 });
                    }}
                    className="px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="createdAt-desc">Newest</option>
                    <option value="price-asc">Price: Low</option>
                    <option value="price-desc">Price: High</option>
                    <option value="name-asc">A to Z</option>
                  </select>
                </div>
              </div>
              
              {/* Enhanced Search Bar */}
              <EnhancedSearch
                placeholder="Search products..."
                onSearch={(query) => {
                  setSearchQuery(query);
                  updateFilters({ search: query.trim() || undefined, page: 1 });
                }}
                size="sm"
                className="w-full"
              />
            </div>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden lg:block py-4 lg:py-6">
            {/* Amazon-style Category Path */}
            <div className="mb-4">
              <nav className="flex items-center space-x-2 text-sm mb-3">
                <Link to="/" className="text-blue-600 hover:text-blue-800 hover:underline">
                  Home
                </Link>
                {(() => {
                  const category = searchParams.get('category');
                  const subcategory = searchParams.get('subcategory');
                  const subsubcategory = searchParams.get('subsubcategory');
                  const pathItems = [];
                  
                  if (category) {
                    pathItems.push({
                      name: category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' '),
                      url: `/products?category=${category}`
                    });
                  }
                  
                  if (subcategory) {
                    pathItems.push({
                      name: subcategory.charAt(0).toUpperCase() + subcategory.slice(1).replace(/-/g, ' '),
                      url: `/products?category=${category}&subcategory=${subcategory}`
                    });
                  }
                  
                  if (subsubcategory) {
                    pathItems.push({
                      name: subsubcategory.charAt(0).toUpperCase() + subsubcategory.slice(1).replace(/-/g, ' '),
                      url: `/products?category=${category}&subcategory=${subcategory}&subsubcategory=${subsubcategory}`
                    });
                  }
                  
                  return pathItems.map((item, index) => (
                    <React.Fragment key={index}>
                      <span className="text-gray-400">›</span>
                      {index === pathItems.length - 1 ? (
                        <span className="text-gray-900 font-medium">{item.name}</span>
                      ) : (
                        <Link to={item.url} className="text-blue-600 hover:text-blue-800 hover:underline">
                          {item.name}
                        </Link>
                      )}
                    </React.Fragment>
                  ));
                })()
                }
              </nav>
              
              <h1 className="font-playfair text-xl lg:text-2xl font-semibold text-elite-charcoal-black mb-1">
                {(() => {
                  const category = searchParams.get('category');
                  const subcategory = searchParams.get('subcategory');
                  const subsubcategory = searchParams.get('subsubcategory');
                  
                  if (subsubcategory) {
                    return subsubcategory.charAt(0).toUpperCase() + subsubcategory.slice(1).replace(/-/g, ' ');
                  } else if (subcategory) {
                    return subcategory.charAt(0).toUpperCase() + subcategory.slice(1).replace(/-/g, ' ');
                  } else if (category) {
                    return category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
                  }
                  return 'All Products';
                })()
                }
              </h1>
              
              <p className="font-inter text-sm text-elite-medium-grey">
                {products.length > 0 ? `${products.length} products found` : 'Discover amazing products'}
              </p>
            </div>
            
            {/* Elite Search and Controls */}
            <div className="postcard-box p-3 mb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0 gap-3">
                {/* Elite Enhanced Search */}
                <div className="flex-1 max-w-md">
                  <EnhancedSearch
                    placeholder="Search products, brands, categories..."
                    onSearch={(query) => {
                      setSearchQuery(query);
                      updateFilters({ search: query.trim() || undefined, page: 1 });
                    }}
                    size="lg"
                    className="w-full"
                    autoFocus={false}
                  />
                </div>
                
                {/* Elite Controls */}
                <div className="flex items-center space-x-3">
                  {/* Mobile Filter Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden btn-secondary flex items-center space-x-1 px-3 py-2 text-xs font-medium font-inter"
                  >
                    <Filter className="h-3 w-3" />
                    <span>FILTER</span>
                  </button>
                  
                  {/* Desktop Advanced Filter Toggle */}
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="hidden lg:flex btn-secondary items-center space-x-1 px-3 py-2 text-xs font-medium font-inter relative"
                  >
                    <Filter className="h-3 w-3" />
                    <span>{showAdvancedFilters ? 'HIDE' : 'FILTERS'}</span>
                    {Object.keys(filters).filter(key => !['search', 'category', 'page', 'limit', 'sortBy', 'sortOrder'].includes(key) && filters[key as keyof ProductFilters] !== undefined).length > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                        {Object.keys(filters).filter(key => !['search', 'category', 'page', 'limit', 'sortBy', 'sortOrder'].includes(key) && filters[key as keyof ProductFilters] !== undefined).length}
                      </span>
                    )}
                  </button>
                
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    updateFilters({ sortBy: sortBy as any, sortOrder: sortOrder as any, page: 1 });
                  }}
                  className="elite-input px-2 py-2 text-xs font-inter"
                >
                  <option value="createdAt-desc">Newest</option>
                  <option value="price-asc">Price: Low</option>
                  <option value="price-desc">Price: High</option>
                  <option value="name-asc">A to Z</option>
                </select>
                
                <div className="flex items-center border border-elite-medium-grey overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 transition-colors ${
                      viewMode === 'grid' ? 'bg-elite-cta-purple text-elite-base-white' : 'text-elite-charcoal-black hover:bg-elite-light-grey'
                    }`}
                  >
                    <Grid className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 transition-colors ${
                      viewMode === 'list' ? 'bg-elite-cta-purple text-elite-base-white' : 'text-elite-charcoal-black hover:bg-elite-light-grey'
                    }`}
                  >
                    <List className="h-3 w-3" />
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
            <div className={`grid gap-3 lg:gap-4 ${
              viewMode === 'grid'
                ? 'grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'
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