import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X, Filter } from 'lucide-react';
import { productService } from '../services/products';

interface FilterOption {
  name: string;
  count: number;
  colorCode?: string;
}

interface FilterData {
  priceRange: { minPrice: number; maxPrice: number };
  brands: FilterOption[];
  sizes: FilterOption[];
  colors: FilterOption[];
  materials: FilterOption[];
  fabrics: FilterOption[];
  subcategories: { name: string; slug: string }[];
}

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onFiltersChange: (filters: any) => void;
  currentFilters: any;
  category?: string;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  isOpen,
  onClose,
  onFiltersChange,
  currentFilters,
  category
}) => {
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    brand: true,
    size: true,
    color: true,
    material: false,
    fabric: false,
    subcategory: true
  });
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });

  useEffect(() => {
    fetchFilterData();
  }, [category]);

  const fetchFilterData = async () => {
    try {
      setIsLoading(true);
      const response = await productService.getFilters(category);
      setFilterData(response.data);
      
      // Set initial price range
      if (response.data.priceRange) {
        setPriceRange({
          min: currentFilters.minPrice || response.data.priceRange.minPrice,
          max: currentFilters.maxPrice || response.data.priceRange.maxPrice
        });
      }
    } catch (error) {
      
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (filterType: string, value: any, checked: boolean) => {
    const currentValues = currentFilters[filterType] || [];
    let newValues;

    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter((v: any) => v !== value);
    }

    onFiltersChange({
      ...currentFilters,
      [filterType]: newValues.length > 0 ? newValues : undefined
    });
  };

  const handlePriceChange = () => {
    onFiltersChange({
      ...currentFilters,
      minPrice: priceRange.min,
      maxPrice: priceRange.max
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    if (filterData?.priceRange) {
      setPriceRange({
        min: filterData.priceRange.minPrice,
        max: filterData.priceRange.maxPrice
      });
    }
  };

  const getActiveFilterCount = () => {
    let count = 0;
    Object.keys(currentFilters).forEach(key => {
      if (key !== 'page' && key !== 'limit' && key !== 'sortBy' && key !== 'sortOrder' && key !== 'category' && key !== 'search') {
        if (Array.isArray(currentFilters[key])) {
          count += currentFilters[key].length;
        } else if (currentFilters[key] !== undefined) {
          count += 1;
        }
      }
    });
    return count;
  };

  const renderFilterSection = (
    title: string,
    sectionKey: keyof typeof expandedSections,
    options: FilterOption[],
    filterType: string
  ) => {
    if (!options || options.length === 0) return null;

    return (
      <div className="border-b border-gray-200 pb-4">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full py-2 text-left font-medium text-gray-900 hover:text-gray-700"
        >
          <span>{title}</span>
          {expandedSections[sectionKey] ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        
        {expandedSections[sectionKey] && (
          <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
            {options.map((option) => {
              const isChecked = currentFilters[filterType]?.includes(option.name) || false;
              return (
                <label key={option.name} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleFilterChange(filterType, option.name, e.target.checked)}
                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <div className="flex items-center space-x-2 flex-1">
                    {filterType === 'colors' && option.colorCode && (
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: option.colorCode }}
                      />
                    )}
                    <span className="text-sm text-gray-700">{option.name}</span>
                    <span className="text-xs text-gray-500">({option.count})</span>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay - only show on mobile when open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-35 left-0 z-50 w-80 bg-white shadow-lg lg:shadow-none lg:border-r lg:border-gray-200 h-[calc(100vh-8.75rem)]
        ${isOpen ? 'block' : 'hidden'}
      `}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              {getActiveFilterCount() > 0 && (
                <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2 py-1 rounded-full">
                  {getActiveFilterCount()}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="lg:hidden p-1 rounded-md hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              filterData && (
                <>
                  {/* Price Range */}
                  {filterData.priceRange && (
                    <div className="border-b border-gray-200 pb-4">
                      <button
                        onClick={() => toggleSection('price')}
                        className="flex items-center justify-between w-full py-2 text-left font-medium text-gray-900 hover:text-gray-700"
                      >
                        <span>Price Range</span>
                        {expandedSections.price ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      
                      {expandedSections.price && (
                        <div className="mt-4 space-y-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              placeholder="Min"
                              value={priceRange.min}
                              onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-pink-500 focus:border-pink-500"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                              type="number"
                              placeholder="Max"
                              value={priceRange.max}
                              onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) || 10000 }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-pink-500 focus:border-pink-500"
                            />
                          </div>
                          <button
                            onClick={handlePriceChange}
                            className="w-full bg-pink-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-pink-700 transition-colors"
                          >
                            Apply Price Filter
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Subcategories */}
                  {filterData.subcategories && filterData.subcategories.length > 0 && (
                    <div className="border-b border-gray-200 pb-4">
                      <button
                        onClick={() => toggleSection('subcategory')}
                        className="flex items-center justify-between w-full py-2 text-left font-medium text-gray-900 hover:text-gray-700"
                      >
                        <span>Categories</span>
                        {expandedSections.subcategory ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      
                      {expandedSections.subcategory && (
                        <div className="mt-2 space-y-2">
                          {filterData.subcategories.map((subcat) => (
                            <a
                              key={subcat.slug}
                              href={`/categories/${subcat.slug}`}
                              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            >
                              {subcat.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Brands */}
                  {renderFilterSection('Brand', 'brand', filterData.brands, 'brand')}

                  {/* Sizes */}
                  {renderFilterSection('Size', 'size', filterData.sizes, 'sizes')}

                  {/* Colors */}
                  {renderFilterSection('Color', 'color', filterData.colors, 'colors')}

                  {/* Materials */}
                  {renderFilterSection('Material', 'material', filterData.materials, 'material')}

                  {/* Fabrics */}
                  {renderFilterSection('Fabric', 'fabric', filterData.fabrics, 'fabric')}
                </>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterSidebar;