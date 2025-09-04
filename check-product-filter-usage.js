const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/shoppers9-admin';

// Define schemas
const productSchema = new mongoose.Schema({
  name: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  filterValues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductFilterValue' }],
  isActive: Boolean
}, { timestamps: true });

const productFilterValueSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  filter: { type: mongoose.Schema.Types.ObjectId, ref: 'Filter' },
  filterOption: { type: mongoose.Schema.Types.ObjectId, ref: 'FilterOption' },
  customValue: String
}, { timestamps: true });

const filterSchema = new mongoose.Schema({
  name: String,
  displayName: String
}, { timestamps: true });

const filterOptionSchema = new mongoose.Schema({
  filter: { type: mongoose.Schema.Types.ObjectId, ref: 'Filter' },
  value: String,
  displayValue: String
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  name: String,
  displayName: String
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
const ProductFilterValue = mongoose.model('ProductFilterValue', productFilterValueSchema);
const Filter = mongoose.model('Filter', filterSchema);
const FilterOption = mongoose.model('FilterOption', filterOptionSchema);
const Category = mongoose.model('Category', categorySchema);

async function checkProductFilterUsage() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check the specific category
    const categoryId = '676d85d3ad0ebd2037c0d442';
    const category = await Category.findById(categoryId);
    console.log('\nCategory:', category ? category.name : 'Not found');

    // Get products in this category
    const products = await Product.find({
      $or: [
        { category: categoryId },
        { subCategory: categoryId }
      ],
      isActive: true
    });
    
    console.log(`\nFound ${products.length} active products in this category`);
    
    if (products.length === 0) {
      console.log('\n❌ No active products found in this category!');
      console.log('This is why the available-filter-options endpoint returns empty options.');
      console.log('The endpoint only shows filter options that are actually used by products.');
      
      // Let's check if there are any products at all
      const allProducts = await Product.find({ isActive: true });
      console.log(`\nTotal active products in database: ${allProducts.length}`);
      
      if (allProducts.length > 0) {
        console.log('\nSample products:');
        for (let i = 0; i < Math.min(5, allProducts.length); i++) {
          const product = allProducts[i];
          const cat = await Category.findById(product.category || product.subCategory);
          console.log(`  - ${product.name} (Category: ${cat ? cat.name : 'Unknown'})`);
        }
      }
    } else {
      // Check filter values for these products
      const productIds = products.map(p => p._id);
      const filterValues = await ProductFilterValue.find({
        product: { $in: productIds }
      }).populate('filter').populate('filterOption');
      
      console.log(`\nFound ${filterValues.length} filter values for these products`);
      
      if (filterValues.length === 0) {
        console.log('\n❌ No filter values assigned to products in this category!');
        console.log('This is why the available-filter-options endpoint returns empty options.');
      } else {
        console.log('\nFilter values:');
        filterValues.forEach(fv => {
          console.log(`  - Filter: ${fv.filter.name}, Option: ${fv.filterOption ? fv.filterOption.displayValue : fv.customValue}`);
        });
      }
    }
    
    // Check all filter options we created
    const allFilterOptions = await FilterOption.find().populate('filter');
    console.log(`\n\nTotal filter options in database: ${allFilterOptions.length}`);
    
    const filterGroups = {};
    allFilterOptions.forEach(option => {
      const filterName = option.filter.name;
      if (!filterGroups[filterName]) {
        filterGroups[filterName] = [];
      }
      filterGroups[filterName].push(option.displayValue);
    });
    
    console.log('\nFilter options by filter:');
    Object.keys(filterGroups).forEach(filterName => {
      console.log(`  ${filterName}: ${filterGroups[filterName].length} options`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkProductFilterUsage();