import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService, type Product, type ProductFilters } from '../services/products';
import { categoriesService, type Category } from '../services/categories';
import { formatPrice, formatPriceRange } from '../utils/currency';
import { getImageUrl } from '../utils/imageUtils';
import { Heart, Grid, List, Filter, ChevronRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import FilterSidebar from '../components/FilterSidebar';

const Category: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [categoryPath, setCategoryPath] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState<any>(null);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categoryName, setCategoryName] = useState('');
  const [showFilters, setShowFilters] = useState(false); // Hide filters by default, show only when clicked
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Handle responsive filter display
  useEffect(() => {
    const handleResize = () => {
      // Show filters by default on desktop (lg and above), hide on mobile
      if (window.innerWidth >= 1024) {
        setShowFilters(true);
      } else {
        setShowFilters(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (categorySlug) {
      parseCategoryPath();
      fetchCategoryProducts();
    }
  }, [categorySlug]); // Removed filters dependency to prevent infinite loop

  const parseCategoryPath = async () => {
    try {
      console.log('Parsing category path for slug:', categorySlug);
      
      // Fetch category tree to find the current category and its path
      const categories = await categoriesService.getCategoryTree();
      const flattenedCategories = flattenCategories(categories);
      setAllCategories(flattenedCategories);
      
      // Find current category by slug
       const current = flattenedCategories.find(cat => cat.slug === categorySlug);
       if (current) {
         setCurrentCategory(current);
         
         // Build category path (breadcrumb)
         const path = buildCategoryPath(current, flattenedCategories);
         setCategoryPath(path);
         
         // Find sub-categories if current category has children
         const children = flattenedCategories.filter(cat => cat.parentCategory === current.id || cat.parentCategory === current._id);
         setSubCategories(children);
        
        console.log('Category path built:', {
          current: current.name,
          path: path,
          children: children.map(c => c.name)
        });
      }
    } catch (error) {
      console.error('Error parsing category path:', error);
    }
  };
  
  const flattenCategories = (categories: Category[]): Category[] => {
    let flattened: Category[] = [];
    
    const flatten = (cats: Category[]) => {
      cats.forEach(cat => {
        flattened.push(cat);
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children);
        }
      });
    };
    
    flatten(categories);
    return flattened;
  };
  
  const buildCategoryPath = (category: Category, allCategories: Category[]): string[] => {
    const path: string[] = [];
    let current = category;
    
    // Build path from current category up to root
    while (current) {
      path.unshift(current.name);
      
      if (current.parentCategory) {
        current = allCategories.find(cat => 
          cat.id === current.parentCategory || cat._id === current.parentCategory
        ) || null;
      } else {
        current = null;
      }
    }
    
    return path;
   };
   
   const getCategorySlugByName = (categoryName: string): string => {
      // Find category by name in the loaded categories
      const category = allCategories.find(cat => cat.name === categoryName);
      if (category) {
        return category.slug;
      }
      
      // Fallback to slug generation if not found
      return categoryName.toLowerCase().replace(/\s+/g, '-');
    };
 
   const fetchCategoryProductsWithFilters = async (filtersToUse: ProductFilters) => {
    try {
      setIsLoading(true);
      
      console.log('Category page - fetching products for slug:', categorySlug);
      
      // Set category filter based on slug - use same logic as Products page
      const categoryFilters = {
        ...filtersToUse,
        category: categorySlug,
        // Add cache-busting parameter to ensure fresh data
        _t: Date.now()
      };
      
      console.log('Category page - filters being sent:', categoryFilters);
      
      const response = await productService.getProducts(categoryFilters);
      
      console.log('Category page - API response:', {
        totalProducts: response.products.length,
        firstThreeProducts: response.products.slice(0, 3).map(p => p.name)
      });
      
      setProducts(response.products);
      setTotalPages(response.pagination.totalPages);
      
      // Set category name from slug (capitalize first letter)
      if (categorySlug) {
        setCategoryName(categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1));
      }
    } catch (error) {
      console.error('Category page - error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchCategoryProducts = async () => {
    await fetchCategoryProductsWithFilters(filters);
  };

  const updateFilters = (newFilters: Partial<ProductFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setCurrentPage(updatedFilters.page || 1);
    
    // Manually trigger product fetch when filters change
    // Use setTimeout to ensure state updates are applied first
    setTimeout(() => {
      fetchCategoryProductsWithFilters(updatedFilters);
    }, 0);
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
                    <span className="font-bold text-gray-900" style={{ fontSize: '13px' }}>
                      {product.minPrice && product.maxPrice && product.minPrice !== product.maxPrice ? 
                        `${formatPrice(product.minPrice)} - ${formatPrice(product.maxPrice)}` : 
                        formatPrice(product.minPrice || 0)
                      }
                    </span>
                    {product.maxDiscount && product.maxDiscount > 0 && (
                      <>
                        <span className="text-gray-500 line-through" style={{ fontSize: '10px' }}>
                          {product.minOriginalPrice && product.maxOriginalPrice && product.minOriginalPrice !== product.maxOriginalPrice ? 
                            `${formatPrice(product.minOriginalPrice)} - ${formatPrice(product.maxOriginalPrice)}` : 
                            formatPrice(product.minOriginalPrice || 0)
                          }
                        </span>
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium" style={{ fontSize: '9px' }}>
                          Up to {product.maxDiscount}% OFF
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
              className="w-full h-48 object-cover"
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
              <span className="font-bold text-gray-900" style={{ fontSize: '11px' }}>
                {formatPrice(product.price || 0)}
              </span>
              {product.originalPrice && product.originalPrice > (product.price || 0) && (
                <>
                  <span className="text-gray-500 line-through" style={{ fontSize: '9px' }}>
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="bg-red-100 text-red-800 px-1 py-0.5 rounded font-medium" style={{ fontSize: '8px' }}>
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
        <div className={`flex-1 transition-all duration-300 ${showFilters ? 'lg:ml-72' : 'lg:ml-0'}`}>
          <div className="py-4 lg:py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{categoryName}</h1>
                {/* Amazon-style Category Breadcrumb */}
                  <div className="mt-1 mb-3">
                    <nav className="flex items-center space-x-1 text-sm text-gray-600">
                      <Link to="/" className="hover:text-blue-600 transition-colors">
                        Home
                      </Link>
                      {categoryPath.map((pathItem, index) => {
                        const isLast = index === categoryPath.length - 1;
                        return (
                          <React.Fragment key={index}>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                            {isLast ? (
                              <span className="font-medium text-gray-900">{pathItem}</span>
                            ) : (
                              <Link 
                                to={`/categories/${getCategorySlugByName(pathItem)}`}
                                className="hover:text-blue-600 transition-colors"
                              >
                                {pathItem}
                              </Link>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </nav>
                  </div>
                  
                  {/* Sub-categories Navigation */}
                  {subCategories.length > 0 && (
                    <div className="mt-2 mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Shop by Category:</h3>
                      <div className="flex flex-wrap gap-2">
                        {subCategories.map((subCat) => (
                          <Link
                            key={subCat.id || subCat._id}
                            to={`/categories/${subCat.slug}`}
                            className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-blue-50 text-sm text-gray-700 hover:text-blue-600 rounded-md transition-colors duration-200 border border-gray-200 hover:border-blue-200"
                          >
                            {subCat.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Debug Info (can be removed in production) */}
                  <div className="mt-1 mb-2">
                    <details className="text-xs">
                      <summary className="text-gray-500 font-medium cursor-pointer">Debug Info</summary>
                      <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 mt-1">
                        <div className="flex flex-col space-y-1">
                          <div>
                            <span className="text-sm font-medium text-blue-800">
                              Slug: {categorySlug || 'none'}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-blue-600">
                              Path: {categoryPath.join(' > ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-green-600">
                              Sub-categories: {subCategories.map(s => s.name).join(', ') || 'none'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                <p className="text-gray-600 mt-1 text-sm">
                  {products && products.length > 0 ? `${products.length} products found` : 'No products found'}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Filter Toggle Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center space-x-1 px-2 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <Filter className="h-3 w-3" />
                  <span>Filters</span>
                </button>
                
                {/* Desktop Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="hidden lg:flex items-center space-x-1 px-2 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <Filter className="h-3 w-3" />
                  <span>{showFilters ? 'Hide' : 'Show'}</span>
                </button>
                
                {/* Sort Options */}
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-') as [string, 'asc' | 'desc'];
                    updateFilters({ sortBy: sortBy as any, sortOrder, page: 1 });
                  }}
                  className="px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="createdAt-desc">Newest</option>
                  <option value="createdAt-asc">Oldest</option>
                  <option value="name-asc">A-Z</option>
                  <option value="name-desc">Z-A</option>
                  <option value="price-asc">Price: Low</option>
                  <option value="price-desc">Price: High</option>
                </select>
                
                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-md">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 ${
                      viewMode === 'grid'
                        ? 'bg-pink-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <Grid className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 ${
                      viewMode === 'list'
                        ? 'bg-pink-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <List className="h-3 w-3" />
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
            <div className={`grid gap-2 sm:gap-3 lg:gap-4 ${
              viewMode === 'grid'
                ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7'
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