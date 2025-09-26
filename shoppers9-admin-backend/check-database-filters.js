const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

// Define Filter schema (simplified)
const filterSchema = new mongoose.Schema({
  name: String,
  displayName: String,
  type: String,
  dataType: String,
  description: String,
  isActive: { type: Boolean, default: true }
});

const Filter = mongoose.model('Filter', filterSchema);

// Define Category schema (simplified)
const categorySchema = new mongoose.Schema({
  name: String,
  level: Number,
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
});

const Category = mongoose.model('Category', categorySchema);

const checkFiltersAndCategories = async () => {
  try {
    await connectDB();
    
    console.log('\n=== CHECKING FILTERS ===');
    const filters = await Filter.find({});
    console.log(`Total filters found: ${filters.length}`);
    
    if (filters.length > 0) {
      console.log('\nFilters:');
      filters.forEach((filter, index) => {
        console.log(`${index + 1}. ${filter.name} (${filter.displayName}) - Type: ${filter.type}, Active: ${filter.isActive}`);
      });
    } else {
      console.log('❌ No filters found in database!');
    }
    
    console.log('\n=== CHECKING CATEGORIES ===');
    const categories = await Category.find({}).sort({ level: 1 });
    console.log(`Total categories found: ${categories.length}`);
    
    if (categories.length > 0) {
      console.log('\nCategories:');
      categories.forEach((category, index) => {
        console.log(`${index + 1}. ${category.name} - Level: ${category.level}, ID: ${category._id}`);
      });
    } else {
      console.log('❌ No categories found in database!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkFiltersAndCategories();