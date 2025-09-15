import axios from 'axios';
import { debounce } from 'lodash';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

// Search suggestion types
export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'brand' | 'category' | 'keyword';
  category?: string;
  image?: string;
  price?: number;
  popularity?: number;
}

export interface SearchFilters {
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
  filters?: Record<string, string[]>; // Dynamic filters
}

export interface SearchResult {
  products: any[];
  suggestions: SearchSuggestion[];
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

export interface AutocompleteResult {
  suggestions: SearchSuggestion[];
  recentSearches: string[];
  popularSearches: string[];
}

class SearchService {
  private searchHistory: string[] = [];
  private maxHistorySize = 10;

  constructor() {
    this.loadSearchHistory();
  }

  // Enhanced search with advanced filtering
  async search(filters: SearchFilters): Promise<SearchResult> {
    try {
      const startTime = Date.now();
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.query) {
        params.append('search', filters.query);
        this.addToSearchHistory(filters.query);
      }
      
      if (filters.category) params.append('category', filters.category);
      if (filters.subcategory) params.append('subcategory', filters.subcategory);
      if (filters.subsubcategory) params.append('subsubcategory', filters.subsubcategory);
      
      if (filters.brand && filters.brand.length > 0) {
        filters.brand.forEach(brand => params.append('brand', brand));
      }
      
      if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.inStock) params.append('inStock', 'true');
      if (filters.rating) params.append('rating', filters.rating.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      
      params.append('page', (filters.page || 1).toString());
      params.append('limit', (filters.limit || 20).toString());
      
      // Add dynamic filters
      if (filters.filters) {
        Object.entries(filters.filters).forEach(([key, values]) => {
          values.forEach(value => params.append(`filter_${key}`, value));
        });
      }
      
      // Include aggregations for filters
      params.append('includeAggregations', 'true');
      
      const response = await axios.get(`${API_BASE_URL}/products/search?${params.toString()}`);
      const endTime = Date.now();
      
      return {
        ...response.data,
        searchMeta: {
          ...response.data.searchMeta,
          searchTime: endTime - startTime
        }
      };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  // Autocomplete with suggestions
  async autocomplete(query: string): Promise<AutocompleteResult> {
    try {
      if (!query || query.length < 2) {
        return {
          suggestions: [],
          recentSearches: this.getRecentSearches(),
          popularSearches: await this.getPopularSearches()
        };
      }

      const response = await axios.get(`${API_BASE_URL}/products/autocomplete`, {
        params: { q: query, limit: 10 }
      });

      return {
        suggestions: response.data.suggestions || [],
        recentSearches: this.getRecentSearches(),
        popularSearches: response.data.popularSearches || []
      };
    } catch (error) {
      console.error('Autocomplete error:', error);
      return {
        suggestions: [],
        recentSearches: this.getRecentSearches(),
        popularSearches: []
      };
    }
  }

  // Debounced autocomplete for performance
  debouncedAutocomplete = debounce(this.autocomplete.bind(this), 300);

  // Get search suggestions based on user behavior
  async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/suggestions`, {
        params: { q: query }
      });
      return response.data.suggestions || [];
    } catch (error) {
      console.error('Search suggestions error:', error);
      return [];
    }
  }

  // Get available filters for a category
  async getAvailableFilters(category?: string): Promise<any> {
    try {
      const params = category ? { category } : {};
      const response = await axios.get(`${API_BASE_URL}/products/filters`, { params });
      return response.data;
    } catch (error) {
      console.error('Get filters error:', error);
      return { filters: [], priceRange: { min: 0, max: 10000 } };
    }
  }

  // Get trending searches
  async getTrendingSearches(): Promise<string[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/trending-searches`);
      return response.data.searches || [];
    } catch (error) {
      console.error('Trending searches error:', error);
      return [];
    }
  }

  // Get popular searches
  async getPopularSearches(): Promise<string[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/popular-searches`);
      return response.data.searches || [];
    } catch (error) {
      console.error('Popular searches error:', error);
      return [
        'T-shirts',
        'Jeans',
        'Sneakers',
        'Dresses',
        'Jackets',
        'Accessories'
      ];
    }
  }

  // Search history management
  private addToSearchHistory(query: string): void {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || this.searchHistory.includes(trimmedQuery)) return;
    
    this.searchHistory.unshift(trimmedQuery);
    if (this.searchHistory.length > this.maxHistorySize) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
    }
    
    this.saveSearchHistory();
  }

  getRecentSearches(): string[] {
    return [...this.searchHistory];
  }

  clearSearchHistory(): void {
    this.searchHistory = [];
    this.saveSearchHistory();
  }

  removeFromHistory(query: string): void {
    this.searchHistory = this.searchHistory.filter(item => item !== query);
    this.saveSearchHistory();
  }

  private saveSearchHistory(): void {
    try {
      localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }

  private loadSearchHistory(): void {
    try {
      const saved = localStorage.getItem('searchHistory');
      if (saved) {
        this.searchHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
      this.searchHistory = [];
    }
  }

  // Advanced search with natural language processing
  async intelligentSearch(query: string): Promise<SearchResult> {
    try {
      // Parse natural language queries
      const parsedQuery = this.parseNaturalLanguageQuery(query);
      return await this.search(parsedQuery);
    } catch (error) {
      console.error('Intelligent search error:', error);
      throw error;
    }
  }

  // Parse natural language queries (e.g., "red t-shirts under $50")
  private parseNaturalLanguageQuery(query: string): SearchFilters {
    const filters: SearchFilters = { query };
    const lowerQuery = query.toLowerCase();

    // Extract price ranges
    const priceMatches = lowerQuery.match(/under \$?(\d+)|below \$?(\d+)|less than \$?(\d+)/i);
    if (priceMatches) {
      const price = parseInt(priceMatches[1] || priceMatches[2] || priceMatches[3]);
      filters.maxPrice = price;
    }

    const minPriceMatches = lowerQuery.match(/over \$?(\d+)|above \$?(\d+)|more than \$?(\d+)/i);
    if (minPriceMatches) {
      const price = parseInt(minPriceMatches[1] || minPriceMatches[2] || minPriceMatches[3]);
      filters.minPrice = price;
    }

    // Extract colors
    const colors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'pink', 'purple', 'orange', 'brown', 'gray', 'grey'];
    const foundColors = colors.filter(color => lowerQuery.includes(color));
    if (foundColors.length > 0) {
      filters.filters = { ...filters.filters, color: foundColors };
    }

    // Extract sizes
    const sizes = ['xs', 'small', 'medium', 'large', 'xl', 'xxl', 's', 'm', 'l'];
    const foundSizes = sizes.filter(size => lowerQuery.includes(size));
    if (foundSizes.length > 0) {
      filters.filters = { ...filters.filters, size: foundSizes };
    }

    // Extract brands (common ones)
    const brands = ['nike', 'adidas', 'puma', 'reebok', 'converse', 'vans'];
    const foundBrands = brands.filter(brand => lowerQuery.includes(brand));
    if (foundBrands.length > 0) {
      filters.brand = foundBrands;
    }

    return filters;
  }

  // Get search analytics
  async getSearchAnalytics(): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/analytics/search`);
      return response.data;
    } catch (error) {
      console.error('Search analytics error:', error);
      return null;
    }
  }

  // Report search interaction (for analytics)
  async reportSearchInteraction(query: string, action: 'search' | 'click' | 'purchase', productId?: string): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/analytics/search-interaction`, {
        query,
        action,
        productId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to report search interaction:', error);
    }
  }
}

export const searchService = new SearchService();
export default searchService;