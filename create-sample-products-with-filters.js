const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/shoppers9-admin';

// Define schemas
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  filterValues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductFilterValue' }],
  isActive: { type: Boolean, default: true },
  images: [String],
  stock: { type: Number, default: 100 }
}, { timestamps: true });

const productFilterValueSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  filter: { type: mongoose.Schema.Types.ObjectId, ref: 'Filter' },
  filterOption: { type: mongoose.Schema.Types.ObjectId, ref: 'FilterOption' },
  customValue: String
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  name: String,
  displayName: String,
  level: Number,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const filterSchema = new mongoose.Schema({
  name: String,
  displayName: String
}, { timestamps: true });

const filterOptionSchema = new mongoose.Schema({
  filter: { type: mongoose.Schema.Types.ObjectId, ref: 'Filter' },
  value: String,
  displayValue: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const categoryFilterSchema = new mongoose.Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  filter: { type: mongoose.Schema.Types.ObjectId, ref: 'Filter' },
  isRequired: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
const ProductFilterValue = mongoose.model('ProductFilterValue', productFilterValueSchema);
const Category = mongoose.model('Category', categorySchema);
const Filter = mongoose.model('Filter', filterSchema);
const FilterOption = mongoose.model('FilterOption', filterOptionSchema);
const CategoryFilter = mongoose.model('CategoryFilter', categoryFilterSchema);

async function createSampleProductsWithFilters() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // First, let's see what categories exist
    const categories = await Category.find({ isActive: true });
    console.log(`\nFound ${categories.length} categories:`);
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat._id})`);
    });

    if (categories.length === 0) {
      console.log('\nCreating sample categories...');
      
      // Create main category
      const mainCategory = new Category({
        name: 'electronics',
        displayName: 'Electronics',
        level: 1,
        isActive: true
      });
      await mainCategory.save();
      
      // Create subcategory
      const subCategory = new Category({
        name: 'smartphones',
        displayName: 'Smartphones',
        level: 2,
        parent: mainCategory._id,
        isActive: true
      });
      await subCategory.save();
      
      console.log(`Created categories: ${mainCategory.name} -> ${subCategory.name}`);
      
      // Get filters
      const filters = await Filter.find();
      console.log(`\nFound ${filters.length} filters`);
      
      if (filters.length > 0) {
        // Create category-filter associations
        console.log('\nCreating category-filter associations...');
        for (const filter of filters) {
          const categoryFilter = new CategoryFilter({
            category: subCategory._id,
            filter: filter._id,
            isRequired: false,
            isActive: true,
            sortOrder: 0
          });
          await categoryFilter.save();
          console.log(`  Associated filter '${filter.name}' with category '${subCategory.name}'`);
        }
        
        // Create sample products
        console.log('\nCreating sample products...');
        
        const sampleProducts = [
          {
            name: 'iPhone 15 Pro',
            description: 'Latest iPhone with advanced features',
            price: 999,
            category: mainCategory._id,
            subCategory: subCategory._id
          },
          {
            name: 'Samsung Galaxy S24',
            description: 'Premium Android smartphone',
            price: 899,
            category: mainCategory._id,
            subCategory: subCategory._id
          },
          {
            name: 'Google Pixel 8',
            description: 'Google\'s flagship smartphone',
            price: 699,
            category: mainCategory._id,
            subCategory: subCategory._id
          }
        ];
        
        for (const productData of sampleProducts) {
          const product = new Product(productData);
          await product.save();
          console.log(`  Created product: ${product.name}`);
          
          // Add filter values to products
          const filterOptions = await FilterOption.find().populate('filter');
          const productFilterValues = [];
          
          for (const filterOption of filterOptions) {
            // Randomly assign some filter options to products
            if (Math.random() > 0.5) {
              const filterValue = new ProductFilterValue({
                product: product._id,
                filter: filterOption.filter._id,
                filterOption: filterOption._id
              });
              await filterValue.save();
              productFilterValues.push(filterValue._id);
              console.log(`    Added filter: ${filterOption.filter.name} = ${filterOption.displayValue}`);
            }
          }
          
          // Update product with filter values
          product.filterValues = productFilterValues;
          await product.save();
        }
        
        console.log('\n✅ Sample products with filter values created successfully!');
        console.log(`\nNow you can test the endpoint with category ID: ${subCategory._id}`);
        
      } else {
        console.log('\n❌ No filters found. Please run the create-filter-options.js script first.');
      }
    } else {
      // Use existing category
      const targetCategory = categories[0];
      console.log(`\nUsing existing category: ${targetCategory.name} (${targetCategory._id})`);
      
      // Check if products already exist
      const existingProducts = await Product.find({ 
        $or: [
          { category: targetCategory._id },
          { subCategory: targetCategory._id }
        ]
      });
      
      if (existingProducts.length === 0) {
        console.log('\nNo products found for this category. Creating sample products...');
        // Create products for existing category (similar logic as above)
      } else {
        console.log(`\nFound ${existingProducts.length} existing products for this category.`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

createSampleProductsWithFilters();