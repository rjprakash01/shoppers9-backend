import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Clock, TrendingUp, Filter, Mic, Camera, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchService } from '../services/searchService';
import { debounce } from 'lodash';

// Local type definitions to avoid import issues
interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'brand' | 'category' | 'keyword';
  category?: string;
  image?: string;
  price?: number;
  popularity?: number;
}

interface AutocompleteResult {
  suggestions: SearchSuggestion[];
  recentSearches: string[];
  popularSearches: string[];
}

interface EnhancedSearchProps {
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
  onSearch?: (query: string) => void;
  autoFocus?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  placeholder = 'Search products, brands, categories...',
  className = '',
  showFilters = true,
  onSearch,
  autoFocus = false,
  size = 'md'
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [autocompleteData, setAutocompleteData] = useState<AutocompleteResult>({
    suggestions: [],
    recentSearches: [],
    popularSearches: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check for voice search support
  useEffect(() => {
    setIsVoiceSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadInitialData = async () => {
    try {
      const data = await searchService.autocomplete('');
      setAutocompleteData(data);
    } catch (error) {
      console.error('Failed to load initial search data:', error);
    }
  };

  // Debounced autocomplete
  const debouncedAutocomplete = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        loadInitialData();
        return;
      }

      setIsLoading(true);
      try {
        const data = await searchService.autocomplete(searchQuery);
        setAutocompleteData(data);
      } catch (error) {
        console.error('Autocomplete error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (value.trim()) {
      setIsOpen(true);
      debouncedAutocomplete(value);
    } else {
      setIsOpen(false);
      loadInitialData();
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (!query) {
      loadInitialData();
    }
  };

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;

    setIsOpen(false);
    
    // Report search interaction
    searchService.reportSearchInteraction(finalQuery, 'search');
    
    if (onSearch) {
      onSearch(finalQuery);
    } else {
      navigate(`/products?search=${encodeURIComponent(finalQuery)}`);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text);
  };

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
    handleSearch(recentQuery);
  };

  const clearRecentSearches = () => {
    searchService.clearSearchHistory();
    loadInitialData();
  };

  const removeRecentSearch = (searchQuery: string) => {
    searchService.removeFromHistory(searchQuery);
    loadInitialData();
  };

  // Voice search
  const startVoiceSearch = () => {
    if (!isVoiceSupported) return;

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleSearch(transcript);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const allItems = [
      ...autocompleteData.suggestions,
      ...autocompleteData.recentSearches.map(search => ({ text: search, type: 'recent' as const })),
      ...autocompleteData.popularSearches.map(search => ({ text: search, type: 'popular' as const }))
    ];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < allItems.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allItems[selectedIndex]) {
          const item = allItems[selectedIndex];
          handleSearch(item.text);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-4 py-4 text-lg';
      default:
        return 'px-4 py-3 text-base';
    }
  };

  const renderSuggestionIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <Search className="w-4 h-4 text-gray-400" />;
      case 'brand':
        return <div className="w-4 h-4 bg-blue-100 rounded text-xs flex items-center justify-center text-blue-600 font-bold">B</div>;
      case 'category':
        return <div className="w-4 h-4 bg-green-100 rounded text-xs flex items-center justify-center text-green-600 font-bold">C</div>;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-12 border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            placeholder-gray-500 transition-colors
            ${getSizeClasses()}
          `}
          autoComplete="off"
        />
        
        {/* Action Buttons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {/* Voice Search */}
          {isVoiceSupported && (
            <button
              type="button"
              onClick={startVoiceSearch}
              disabled={isListening}
              className={`
                p-1 rounded-full transition-colors
                ${isListening 
                  ? 'text-red-500 bg-red-50 animate-pulse' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }
              `}
              title="Voice search"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
          
          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          ) : (
            <div className="py-2">
              {/* Suggestions */}
              {autocompleteData.suggestions.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                    Suggestions
                  </div>
                  {autocompleteData.suggestions.map((suggestion, index) => (
                    <button
                      key={`suggestion-${index}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`
                        w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3
                        ${selectedIndex === index ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                      `}
                    >
                      {renderSuggestionIcon(suggestion.type)}
                      <span className="flex-1">{suggestion.text}</span>
                      {suggestion.type && (
                        <span className="text-xs text-gray-400 capitalize">{suggestion.type}</span>
                      )}
                      <ArrowRight className="w-3 h-3 text-gray-300" />
                    </button>
                  ))}
                </div>
              )}

              {/* Recent Searches */}
              {autocompleteData.recentSearches.length > 0 && (
                <div className="border-t">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center justify-between">
                    <span>Recent Searches</span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-blue-600 hover:text-blue-800 normal-case text-xs"
                    >
                      Clear all
                    </button>
                  </div>
                  {autocompleteData.recentSearches.map((search, index) => (
                    <button
                      key={`recent-${index}`}
                      onClick={() => handleRecentSearchClick(search)}
                      className={`
                        w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 group
                        ${selectedIndex === autocompleteData.suggestions.length + index ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                      `}
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="flex-1">{search}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch(search);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </button>
                  ))}
                </div>
              )}

              {/* Popular Searches */}
              {autocompleteData.popularSearches.length > 0 && !query && (
                <div className="border-t">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    Trending
                  </div>
                  {autocompleteData.popularSearches.map((search, index) => (
                    <button
                      key={`popular-${index}`}
                      onClick={() => handleRecentSearchClick(search)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-gray-700"
                    >
                      <TrendingUp className="w-4 h-4 text-orange-400" />
                      <span className="flex-1">{search}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {autocompleteData.suggestions.length === 0 && 
               autocompleteData.recentSearches.length === 0 && 
               autocompleteData.popularSearches.length === 0 && 
               query && (
                <div className="px-4 py-8 text-center text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No suggestions found</p>
                  <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedSearch;