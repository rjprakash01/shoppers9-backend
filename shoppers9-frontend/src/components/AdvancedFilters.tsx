import React, { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp, Star, Check, Sliders } from 'lucide-react';
import { searchService } from '../services/searchService';

interface FilterOption {
  value: string;
  displayValue: string;
  count?: number;
  colorCode?: string;
}

interface FilterGroup {
  id: string;
  name: string;
  displayName: string;
  type: 'checkbox' | 'radio' | 'range' | 'color' | 'rating';
  options: FilterOption[];
  isExpanded?: boolean;
  allowMultiple?: boolean;
}

interface PriceRange {
  min: number;
  max: number;
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onFiltersChange: (filters: any) => void;
  currentFilters: any;
  category?: string;
  className?: string;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  isOpen,
  onClose,
  onFiltersChange,
  currentFilters,
  category,
  className = ''
}) => {
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 10000 });
  const [tempPriceRange, setTempPriceRange] = useState<PriceRange>({ min: 0, max: 10000 });
  const [isLoading, setIsLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['price', 'brand', 'rating']));

  useEffect(() => {
    if (isOpen) {
      loadFilters();
    }
  }, [isOpen, category]);

  useEffect(() => {
    // Update temp price range when current filters change
    setTempPriceRange({
      min: currentFilters.minPrice || priceRange.min,
      max: currentFilters.maxPrice || priceRange.max
    });
  }, [currentFilters, priceRange]);

  const loadFilters = async () => {
    setIsLoading(true);
    try {
      const data = await searchService.getAvailableFilters(category);
      
      // Transform the data into filter groups
      const groups: FilterGroup[] = [];
      
      // Price range
      if (data.priceRange) {
        setPriceRange(data.priceRange);
        setTempPriceRange({
          min: currentFilters.minPrice || data.priceRange.min,
          max: currentFilters.maxPrice || data.priceRange.max
        });
      }
      
      // Brand filter
      if (data.brands && data.brands.length > 0) {
        groups.push({
          id: 'brand',
          name: 'brand',
          displayName: 'Brand',
          type: 'checkbox',
          options: data.brands.map((brand: any) => ({
            value: brand.name || brand,
            displayValue: brand.name || brand,
            count: brand.count
          })),
          allowMultiple: true,
          isExpanded: true
        });
      }
      
      // Rating filter
      groups.push({
        id: 'rating',
        name: 'rating',
        displayName: 'Customer Rating',
        type: 'rating',
        options: [
          { value: '4', displayValue: '4 Stars & Up' },
          { value: '3', displayValue: '3 Stars & Up' },
          { value: '2', displayValue: '2 Stars & Up' },
          { value: '1', displayValue: '1 Star & Up' }
        ],
        allowMultiple: false,
        isExpanded: true
      });
      
      // Dynamic filters from backend
      if (data.filters) {
        data.filters.forEach((filter: any) => {
          if (filter.options && filter.options.length > 0) {
            groups.push({
              id: filter.id || filter.name,
              name: filter.name,
              displayName: filter.displayName || filter.name,
              type: filter.type === 'color' ? 'color' : 'checkbox',
              options: filter.options.map((option: any) => ({
                value: option.value,
                displayValue: option.displayValue || option.value,
                count: option.count,
                colorCode: option.colorCode
              })),
              allowMultiple: filter.allowMultiple !== false,
              isExpanded: false
            });
          }
        });
      }
      
      setFilterGroups(groups);
    } catch (error) {
      console.error('Failed to load filters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleFilterChange = (groupName: string, value: string, checked: boolean) => {
    const group = filterGroups.find(g => g.name === groupName);
    if (!group) return;

    let newFilters = { ...currentFilters };
    
    if (group.allowMultiple) {
      // Multiple selection (checkbox)
      const currentValues = newFilters[groupName] || [];
      if (checked) {
        newFilters[groupName] = [...currentValues, value];
      } else {
        newFilters[groupName] = currentValues.filter((v: string) => v !== value);
      }
      
      // Remove empty arrays
      if (newFilters[groupName].length === 0) {
        delete newFilters[groupName];
      }
    } else {
      // Single selection (radio)
      if (checked) {
        newFilters[groupName] = value;
      } else {
        delete newFilters[groupName];
      }
    }
    
    onFiltersChange(newFilters);
  };

  const handlePriceRangeChange = () => {
    const newFilters = { ...currentFilters };
    
    if (tempPriceRange.min > priceRange.min) {
      newFilters.minPrice = tempPriceRange.min;
    } else {
      delete newFilters.minPrice;
    }
    
    if (tempPriceRange.max < priceRange.max) {
      newFilters.maxPrice = tempPriceRange.max;
    } else {
      delete newFilters.maxPrice;
    }
    
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      search: currentFilters.search,
      category: currentFilters.category,
      subcategory: currentFilters.subcategory,
      subsubcategory: currentFilters.subsubcategory
    };
    
    // Remove undefined values
    Object.keys(clearedFilters).forEach(key => {
      if (clearedFilters[key as keyof typeof clearedFilters] === undefined) {
        delete clearedFilters[key as keyof typeof clearedFilters];
      }
    });
    
    setTempPriceRange({ min: priceRange.min, max: priceRange.max });
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    Object.keys(currentFilters).forEach(key => {
      if (!['search', 'category', 'subcategory', 'subsubcategory', 'page', 'limit', 'sortBy'].includes(key)) {
        if (Array.isArray(currentFilters[key])) {
          count += currentFilters[key].length;
        } else if (currentFilters[key] !== undefined) {
          count += 1;
        }
      }
    });
    return count;
  };

  const isFilterSelected = (groupName: string, value: string) => {
    const group = filterGroups.find(g => g.name === groupName);
    if (!group) return false;
    
    if (group.allowMultiple) {
      return (currentFilters[groupName] || []).includes(value);
    } else {
      return currentFilters[groupName] === value;
    }
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderColorOption = (option: FilterOption, groupName: string) => {
    const isSelected = isFilterSelected(groupName, option.value);
    
    return (
      <button
        key={option.value}
        onClick={() => handleFilterChange(groupName, option.value, !isSelected)}
        className={`
          relative w-8 h-8 rounded-full border-2 transition-all
          ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'}
        `}
        style={{ backgroundColor: option.colorCode || option.value }}
        title={option.displayValue}
      >
        {isSelected && (
          <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
        )}
      </button>
    );
  };

  const renderFilterOption = (option: FilterOption, group: FilterGroup) => {
    if (group.type === 'color') {
      return renderColorOption(option, group.name);
    }
    
    const isSelected = isFilterSelected(group.name, option.value);
    
    return (
      <label
        key={option.value}
        className="flex items-center space-x-3 py-2 cursor-pointer hover:bg-gray-50 rounded px-2 -mx-2"
      >
        <input
          type={group.allowMultiple ? 'checkbox' : 'radio'}
          name={group.name}
          value={option.value}
          checked={isSelected}
          onChange={(e) => handleFilterChange(group.name, option.value, e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        
        <div className="flex-1 flex items-center justify-between">
          <span className="text-sm text-gray-700">
            {group.type === 'rating' ? (
              <div className="flex items-center space-x-2">
                {renderStarRating(parseInt(option.value))}
                <span>{option.displayValue}</span>
              </div>
            ) : (
              option.displayValue
            )}
          </span>
          
          {option.count !== undefined && (
            <span className="text-xs text-gray-500">({option.count})</span>
          )}
        </div>
      </label>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Filter Panel */}
      <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl ${className}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              {getActiveFilterCount() > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {getActiveFilterCount()}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {getActiveFilterCount() > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {/* Price Range */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Price Range</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Min</label>
                        <input
                          type="number"
                          value={tempPriceRange.min}
                          onChange={(e) => setTempPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                          onBlur={handlePriceRangeChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                          min={priceRange.min}
                          max={priceRange.max}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Max</label>
                        <input
                          type="number"
                          value={tempPriceRange.max}
                          onChange={(e) => setTempPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) || 0 }))}
                          onBlur={handlePriceRangeChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                          min={priceRange.min}
                          max={priceRange.max}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={priceRange.min}
                        max={priceRange.max}
                        value={tempPriceRange.min}
                        onChange={(e) => setTempPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) }))}
                        onMouseUp={handlePriceRangeChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="range"
                        min={priceRange.min}
                        max={priceRange.max}
                        value={tempPriceRange.max}
                        onChange={(e) => setTempPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                        onMouseUp={handlePriceRangeChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Filter Groups */}
                {filterGroups.map((group) => (
                  <div key={group.id} className="space-y-3">
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <h3 className="font-medium text-gray-900">{group.displayName}</h3>
                      {expandedGroups.has(group.id) ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    
                    {expandedGroups.has(group.id) && (
                      <div className="space-y-2">
                        {group.type === 'color' ? (
                          <div className="flex flex-wrap gap-2">
                            {group.options.map((option) => renderColorOption(option, group.name))}
                          </div>
                        ) : (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {group.options.map((option) => renderFilterOption(option, group))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t p-4">
            <div className="flex space-x-3">
              <button
                onClick={clearAllFilters}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilters;