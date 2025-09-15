import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Filter, Grid, List, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import EnhancedSearch from '../components/EnhancedSearch';
import AdvancedFilters from '../components/AdvancedFilters';
import SearchResults from '../components/SearchResults';
import { searchService } from '../services/searchService';
import LoadingSpinner from '../components/LoadingSpinner';

// Local type definitions to avoid import issues
interface SearchFilters {
  query?: string;
  category?: string;
  subcategory?: string;
  subsubcategory?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
  sortBy?: 'relevance' | 'price_low' | 'price_high' | 'newest' | 'rating' | 'popularity';
  page?: number;
  limit?: number;
  filters?: Record<string, string[]>;
}

interface SearchResult {
  products: any[];
  suggestions: any[];
  filters: {
    brands: Array<{ name: string; count: number }>;
    categories: Array<{ name: string; slug: string; count: number }>;
    priceRanges: Array<{ min: number; max: number; count: number }>;
    dynamicFilters: Record<string, Array<{ value: string; displayValue: string; count: number }>>;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  searchMeta: {
    query: string;
    resultCount: number;
    searchTime: number;
    didYouMean?: string;
    relatedSearches: string[];
  };
}

const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  
  // Extract filters from URL params
  const getFiltersFromParams = (): SearchFilters => {
    const filters: SearchFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') as any || 'relevance'
    };
    
    // Basic filters
    if (searchParams.get('query')) filters.query = searchParams.get('query')!;
    if (searchParams.get('category')) filters.category = searchParams.get('category')!;
    if (searchParams.get('subcategory')) filters.subcategory = searchParams.get('subcategory')!;
    if (searchParams.get('subsubcategory')) filters.subsubcategory = searchParams.get('subsubcategory')!;
    if (searchParams.get('minPrice')) filters.minPrice = parseFloat(searchParams.get('minPrice')!);
    if (searchParams.get('maxPrice')) filters.maxPrice = parseFloat(searchParams.get('maxPrice')!);
    if (searchParams.get('inStock')) filters.inStock = searchParams.get('inStock') === 'true';
    if (searchParams.get('rating')) filters.rating = parseFloat(searchParams.get('rating')!);
    
    // Brand filters (can be multiple)
    const brands = searchParams.getAll('brand');
    if (brands.length > 0) filters.brand = brands;
    
    // Dynamic filters
    const dynamicFilters: Record<string, string[]> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith('filter_')) {
        const filterName = key.replace('filter_', '');
        if (!dynamicFilters[filterName]) {
          dynamicFilters[filterName] = [];
        }
        dynamicFilters[filterName].push(value);
      }
    });
    
    if (Object.keys(dynamicFilters).length > 0) {
      filters.filters = dynamicFilters;
    }
    
    return filters;
  };
  
  // Update URL params when filters change
  const updateURLParams = (filters: SearchFilters) => {
    const params = new URLSearchParams();
    
    // Basic filters
    if (filters.query) params.set('query', filters.query);
    if (filters.category) params.set('category', filters.category);
    if (filters.subcategory) params.set('subcategory', filters.subcategory);
    if (filters.subsubcategory) params.set('subsubcategory', filters.subsubcategory);
    if (filters.minPrice !== undefined) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.inStock) params.set('inStock', 'true');
    if (filters.rating) params.set('rating', filters.rating.toString());
    if (filters.sortBy && filters.sortBy !== 'relevance') params.set('sortBy', filters.sortBy);
    if (filters.page && filters.page > 1) params.set('page', filters.page.toString());
    if (filters.limit && filters.limit !== 20) params.set('limit', filters.limit.toString());
    
    // Brand filters
    if (filters.brand && filters.brand.length > 0) {
      filters.brand.forEach(brand => params.append('brand', brand));
    }
    
    // Dynamic filters
    if (filters.filters) {
      Object.entries(filters.filters).forEach(([key, values]) => {
        values.forEach(value => params.append(`filter_${key}`, value));
      });
    }
    
    setSearchParams(params);
  };
  
  // Perform search
  const performSearch = async (filters: SearchFilters) => {
    if (!filters.query && !filters.category) {
      setSearchResults(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await searchService.search({
        ...filters,
        includeAggregations: true
      });
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to perform search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle search from URL params
  useEffect(() => {
    const filters = getFiltersFromParams();
    setSortBy(filters.sortBy || 'relevance');
    performSearch(filters);
  }, [searchParams]);
  
  // Handle new search
  const handleSearch = (query: string) => {
    const currentFilters = getFiltersFromParams();
    const newFilters = {
      ...currentFilters,
      query,
      page: 1 // Reset to first page
    };
    updateURLParams(newFilters);
  };
  
  // Handle filter changes
  const handleFiltersChange = (newFilters: any) => {
    const currentFilters = getFiltersFromParams();
    const updatedFilters = {
      ...currentFilters,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    };
    updateURLParams(updatedFilters);
  };
  
  // Handle sort change
  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    const currentFilters = getFiltersFromParams();
    const updatedFilters = {
      ...currentFilters,
      sortBy: newSortBy as any,
      page: 1
    };
    updateURLParams(updatedFilters);
  };
  
  // Handle pagination
  const handlePageChange = (page: number) => {
    const currentFilters = getFiltersFromParams();
    const updatedFilters = {
      ...currentFilters,
      page
    };
    updateURLParams(updatedFilters);
  };
  
  // Handle related search clicks
  const handleRelatedSearchClick = (query: string) => {
    handleSearch(query);
  };
  
  // Handle "did you mean" clicks
  const handleDidYouMeanClick = (query: string) => {
    handleSearch(query);
  };
  
  // Handle product clicks for analytics
  const handleProductClick = (productId: string) => {
    const currentQuery = searchParams.get('query');
    if (currentQuery) {
      searchService.reportSearchInteraction(currentQuery, 'click', productId);
    }
  };
  
  const currentFilters = getFiltersFromParams();
  const hasActiveFilters = Object.keys(currentFilters).some(key => 
    !['query', 'page', 'limit', 'sortBy'].includes(key) && currentFilters[key as keyof SearchFilters] !== undefined
  );
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search Bar */}
          <div className="mb-4">
            <EnhancedSearch
              placeholder="Search products, brands, categories..."
              onSearch={handleSearch}
              size="lg"
              className="w-full max-w-2xl mx-auto"
              autoFocus={!currentFilters.query}
            />
          </div>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left side - Results info */}
            <div className="flex items-center space-x-4">
              {searchResults && (
                <p className="text-sm text-gray-600">
                  {searchResults.pagination.total} results
                  {currentFilters.query && ` for "${currentFilters.query}"`}
                </p>
              )}
            </div>
            
            {/* Right side - Controls */}
            <div className="flex items-center space-x-4">
              {/* Sort */}
              <div className="flex items-center space-x-2">
                <ArrowUpDown className="w-4 h-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="newest">Newest</option>
                  <option value="rating">Customer Rating</option>
                  <option value="popularity">Popularity</option>
                </select>
              </div>
              
              {/* View Mode */}
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              {/* Filters */}
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors relative"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                    {Object.keys(currentFilters).filter(key => 
                      !['query', 'page', 'limit', 'sortBy'].includes(key) && 
                      currentFilters[key as keyof SearchFilters] !== undefined
                    ).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" text="Searching..." />
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => performSearch(currentFilters)}
              className="mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              Try again
            </button>
          </div>
        )}
        
        {/* Search Results */}
        {!isLoading && !error && searchResults && (
          <>
            <SearchResults
              products={searchResults.products}
              searchMeta={searchResults.searchMeta}
              viewMode={viewMode}
              onProductClick={handleProductClick}
              onRelatedSearchClick={handleRelatedSearchClick}
              onDidYouMeanClick={handleDidYouMeanClick}
            />
            
            {/* Pagination */}
            {searchResults.pagination.pages > 1 && (
              <div className="mt-8 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  {/* Previous */}
                  <button
                    onClick={() => handlePageChange(searchResults.pagination.page - 1)}
                    disabled={searchResults.pagination.page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, searchResults.pagination.pages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 border rounded-md text-sm font-medium ${
                          page === searchResults.pagination.page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  {/* Next */}
                  <button
                    onClick={() => handlePageChange(searchResults.pagination.page + 1)}
                    disabled={searchResults.pagination.page === searchResults.pagination.pages}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Empty State */}
        {!isLoading && !error && !searchResults && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Filter className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start your search</h3>
            <p className="text-gray-500">Enter a search term or browse by category to find products.</p>
          </div>
        )}
      </div>
      
      {/* Advanced Filters Modal */}
      <AdvancedFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onFiltersChange={handleFiltersChange}
        currentFilters={currentFilters}
        category={currentFilters.category}
      />
    </div>
  );
};

export default Search;