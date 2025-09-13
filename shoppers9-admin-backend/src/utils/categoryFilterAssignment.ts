import Category from '../models/Category';
import Filter from '../models/Filter';
import FilterOption from '../models/FilterOption';
import CategoryFilter from '../models/CategoryFilter';

interface FilterAssignmentRule {
  keywords: string[];
  filterTypes: {
    name: string;
    displayName: string;
    type: 'single' | 'multiple';
    dataType: 'string' | 'number' | 'boolean';
    description: string;
    options: {
      value: string;
      displayValue: string;
      colorCode?: string;
    }[];
  }[];
}

// Define filter assignment rules based on category keywords
const FILTER_ASSIGNMENT_RULES: FilterAssignmentRule[] = [
  {
    keywords: ['shirt', 't-shirt', 'top', 'dress', 'jacket', 'hoodie', 'sweater', 'blouse', 'kurta', 'clothing'],
    filterTypes: [
      {
        name: 'size',
        displayName: 'Size',
        type: 'multiple',
        dataType: 'string',
        description: 'Clothing sizes',
        options: [
          { value: 'XS', displayValue: 'XS (Extra Small)' },
          { value: 'S', displayValue: 'S (Small)' },
          { value: 'M', displayValue: 'M (Medium)' },
          { value: 'L', displayValue: 'L (Large)' },
          { value: 'XL', displayValue: 'XL (Extra Large)' },
          { value: 'XXL', displayValue: 'XXL (Double Extra Large)' },
          { value: '3XL', displayValue: '3XL (Triple Extra Large)' }
        ]
      },
      {
        name: 'color',
        displayName: 'Color',
        type: 'multiple',
        dataType: 'string',
        description: 'Product colors',
        options: [
          { value: 'black', displayValue: 'Black', colorCode: '#000000' },
          { value: 'white', displayValue: 'White', colorCode: '#FFFFFF' },
          { value: 'red', displayValue: 'Red', colorCode: '#FF0000' },
          { value: 'blue', displayValue: 'Blue', colorCode: '#0000FF' },
          { value: 'green', displayValue: 'Green', colorCode: '#008000' },
          { value: 'yellow', displayValue: 'Yellow', colorCode: '#FFFF00' },
          { value: 'pink', displayValue: 'Pink', colorCode: '#FFC0CB' },
          { value: 'purple', displayValue: 'Purple', colorCode: '#800080' },
          { value: 'orange', displayValue: 'Orange', colorCode: '#FFA500' },
          { value: 'brown', displayValue: 'Brown', colorCode: '#A52A2A' },
          { value: 'gray', displayValue: 'Gray', colorCode: '#808080' },
          { value: 'navy', displayValue: 'Navy', colorCode: '#000080' }
        ]
      }
    ]
  }
];

// Default filters for categories that don't match any specific rules
const DEFAULT_FILTERS: FilterAssignmentRule = {
  keywords: [],
  filterTypes: [
    {
      name: 'size',
      displayName: 'Size',
      type: 'multiple',
      dataType: 'string',
      description: 'General size options',
      options: [
        { value: 'One Size', displayValue: 'One Size' },
        { value: 'Small', displayValue: 'Small' },
        { value: 'Medium', displayValue: 'Medium' },
        { value: 'Large', displayValue: 'Large' },
        { value: 'Extra Large', displayValue: 'Extra Large' }
      ]
    },
    {
      name: 'color',
      displayName: 'Color',
      type: 'multiple',
      dataType: 'string',
      description: 'Product colors',
      options: [
        { value: 'black', displayValue: 'Black', colorCode: '#000000' },
        { value: 'white', displayValue: 'White', colorCode: '#FFFFFF' },
        { value: 'red', displayValue: 'Red', colorCode: '#FF0000' },
        { value: 'blue', displayValue: 'Blue', colorCode: '#0000FF' },
        { value: 'green', displayValue: 'Green', colorCode: '#008000' }
      ]
    }
  ]
};

/**
 * Automatically assign filters to a category based on its name and context
 */
export const autoAssignFiltersToCategory = async (categoryId: string, adminId?: string): Promise<void> => {
  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Get parent category for context
    let parentCategory = null;
    if (category.parentCategory) {
      parentCategory = await Category.findById(category.parentCategory);
    }

    // Determine which filters to assign based on category name
    const filterRule = getFilterTypesForCategory(category.name, parentCategory?.name);
    
    // Create or find filters and assign them to the category
    for (const filterType of filterRule.filterTypes) {
      // Check if filter already exists
      let filter = await Filter.findOne({ name: filterType.name });
      
      if (!filter) {
        // Create new filter
        filter = await Filter.create({
          name: filterType.name,
          displayName: filterType.displayName,
          type: filterType.type,
          dataType: filterType.dataType,
          description: filterType.description,
          isActive: true,
          sortOrder: 0,
          createdBy: adminId,
          updatedBy: adminId
        });
      }

      // Create filter options
      for (const optionData of filterType.options) {
        const existingOption = await FilterOption.findOne({
          filter: filter._id,
          value: optionData.value
        });

        if (!existingOption) {
          await FilterOption.create({
            filter: filter._id,
            value: optionData.value,
            displayValue: optionData.displayValue,
            colorCode: optionData.colorCode,
            isActive: true,
            sortOrder: 0,
            createdBy: adminId,
            updatedBy: adminId
          });
        }
      }

      // Assign filter to category
      const existingAssignment = await CategoryFilter.findOne({
        category: categoryId,
        filter: filter._id
      });

      if (!existingAssignment) {
        await CategoryFilter.create({
          category: categoryId,
          filter: filter._id,
          isRequired: false,
          isActive: true,
          sortOrder: 0,
          createdBy: adminId,
          updatedBy: adminId
        });
      }
    }
  } catch (error) {
    console.error('Error auto-assigning filters to category:', error);
    throw error;
  }
};

/**
 * Get appropriate filter types for a category based on its name and parent context
 */
export const getFilterTypesForCategory = (categoryName: string, parentCategoryName?: string): FilterAssignmentRule => {
  const contextString = categoryName.toLowerCase() + ' ' + (parentCategoryName?.toLowerCase() || '');
  
  for (const rule of FILTER_ASSIGNMENT_RULES) {
    if (rule.keywords.some(keyword => contextString.includes(keyword))) {
      return rule;
    }
  }
  
  return DEFAULT_FILTERS;
};