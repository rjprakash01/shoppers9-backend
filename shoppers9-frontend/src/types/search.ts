// Re-export search types to avoid import issues
export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'brand' | 'category' | 'keyword';
  category?: string;
  image?: string;
  price?: number;
  popularity?: number;
}

export interface AutocompleteResult {
  suggestions: SearchSuggestion[];
  recentSearches: string[];
  popularSearches: string[];
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
  filters?: Record<string, string[]>;
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