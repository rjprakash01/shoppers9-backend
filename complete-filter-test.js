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

async function completeFilterTest() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Step 1: Get existing categories
    const categories = await Category.find({ isActive: true });
    console.log(`\nStep 1: Found ${categories.length} categories`);
    
    if (categories.length === 0) {
      console.log('❌ No categories found. Please create categories first.');
      return;
    }

    // Use the first category for testing
    const testCategory = categories[0];
    console.log(`Using category: ${testCategory.name} (${testCategory._id})`);

    // Step 2: Get existing filters
    const filters = await Filter.find();
    console.log(`\nStep 2: Found ${filters.length} filters`);
    
    if (filters.length === 0) {
      console.log('❌ No filters found. Please create filters first.');
      return;
    }

    // Step 3: Get filter options
    const filterOptions = await FilterOption.find({ isActive: true }).populate('filter');
    console.log(`\nStep 3: Found ${filterOptions.length} filter options`);
    
    if (filterOptions.length === 0) {
      console.log('❌ No filter options found. Please create filter options first.');
      return;
    }

    // Step 4: Ensure category-filter associations exist
    console.log('\nStep 4: Checking category-filter associations...');
    for (const filter of filters) {
      const existingAssociation = await CategoryFilter.findOne({
        category: testCategory._id,
        filter: filter._id
      });
      
      if (!existingAssociation) {
        const categoryFilter = new CategoryFilter({
          category: testCategory._id,
          filter: filter._id,
          isRequired: false,
          isActive: true,
          sortOrder: 0
        });
        await categoryFilter.save();
        console.log(`  ✅ Created association: ${testCategory.name} <-> ${filter.name}`);
      } else {
        console.log(`  ✓ Association exists: ${testCategory.name} <-> ${filter.name}`);
      }
    }

    // Step 5: Create sample products with filter values
    console.log('\nStep 5: Creating sample products with filter values...');
    
    // Clear existing products for this category
    await Product.deleteMany({ 
      $or: [
        { category: testCategory._id },
        { subCategory: testCategory._id }
      ]
    });
    
    const sampleProducts = [
      {
        name: 'Premium Smartphone',
        description: 'High-end smartphone with advanced features',
        price: 999,
        category: testCategory._id,
        subCategory: testCategory._id
      },
      {
        name: 'Budget Smartphone',
        description: 'Affordable smartphone for everyday use',
        price: 299,
        category: testCategory._id,
        subCategory: testCategory._id
      },
      {
        name: 'Gaming Smartphone',
        description: 'Smartphone optimized for gaming',
        price: 699,
        category: testCategory._id,
        subCategory: testCategory._id
      }
    ];
    
    for (const productData of sampleProducts) {
      const product = new Product(productData);
      await product.save();
      console.log(`  Created product: ${product.name}`);
      
      // Add filter values to products
      const productFilterValues = [];
      
      // Assign some filter options to each product
      const availableOptions = filterOptions.slice(0, Math.min(3, filterOptions.length));
      
      for (const filterOption of availableOptions) {
        const filterValue = new ProductFilterValue({
          product: product._id,
          filter: filterOption.filter._id,
          filterOption: filterOption._id
        });
        await filterValue.save();
        productFilterValues.push(filterValue._id);
        console.log(`    Added filter: ${filterOption.filter.name} = ${filterOption.displayValue}`);
      }
      
      // Update product with filter values
      product.filterValues = productFilterValues;
      await product.save();
    }

    // Step 6: Test the available-filter-options endpoint logic
    console.log('\nStep 6: Testing available-filter-options logic...');
    
    // Get all products in this category that are active
    const products = await Product.find({
      $or: [
        { category: testCategory._id },
        { subCategory: testCategory._id }
      ],
      isActive: true
    }).populate({
      path: 'filterValues',
      populate: [
        { path: 'filter', select: 'name displayName type' },
        { path: 'filterOption', select: 'value displayValue colorCode' }
      ]
    });

    console.log(`Found ${products.length} products in category`);

    // Get category filters
    const categoryFilters = await CategoryFilter.find({
      category: testCategory._id,
      isActive: true
    })
    .populate('filter')
    .sort({ sortOrder: 1 });

    console.log(`Found ${categoryFilters.length} category filters`);

    // Build available options based on existing products
    const availableOptions = await Promise.all(categoryFilters.map(async categoryFilter => {
      const filter = categoryFilter.filter;
      const usedOptions = new Set();
      const usedCustomValues = new Set();

      // Collect all used filter values from products
      products.forEach(product => {
        if (product.filterValues) {
          product.filterValues.forEach((fv) => {
            if (fv.filter && fv.filter._id.toString() === filter._id.toString()) {
              if (fv.filterOption) {
                usedOptions.add(fv.filterOption._id.toString());
              }
              if (fv.customValue) {
                usedCustomValues.add(fv.customValue);
              }
            }
          });
        }
      });

      // Get all filter options for this filter
      const allFilterOptions = await FilterOption.find({
        filter: filter._id,
        isActive: true
      }).sort({ sortOrder: 1, displayValue: 1 });

      // Filter options to only show those that are actually used
      const availableFilterOptions = allFilterOptions.filter((option) => 
        usedOptions.has(option._id.toString())
      );

      return {
        _id: categoryFilter._id,
        category: categoryFilter.category,
        filter: {
          ...filter.toObject(),
          options: availableFilterOptions
        },
        isRequired: categoryFilter.isRequired,
        isActive: categoryFilter.isActive,
        sortOrder: categoryFilter.sortOrder,
        usedCustomValues: Array.from(usedCustomValues)
      };
    }));

    console.log('\nAvailable filter options result:');
    availableOptions.forEach((categoryFilter, index) => {
      console.log(`\nFilter ${index + 1}: ${categoryFilter.filter.name}`);
      console.log(`  Display Name: ${categoryFilter.filter.displayName}`);
      console.log(`  Available Options: ${categoryFilter.filter.options.length}`);
      
      categoryFilter.filter.options.forEach(option => {
        console.log(`    - ${option.displayValue} (${option.value})`);
      });
      
      if (categoryFilter.usedCustomValues.length > 0) {
        console.log(`  Custom Values: ${categoryFilter.usedCustomValues.join(', ')}`);
      }
    });

    console.log('\n✅ Complete filter test completed successfully!');
    console.log(`\nYou can now test the endpoint: GET /api/admin/products/category/${testCategory._id}/available-filter-options`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

completeFilterTest();