import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, X, Filter } from 'lucide-react';
import { productService } from '../services/products';
import { categoriesService } from '../services/categories';

interface FilterOption {
  name: string;
  count: number;
  colorCode?: string;
  value?: string;
}

interface DynamicFilter {
  name: string;
  displayName: string;
  type: string;
  dataType: string;
  options: FilterOption[];
}

interface FilterData {
  priceRange: { minPrice: number; maxPrice: number };
  brands: FilterOption[];
  sizes: FilterOption[];
  colors: FilterOption[];
  materials: FilterOption[];
  fabrics: FilterOption[];
  subcategories: { name: string; slug: string }[];
  filters: DynamicFilter[];
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
  const [searchParams] = useSearchParams();
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    price: true,
    brand: true,
    size: true,
    color: true,
    material: false,
    fabric: false,
    subcategory: true
  });
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [categoryTree, setCategoryTree] = useState<any>(null);

  useEffect(() => {
    fetchFilterData();
    fetchCategoryTree();
  }, [category]);

  const fetchCategoryTree = async () => {
    try {
      const categories = await categoriesService.getCategoryTree();
      console.log('Fetched categories from API:', categories);
      
      // Convert hierarchical tree to flat structure for easier access
      const tree: any = {};
      
      const processCategory = (cat: any, level: number = 1) => {
        if (level === 1) {
          // Level 1 categories (Men, Women, etc.)
          tree[cat.slug] = {
            name: cat.name,
            children: {}
          };
          
          // Process children (level 2)
          if (cat.children && cat.children.length > 0) {
            cat.children.forEach((child: any) => {
              tree[cat.slug].children[child.slug] = {
                name: child.name,
                children: {}
              };
              
              // Process grandchildren (level 3)
              if (child.children && child.children.length > 0) {
                child.children.forEach((grandchild: any) => {
                  tree[cat.slug].children[child.slug].children[grandchild.slug] = grandchild.name;
                });
              }
            });
          }
        }
      };
      
      // Process all level 1 categories
      categories.forEach((cat: any) => {
        if (cat.level === 1) {
          processCategory(cat, 1);
        }
      });
      
      setCategoryTree(tree);
      console.log('Built category tree for filter:', tree);
    } catch (error) {
      console.error('Error fetching category tree:', error);
      setCategoryTree({});
    }
  };
  
  const getParentSlug = (slug: string, level: number): string => {
    const parts = slug.split('-');
    if (level === 1) {
      return parts[0]; // 'men' from 'men-clothing-t-shirt'
    } else if (level === 2) {
      return parts.slice(0, 2).join('-'); // 'men-clothing' from 'men-clothing-t-shirt'
    }
    return slug;
  };

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

  const toggleSection = (section: string) => {
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
    sectionKey: string,
    options: FilterOption[],
    filterType: string
  ) => {
    if (!options || options.length === 0) return null;

    return (
      <div className="border-b border-gray-200 pb-3">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full py-1.5 text-left font-medium text-gray-900 hover:text-gray-700"
        >
          <span className="text-sm">{title}</span>
          {expandedSections[sectionKey] ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
        
        {expandedSections[sectionKey] && (
          <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
            {options.map((option, index) => {
              const isChecked = currentFilters[filterType]?.includes(option.name) || false;
              const uniqueKey = `${filterType}-${option.name}-${index}-${option.colorCode || ''}`;
              return (
                <label key={uniqueKey} className="flex items-center space-x-2 cursor-pointer py-0.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleFilterChange(filterType, option.name, e.target.checked)}
                    className="rounded border-gray-300 text-black focus:ring-black w-3 h-3"
                  />
                  <div className="flex items-center space-x-1.5 flex-1">
                    {filterType === 'colors' && option.colorCode && (
                      <div
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: option.colorCode }}
                      />
                    )}
                    <span className="text-xs text-gray-700">{option.name}</span>
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
        fixed top-32 left-0 z-50 w-64 lg:w-72 bg-white shadow-lg lg:shadow-none lg:border-r lg:border-gray-200 h-[calc(100vh-8rem)]
        ${isOpen ? 'block' : 'hidden'}
      `}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-900">Filters</h2>
              {getActiveFilterCount() > 0 && (
                <span className="bg-pink-100 text-pink-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
                  {getActiveFilterCount()}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={onClose}
                className="lg:hidden p-1 rounded-md hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>



          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
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
                  {/* Vertical Category Tree */}
                  <div className="border-b border-gray-200 pb-3 mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
                    <div className="space-y-1 text-sm">
                      {(() => {
                        const category = searchParams.get('category');
                        const subcategory = searchParams.get('subcategory');
                        const subsubcategory = searchParams.get('subsubcategory');
                        
                        // Use dynamic category tree from API
                        console.log('Current categoryTree state:', categoryTree);
                        console.log('Current category from URL:', category);
                        
                        if (!categoryTree) {
                          return <div className="text-sm text-gray-500">Loading categories...</div>;
                        }
                        
                        if (Object.keys(categoryTree).length === 0) {
                          return <div className="text-sm text-gray-500">No categories available</div>;
                        }
                        
                        // Parse the category hierarchy from the URL parameter
                        const categoryParts = category?.split('-') || [];
                        let currentCategory = null;
                        let displayCategory = null;
                        
                        if (categoryParts.length >= 3) {
                          // Level 3: men-clothing-jeans
                          const level1 = categoryParts[0]; // men
                          const level2Key = categoryParts.slice(0, 2).join('-'); // men-clothing
                          const level3Key = category; // men-clothing-jeans
                          
                          if (categoryTree[level1] && categoryTree[level1].children[level2Key] && categoryTree[level1].children[level2Key].children[level3Key]) {
                            currentCategory = categoryTree[level1];
                            displayCategory = {
                              name: categoryTree[level1].children[level2Key].children[level3Key],
                              level: 3,
                              parent: categoryTree[level1].children[level2Key]
                            };
                          }
                        } else if (categoryParts.length === 2) {
                          // Level 2: men-clothing
                          const level1 = categoryParts[0]; // men
                          
                          if (categoryTree[level1] && categoryTree[level1].children[category]) {
                            currentCategory = categoryTree[level1];
                            displayCategory = {
                              name: categoryTree[level1].children[category].name,
                              level: 2,
                              children: categoryTree[level1].children[category].children
                            };
                          }
                        } else {
                          // Level 1: men
                          currentCategory = categoryTree[category as string];
                          if (currentCategory) {
                            displayCategory = {
                              name: currentCategory.name,
                              level: 1,
                              children: currentCategory.children
                            };
                          }
                        }
                        
                        console.log('Parsed category info:', { categoryParts, currentCategory, displayCategory });
                        
                        if (!currentCategory || !displayCategory) {
                          return <div className="text-sm text-gray-500">Category "{category}" not found</div>;
                        }
                        
                        return (
                          <div>
                            {/* Show current category and its context */}
                            {displayCategory.level === 1 && (
                              <>
                                {/* Level 1 - Main Category */}
                                <div className="mb-2">
                                  <Link 
                                    to={`/products?category=${category}`}
                                    className="block text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-2 py-1 rounded"
                                  >
                                    {displayCategory.name}
                                  </Link>
                                </div>
                                
                                {/* Level 2 - Subcategories */}
                                {displayCategory.children && Object.entries(displayCategory.children).map(([subKey, subValue]) => {
                                  const subCategoryObj = typeof subValue === 'object' ? subValue : null;
                                  
                                  return (
                                    <div key={subKey} className="ml-4 mb-2">
                                      <Link 
                                        to={`/products?category=${subKey}`}
                                        className="block text-blue-600 hover:text-blue-800"
                                      >
                                        {subCategoryObj ? subCategoryObj.name : subValue}
                                      </Link>
                                    </div>
                                  );
                                })}
                              </>
                            )}
                            
                            {displayCategory.level === 2 && (
                              <>
                                {/* Show parent category */}
                                <div className="mb-2">
                                  <Link 
                                    to={`/products?category=${categoryParts[0]}`}
                                    className="block text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    {currentCategory.name}
                                  </Link>
                                </div>
                                
                                {/* Current Level 2 category */}
                                <div className="ml-4 mb-2">
                                  <Link 
                                    to={`/products?category=${category}`}
                                    className="block text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-2 py-1 rounded"
                                  >
                                    {displayCategory.name}
                                  </Link>
                                  
                                  {/* Level 3 - Sub-subcategories */}
                                  {displayCategory.children && (
                                    <div className="ml-4 mt-1 space-y-1">
                                      {Object.entries(displayCategory.children).map(([subSubKey, subSubValue]) => {
                                        return (
                                          <Link 
                                            key={subSubKey}
                                            to={`/products?category=${subSubKey}`}
                                            className="block text-sm text-blue-600 hover:text-blue-800"
                                          >
                                            {subSubValue}
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                            
                            {displayCategory.level === 3 && (
                              <>
                                {/* Show parent categories */}
                                <div className="mb-2">
                                  <Link 
                                    to={`/products?category=${categoryParts[0]}`}
                                    className="block text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    {currentCategory.name}
                                  </Link>
                                </div>
                                
                                <div className="ml-4 mb-2">
                                  <Link 
                                    to={`/products?category=${categoryParts.slice(0, 2).join('-')}`}
                                    className="block text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    {displayCategory.parent.name}
                                  </Link>
                                  
                                  {/* Show all categories in original order with current highlighted */}
                                  <div className="ml-4 mt-1 space-y-1">
                                    {Object.entries(displayCategory.parent.children).map(([siblingKey, siblingValue]) => {
                                      const isCurrentCategory = siblingKey === category;
                                      return (
                                        <Link 
                                          key={siblingKey}
                                          to={`/products?category=${siblingKey}`}
                                          className={`block text-sm ${
                                            isCurrentCategory 
                                              ? 'text-blue-800 font-medium bg-blue-100 px-2 py-1 rounded' 
                                              : 'text-blue-600 hover:text-blue-800'
                                          }`}
                                        >
                                          {siblingValue}
                                        </Link>
                                      );
                                    })}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()
                      }
                    </div>
                  </div>
                  


                  {/* Subcategories */}
                  {filterData.subcategories && filterData.subcategories.length > 0 && (
                    <div className="border-b border-gray-200 pb-3">
                      <button
                        onClick={() => toggleSection('subcategory')}
                        className="flex items-center justify-between w-full py-1.5 text-left font-medium text-gray-900 hover:text-gray-700"
                      >
                        <span className="text-sm">Categories</span>
                        {expandedSections.subcategory ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                      
                      {expandedSections.subcategory && (
                        <div className="mt-2 space-y-1">
                          {filterData.subcategories.map((subcat) => (
                            <a
                              key={subcat.slug}
                              href={`/categories/${subcat.slug}`}
                              className="block px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
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

                  {/* Dynamic Filters */}
                  {filterData.filters && filterData.filters.map((filter) => {
                    const sectionKey = `dynamic_${filter.name}`;
                    
                    // Initialize expanded state for dynamic filters if not already set
                    if (expandedSections[sectionKey] === undefined) {
                      setExpandedSections(prev => ({
                        ...prev,
                        [sectionKey]: false
                      }));
                    }
                    
                    return (
                      <div key={filter.name} className="border-b border-gray-200 pb-3">
                        <button
                          onClick={() => toggleSection(sectionKey)}
                          className="flex items-center justify-between w-full py-1.5 text-left font-medium text-gray-900 hover:text-gray-700"
                        >
                          <span className="text-sm">{filter.displayName}</span>
                          {expandedSections[sectionKey] ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                        
                        {expandedSections[sectionKey] && (
                          <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                            {filter.options.map((option, index) => {
                              const filterValue = option.value || option.name;
                              const isChecked = currentFilters[filter.name]?.includes(filterValue) || false;
                              const uniqueKey = `${filter.name}-${filterValue}-${index}-${option.colorCode || ''}`;
                              
                              return (
                                <label key={uniqueKey} className="flex items-center space-x-2 cursor-pointer py-0.5">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => handleFilterChange(filter.name, filterValue, e.target.checked)}
                                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500 w-3 h-3"
                                  />
                                  <div className="flex items-center space-x-1.5 flex-1">
                                    {option.colorCode && (
                                      <div
                                        className="w-3 h-3 rounded-full border border-gray-300"
                                        style={{ backgroundColor: option.colorCode }}
                                      />
                                    )}
                                    <span className="text-xs text-gray-700">{option.name}</span>
                                    <span className="text-xs text-gray-500">({option.count})</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
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