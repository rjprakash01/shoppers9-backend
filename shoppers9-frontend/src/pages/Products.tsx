import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Heart } from 'lucide-react';
import { productService, type Product, type ProductFilters } from '../services/products';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { formatPrice, formatPriceRange, formatDiscount, calculateDiscountPercentage } from '../utils/currency';
import { getImageUrl } from '../utils/imageUtils';
import FilterSidebar from '../components/FilterSidebar';
import LoginModal from '../components/LoginModal';


const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist: checkIsInWishlist, isLoading: wishlistLoading } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true); // Show filters by default on desktop, toggle on mobile
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingWishlistProduct, setPendingWishlistProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 50,
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
    
    // Build category filter based on hierarchy - use actual database slugs
    let categoryFilter = undefined;
    if (subsubcategory) {
      // For Level 3 categories, use the subsubcategory slug directly
      // Database stores Level 3 categories with slugs like 'men-tshirts', 'women-jeans', etc.
      categoryFilter = decodeURIComponent(subsubcategory);
    } else if (subcategory) {
      // For Level 2 categories, use the subcategory slug directly
      // Database stores Level 2 categories with slugs like 'men-clothing', 'women-footwear', etc.
      categoryFilter = decodeURIComponent(subcategory);
    } else if (category) {
      // For Level 1 categories, use the category slug directly
      // Database stores Level 1 categories with slugs like 'men', 'women', 'household'
      categoryFilter = decodeURIComponent(category);
    }
    
    // Don't clear products immediately to prevent blinking effect
    // Let the loading state handle the transition
    
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
      console.log('API Response - Full response:', JSON.stringify(response, null, 2));
      console.log('First 3 products from API:');
      response.products.slice(0, 3).forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - Category: ${product.category?.name || 'No category'}`);
      });
      console.log('=== END FRONTEND FILTERS DEBUG ===\n');
      setProducts(response.products);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('=== API ERROR ===');
      console.error('Error fetching products:', error);
      console.error('Filters that caused error:', JSON.stringify(filters, null, 2));
      console.error('=== END API ERROR ===');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };



  const updateFilters = (newFilters: Partial<ProductFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Update URL parameters
    const params = new URLSearchParams();
    if (updatedFilters.search) params.set('search', updatedFilters.search);
    
    // Preserve existing category hierarchy unless explicitly changing category
    if (!newFilters.hasOwnProperty('category')) {
      const currentCategory = searchParams.get('category');
      const currentSubcategory = searchParams.get('subcategory');
      const currentSubsubcategory = searchParams.get('subsubcategory');
      
      if (currentCategory) params.set('category', currentCategory);
      if (currentSubcategory) params.set('subcategory', currentSubcategory);
      if (currentSubsubcategory) params.set('subsubcategory', currentSubsubcategory);
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

    // If user is not authenticated, show login modal
    if (!isAuthenticated) {
      setPendingWishlistProduct(product);
      setShowLoginModal(true);
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

  const renderProductCard = (product: Product) => {
    const firstVariant = product.variants?.[0];
    const priceRange = product.minPrice !== product.maxPrice;
    
    return (
      <Link
        key={product._id}
        to={`/products/${product._id}`}
        className="bg-white overflow-hidden group transition-all duration-300 hover:shadow-lg"
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
            {/* Discount Badge */}
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                {calculateDiscountPercentage(product.originalPrice, product.price)}% OFF
              </div>
            )}
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
              <span className="text-sm font-bold" style={{
                color: 'var(--cta-dark-purple)'
              }}>
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="text-xs text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium text-xs">
                    {calculateDiscountPercentage(product.originalPrice, product.price)}% OFF
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
    // No pagination controls - always show 50 products
    return null;
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
          category={filters.category}
        />
        
        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${showFilters ? 'lg:ml-72' : 'lg:ml-0'}`}>
          <div className="w-full px-4 sm:px-6 lg:px-8">
          
          {/* Mobile Header and Controls - Single Line */}
          <div className="lg:hidden px-2 py-0.5">
            <div className="bg-white rounded-md p-1.5" style={{
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div className="flex items-center justify-between space-x-1.5 mb-1">
                {/* Category Title */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xs font-bold truncate" style={{
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
                <div className="flex items-center space-x-2">
                  {/* Filter Button */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-1.5 px-2 py-1 text-xs font-medium rounded transition-colors relative" style={{
                      backgroundColor: showFilters ? 'var(--cta-dark-purple)' : 'transparent',
                      color: showFilters ? 'white' : 'var(--cta-dark-purple)',
                      border: '1px solid var(--cta-dark-purple)'
                    }}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">{showFilters ? 'HIDE' : 'FILTER'}</span>
                    {Object.keys(filters).filter(key => !['search', 'category', 'page', 'limit', 'sortBy', 'sortOrder'].includes(key) && filters[key as keyof ProductFilters] !== undefined).length > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded-full ml-1">
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
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent bg-white min-w-0 text-gray-700"
                  >
                    <option value="createdAt-desc">Newest</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name-asc">Name: A to Z</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden lg:block py-2">
            {/* Top Row: Category Path and Sort Dropdown */}
            <div className="flex items-center justify-between mb-2">
              {/* Amazon-style Category Path */}
              <nav className="flex items-center space-x-1 text-xs">
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
                })()}
              </nav>
              
              {/* Desktop Sort Dropdown */}
               <select
                 value={`${filters.sortBy}-${filters.sortOrder}`}
                 onChange={(e) => {
                   const [sortBy, sortOrder] = e.target.value.split('-');
                   updateFilters({ sortBy: sortBy as any, sortOrder: sortOrder as any, page: 1 });
                 }}
                 className="elite-input px-1 py-0.5 text-xs font-inter mt-3"
                 style={{ fontSize: '10px' }}
               >
                 <option value="createdAt-desc">Newest</option>
                 <option value="price-asc">Price: Low</option>
                 <option value="price-desc">Price: High</option>
                 <option value="name-asc">A to Z</option>
               </select>
             </div>
             
             {/* Title and Product Count */}
             <div className="mb-2">
               <h1 className="font-playfair text-lg font-semibold text-elite-charcoal-black mb-1">
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
               
               <p className="font-inter text-xs text-elite-medium-grey">
                 {products.length > 0 ? `${products.length} products found` : 'Discover amazing products'}
               </p>
             </div>
            
            {/* Mobile Filter Toggle - Compact */}
            <div className="lg:hidden mb-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary flex items-center space-x-1 px-2 py-1 text-xs font-medium font-inter"
              >
                <Filter className="h-3 w-3" />
                <span>FILTER</span>
              </button>
            </div>
          </div>
          
          {/* Results */}
        {isLoading ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(20)].map((_, index) => (
              <div key={index} className="bg-white border border-gray-200 animate-pulse">
                <div className="bg-gray-200 aspect-[3/4]"></div>
                <div className="p-3 space-y-2">
                  <div className="bg-gray-200 h-4 rounded"></div>
                  <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                  <div className="bg-gray-200 h-8 rounded mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h2>
              <p className="text-sm text-gray-600 mb-4">
                We couldn't find any products matching your criteria.
              </p>
              <button
                onClick={() => {
                  updateFilters({ search: undefined, category: undefined, page: 1 });
                }}
                className="px-4 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-2 lg:gap-3 grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {products.map(renderProductCard)}
            </div>
            
            {renderPagination()}
          </>
        )}
          </div>
        </div>
      </div>
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={handleCloseLoginModal}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default Products;