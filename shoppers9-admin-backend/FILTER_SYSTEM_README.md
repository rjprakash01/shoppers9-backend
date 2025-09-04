# Filter System Implementation

This document provides a comprehensive guide to the Category, Filters & Product Management system implemented according to the PRD requirements.

## Overview

The filter system allows admins to:
- Create and manage dynamic filters for different product categories
- Assign filters to specific subcategories (level 2) and sub-subcategories (level 3 categories)
- Set filter values for products based on their category
- Enable customers to search and filter products effectively

## Database Schema

### Models Created

1. **Filter** (`src/models/Filter.ts`)
   - Master filter definitions
   - Fields: name, displayName, type, dataType, description, isActive, sortOrder

2. **FilterOption** (`src/models/FilterOption.ts`)
   - Predefined values for each filter
   - Fields: filter, value, displayValue, colorCode, isActive, sortOrder

3. **CategoryFilter** (`src/models/CategoryFilter.ts`)
   - Maps filters to sub-subcategories
   - Fields: category, filter, isRequired, isActive, sortOrder

4. **ProductFilterValue** (`src/models/ProductFilterValue.ts`)
   - Stores selected filter values for each product
   - Fields: product, filter, filterOption, customValue, isActive

### Updated Models

1. **Product** (`src/models/Product.ts`)
   - Updated category and subCategory to reference Category ObjectIds
   - Added virtual for filterValues

2. **Types** (`src/types/index.ts`)
   - Added interfaces for all filter-related models
   - Updated IProduct interface

## API Endpoints

### Filter Management

#### Filters
- `GET /api/admin/filters` - Get all filters with pagination and search
- `GET /api/admin/filters/:id` - Get filter by ID with options
- `POST /api/admin/filters` - Create new filter
- `PUT /api/admin/filters/:id` - Update filter
- `DELETE /api/admin/filters/:id` - Delete filter
- `PUT /api/admin/filters/:id/toggle-status` - Toggle filter status

#### Filter Options
- `GET /api/admin/filters/:filterId/options` - Get options for a filter
- `POST /api/admin/filters/:filterId/options` - Create filter option
- `POST /api/admin/filters/:filterId/options/bulk` - Bulk create filter options
- `GET /api/admin/filters/options/:id` - Get filter option by ID
- `PUT /api/admin/filters/options/:id` - Update filter option
- `DELETE /api/admin/filters/options/:id` - Delete filter option
- `PUT /api/admin/filters/options/:id/toggle-status` - Toggle option status

### Category Filter Assignment

- `GET /api/admin/categories/:categoryId/filters` - Get filters assigned to category
- `POST /api/admin/categories/:categoryId/filters` - Assign filter to category
- `POST /api/admin/categories/:categoryId/filters/bulk` - Bulk assign filters
- `GET /api/admin/categories/:categoryId/available-filters` - Get unassigned filters
- `PUT /api/admin/category-filters/:id` - Update category filter assignment
- `DELETE /api/admin/category-filters/:id` - Remove filter from category

### Product Filter Values

- `GET /api/admin/products/:productId/filter-values` - Get product filter values
- `POST /api/admin/products/:productId/filter-values` - Set product filter values
- `GET /api/admin/products/:productId/available-filters` - Get available filters for product
- `PUT /api/admin/product-filter-values/:id` - Update product filter value
- `DELETE /api/admin/product-filter-values/:id` - Delete product filter value

## Predefined Filters

The system comes with 28 predefined filters and 196 filter options covering:

### Clothing Filters
- **Size**: XS, S, M, L, XL, XXL, 3XL, 4XL
- **Waist Size**: 28", 30", 32", 34", 36", 38", 40", 42"
- **Color**: 16 colors including Black, White, Blue, Red, etc. (with color codes)
- **Fit**: Slim Fit, Regular Fit, Relaxed Fit, Oversized, Skinny, Tapered, Loose
- **Fabric**: Cotton, Linen, Polyester, Rayon, Silk, Denim, Wool, etc.
- **Sleeve Type**: Full Sleeve, Half Sleeve, Sleeveless, 3/4th Sleeve
- **Neck Type**: Round Neck, V-Neck, Polo Collar, Mandarin Collar, etc.
- **Pattern**: Solid, Striped, Checked, Printed, Embroidered, etc.
- **Occasion**: Casual, Formal, Party, Ethnic, Sportswear, etc.
- **Wash Care**: Machine Wash, Hand Wash, Dry Clean Only
- **Length**: Short, Regular, Long, Knee Length, Ankle Length, Floor Length
- **Rise Type**: Low Rise, Mid Rise, High Rise
- **Style**: Anarkali, Straight, A-Line, Indo-Western, Traditional, etc.
- **Work/Embroidery**: Printed, Embroidered, Handloom, Zari, Sequins, Beads

### Footwear Filters
- **Shoe Size (Men)**: UK 6-12
- **Shoe Size (Women)**: UK 3-9
- **Shoe Type**: Sneakers, Running Shoes, Loafers, Formal Shoes, etc.
- **Sole Type**: Rubber, EVA, Leather Sole, Air Cushion
- **Closure**: Zipper, Buttons, Lace-Up, Slip-On, Velcro, Buckle

### General Filters
- **Material**: Leather, Synthetic, Mesh, Canvas, Wood, Glass, etc.
- **Gender**: Men, Women, Unisex, Kids
- **Accessory Type**: Handbag, Backpack, Wallet, Belt, Watch, etc.
- **Furniture Type**: Chair, Table, Bed, Sofa, Storage Unit
- **Dimensions**: Small, Medium, Large
- **Color Finish**: Natural Wood, Dark Brown, Black, White
- **Kitchenware Type**: Cookware, Dinnerware, Storage, Appliances
- **Capacity**: 500ml, 1L, 2L, 5L+
- **Price Range**: ₹0-500, ₹500-1000, ₹1000-5000, ₹5000+

## Usage Examples

### 1. Creating a Filter

```bash
POST /api/admin/filters
{
  "name": "brand",
  "displayName": "Brand",
  "type": "single",
  "dataType": "string",
  "description": "Product brand"
}
```

### 2. Adding Filter Options

```bash
POST /api/admin/filters/:filterId/options/bulk
{
  "options": [
    { "value": "nike", "displayValue": "Nike" },
    { "value": "adidas", "displayValue": "Adidas" },
    { "value": "puma", "displayValue": "Puma" }
  ]
}
```

### 3. Assigning Filters to Category

```bash
POST /api/admin/categories/:categoryId/filters/bulk
{
  "filters": [
    { "filterId": "filter_id_1", "isRequired": true, "sortOrder": 0 },
    { "filterId": "filter_id_2", "isRequired": false, "sortOrder": 1 }
  ]
}
```

### 4. Setting Product Filter Values

```bash
POST /api/admin/products/:productId/filter-values
{
  "filterValues": [
    { "filterId": "size_filter_id", "filterOptionId": "size_m_option_id" },
    { "filterId": "color_filter_id", "filterOptionId": "color_blue_option_id" },
    { "filterId": "custom_filter_id", "customValue": "Custom Value" }
  ]
}
```

## Key Features

### 1. Dynamic Filter Assignment
- Filters can only be assigned to subcategories (level 2) and sub-subcategories (level 3)
- Each category can have different sets of filters
- Filters can be marked as required or optional

### 2. Flexible Filter Values
- Products can use predefined filter options
- Products can have custom values for filters
- Filter values are validated against category assignments

### 3. Data Integrity
- Prevents deletion of filters/options in use
- Validates filter assignments before creation
- Ensures required filters are provided for products

### 4. Performance Optimizations
- Proper indexing on all models
- Efficient queries with population
- Pagination support for large datasets

## Seeding Data

To populate the database with predefined filters:

```bash
npm run seed:filters
```

This will create all 28 filters and 196 filter options as specified in the PRD.

## Admin Panel Integration

The API endpoints are designed to support:
- Tree view navigation for categories
- Dynamic filter assignment interface
- Product form with category-specific filters
- Bulk operations for efficiency
- Search and pagination for large datasets

## Next Steps

1. **Frontend Implementation**: Create admin panel UI components
2. **Customer Filtering**: Implement customer-facing filter APIs
3. **Search Integration**: Add filter-based product search
4. **Analytics**: Track filter usage and performance
5. **Bulk Operations**: Add more bulk management features

## Error Handling

All endpoints include comprehensive error handling:
- Validation errors for invalid data
- Not found errors for missing resources
- Conflict errors for duplicate assignments
- Dependency errors for deletion attempts

## Security

- All endpoints require admin authentication
- Input validation and sanitization
- Proper error messages without sensitive data exposure
- Audit trail with createdBy/updatedBy tracking

This filter system provides a robust foundation for the Category, Filters & Product Management module as specified in the PRD.