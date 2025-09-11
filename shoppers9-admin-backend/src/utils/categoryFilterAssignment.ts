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

// Define filter assignment rules based on category names
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
      },
      {
        name: 'material',
        displayName: 'Material',
        type: 'multiple',
        dataType: 'string',
        description: 'Fabric materials',
        options: [
          { value: 'cotton', displayValue: 'Cotton' },
          { value: 'polyester', displayValue: 'Polyester' },
          { value: 'wool', displayValue: 'Wool' },
          { value: 'silk', displayValue: 'Silk' },
          { value: 'linen', displayValue: 'Linen' },
          { value: 'denim', displayValue: 'Denim' },
          { value: 'leather', displayValue: 'Leather' },
          { value: 'synthetic', displayValue: 'Synthetic' }
        ]
      }
    ]
  },
  {
    keywords: ['pant', 'jean', 'trouser', 'short', 'bottom'],
    filterTypes: [
      {
        name: 'waist_size',
        displayName: 'Waist Size',
        type: 'multiple',
        dataType: 'string',
        description: 'Waist measurements in inches',
        options: [
          { value: '28', displayValue: '28 inches' },
          { value: '30', displayValue: '30 inches' },
          { value: '32', displayValue: '32 inches' },
          { value: '34', displayValue: '34 inches' },
          { value: '36', displayValue: '36 inches' },
          { value: '38', displayValue: '38 inches' },
          { value: '40', displayValue: '40 inches' },
          { value: '42', displayValue: '42 inches' },
          { value: '44', displayValue: '44 inches' }
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
          { value: 'blue', displayValue: 'Blue', colorCode: '#0000FF' },
          { value: 'navy', displayValue: 'Navy', colorCode: '#000080' },
          { value: 'gray', displayValue: 'Gray', colorCode: '#808080' },
          { value: 'brown', displayValue: 'Brown', colorCode: '#A52A2A' },
          { value: 'white', displayValue: 'White', colorCode: '#FFFFFF' },
          { value: 'khaki', displayValue: 'Khaki', colorCode: '#F0E68C' }
        ]
      },
      {
        name: 'material',
        displayName: 'Material',
        type: 'multiple',
        dataType: 'string',
        description: 'Fabric materials',
        options: [
          { value: 'denim', displayValue: 'Denim' },
          { value: 'cotton', displayValue: 'Cotton' },
          { value: 'polyester', displayValue: 'Polyester' },
          { value: 'wool', displayValue: 'Wool' },
          { value: 'linen', displayValue: 'Linen' },
          { value: 'synthetic', displayValue: 'Synthetic' }
        ]
      }
    ]
  },
  {
    keywords: ['shoe', 'sandal', 'boot', 'sneaker', 'slipper', 'footwear'],
    filterTypes: [
      {
        name: 'shoe_size',
        displayName: 'Shoe Size',
        type: 'multiple',
        dataType: 'string',
        description: 'Footwear sizes (US sizing with UK equivalents)',
        options: [
          { value: 'US 3', displayValue: 'US 3 (UK 2.5)' },
          { value: 'US 4', displayValue: 'US 4 (UK 3.5)' },
          { value: 'US 5', displayValue: 'US 5 (UK 4.5)' },
          { value: 'US 6', displayValue: 'US 6 (UK 5.5)' },
          { value: 'US 7', displayValue: 'US 7 (UK 6.5)' },
          { value: 'US 8', displayValue: 'US 8 (UK 7.5)' },
          { value: 'US 9', displayValue: 'US 9 (UK 8.5)' },
          { value: 'US 10', displayValue: 'US 10 (UK 9.5)' },
          { value: 'US 11', displayValue: 'US 11 (UK 10.5)' },
          { value: 'US 12', displayValue: 'US 12 (UK 11.5)' },
          { value: 'US 13', displayValue: 'US 13 (UK 12.5)' }
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
          { value: 'brown', displayValue: 'Brown', colorCode: '#A52A2A' },
          { value: 'white', displayValue: 'White', colorCode: '#FFFFFF' },
          { value: 'tan', displayValue: 'Tan', colorCode: '#D2B48C' },
          { value: 'navy', displayValue: 'Navy', colorCode: '#000080' },
          { value: 'red', displayValue: 'Red', colorCode: '#FF0000' },
          { value: 'blue', displayValue: 'Blue', colorCode: '#0000FF' }
        ]
      },
      {
        name: 'material',
        displayName: 'Material',
        type: 'multiple',
        dataType: 'string',
        description: 'Shoe materials',
        options: [
          { value: 'leather', displayValue: 'Leather' },
          { value: 'synthetic', displayValue: 'Synthetic' },
          { value: 'canvas', displayValue: 'Canvas' },
          { value: 'suede', displayValue: 'Suede' },
          { value: 'mesh', displayValue: 'Mesh' },
          { value: 'rubber', displayValue: 'Rubber' }
        ]
      }
    ]
  },
  {
    keywords: ['electronic', 'electronics', 'phone', 'smartphone', 'mobile', 'tablet', 'laptop', 'computer'],
    filterTypes: [
      {
        name: 'storage_capacity',
        displayName: 'Storage Capacity',
        type: 'multiple',
        dataType: 'string',
        description: 'Device storage capacity',
        options: [
          { value: '16GB', displayValue: '16 GB' },
          { value: '32GB', displayValue: '32 GB' },
          { value: '64GB', displayValue: '64 GB' },
          { value: '128GB', displayValue: '128 GB' },
          { value: '256GB', displayValue: '256 GB' },
          { value: '512GB', displayValue: '512 GB' },
          { value: '1TB', displayValue: '1 TB' },
          { value: '2TB', displayValue: '2 TB' }
        ]
      },
      {
        name: 'ram',
        displayName: 'RAM',
        type: 'multiple',
        dataType: 'string',
        description: 'Random Access Memory',
        options: [
          { value: '2GB', displayValue: '2 GB' },
          { value: '4GB', displayValue: '4 GB' },
          { value: '6GB', displayValue: '6 GB' },
          { value: '8GB', displayValue: '8 GB' },
          { value: '12GB', displayValue: '12 GB' },
          { value: '16GB', displayValue: '16 GB' },
          { value: '32GB', displayValue: '32 GB' }
        ]
      },
      {
        name: 'screen_size',
        displayName: 'Screen Size',
        type: 'multiple',
        dataType: 'string',
        description: 'Display screen size in inches',
        options: [
          { value: '4.7"', displayValue: '4.7 inches' },
          { value: '5.5"', displayValue: '5.5 inches' },
          { value: '6.1"', displayValue: '6.1 inches' },
          { value: '6.7"', displayValue: '6.7 inches' },
          { value: '10.9"', displayValue: '10.9 inches' },
          { value: '12.9"', displayValue: '12.9 inches' },
          { value: '13.3"', displayValue: '13.3 inches' },
          { value: '15.6"', displayValue: '15.6 inches' }
        ]
      },
      {
        name: 'brand',
        displayName: 'Brand',
        type: 'multiple',
        dataType: 'string',
        description: 'Device manufacturer',
        options: [
          { value: 'apple', displayValue: 'Apple' },
          { value: 'samsung', displayValue: 'Samsung' },
          { value: 'google', displayValue: 'Google' },
          { value: 'oneplus', displayValue: 'OnePlus' },
          { value: 'xiaomi', displayValue: 'Xiaomi' },
          { value: 'huawei', displayValue: 'Huawei' },
          { value: 'oppo', displayValue: 'OPPO' },
          { value: 'vivo', displayValue: 'Vivo' }
        ]
      },
      {
        name: 'color',
        displayName: 'Color',
        type: 'multiple',
        dataType: 'string',
        description: 'Device colors',
        options: [
          { value: 'black', displayValue: 'Black', colorCode: '#000000' },
          { value: 'white', displayValue: 'White', colorCode: '#FFFFFF' },
          { value: 'silver', displayValue: 'Silver', colorCode: '#C0C0C0' },
          { value: 'gold', displayValue: 'Gold', colorCode: '#FFD700' },
          { value: 'blue', displayValue: 'Blue', colorCode: '#0000FF' },
          { value: 'red', displayValue: 'Red', colorCode: '#FF0000' },
          { value: 'green', displayValue: 'Green', colorCode: '#008000' },
          { value: 'purple', displayValue: 'Purple', colorCode: '#800080' }
        ]
      }
    ]
  },
  {
    keywords: ['household', 'kitchen', 'home', 'appliance', 'container', 'storage'],
    filterTypes: [
      {
        name: 'capacity',
        displayName: 'Capacity',
        type: 'multiple',
        dataType: 'string',
        description: 'Volume and weight measurements',
        options: [
          { value: '100ml', displayValue: '100ml' },
          { value: '250ml', displayValue: '250ml' },
          { value: '500ml', displayValue: '500ml' },
          { value: '1L', displayValue: '1 Liter' },
          { value: '2L', displayValue: '2 Liters' },
          { value: '5L', displayValue: '5 Liters' },
          { value: '10L', displayValue: '10 Liters' },
          { value: '500g', displayValue: '500 grams' },
          { value: '1kg', displayValue: '1 Kilogram' },
          { value: '2kg', displayValue: '2 Kilograms' },
          { value: '5kg', displayValue: '5 Kilograms' },
          { value: '10kg', displayValue: '10 Kilograms' }
        ]
      },
      {
        name: 'size',
        displayName: 'Size',
        type: 'multiple',
        dataType: 'string',
        description: 'General size categories',
        options: [
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
          { value: 'white', displayValue: 'White', colorCode: '#FFFFFF' },
          { value: 'black', displayValue: 'Black', colorCode: '#000000' },
          { value: 'silver', displayValue: 'Silver', colorCode: '#C0C0C0' },
          { value: 'red', displayValue: 'Red', colorCode: '#FF0000' },
          { value: 'blue', displayValue: 'Blue', colorCode: '#0000FF' },
          { value: 'green', displayValue: 'Green', colorCode: '#008000' }
        ]
      }
    ]
  }
];

// Default filters for categories that don't match specific rules
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
 * Automatically assign filters to a category based on its name and hierarchy
 */
export const autoAssignFiltersToCategory = async (categoryId: string, adminId?: string): Promise<void> => {
  try {

    // Get the category with its full hierarchy
    const category = await Category.findById(categoryId).populate('parentCategory');
    if (!category) {
      throw new Error('Category not found');
    }

    // Build category context (include parent category names for better matching)
    const categoryContext = [category.name.toLowerCase()];
    if (category.parentCategory && typeof category.parentCategory === 'object' && 'name' in category.parentCategory) {
      categoryContext.push((category.parentCategory as any).name.toLowerCase());
    }
    
    const contextString = categoryContext.join(' ');

    // Find matching filter rule
    let matchingRule: FilterAssignmentRule | null = null;
    for (const rule of FILTER_ASSIGNMENT_RULES) {
      if (rule.keywords.some(keyword => contextString.includes(keyword))) {
        matchingRule = rule;
        break;
      }
    }

    // Use default filters if no specific rule matches
    if (!matchingRule) {
      matchingRule = DEFAULT_FILTERS;
      
    }

    // Create or find filters and assign them to the category
    for (const filterType of matchingRule.filterTypes) {

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
          sortOrder: 1
        });
      }

      // Create filter options if they don't exist
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
            sortOrder: 1
          });
        }
      }

      // Check if filter is already assigned to this category
      const existingAssignment = await CategoryFilter.findOne({
        category: categoryId,
        filter: filter._id
      });

      if (!existingAssignment) {
        // Assign filter to category
        
        await CategoryFilter.create({
          category: categoryId,
          filter: filter._id,
          isRequired: filterType.name === 'size', // Make size required for most categories
          isActive: true,
          sortOrder: filterType.name === 'size' ? 1 : filterType.name === 'color' ? 2 : 3,
          createdBy: adminId
        });
      } else {
        
      }
    }

  } catch (error) {
    
    throw error;
  }
};

/**
 * Get appropriate filter types for a category based on its name
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