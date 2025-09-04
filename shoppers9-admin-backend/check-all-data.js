const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/shoppers9');

// Define schemas
const CategoryFilter = mongoose.model('CategoryFilter', new mongoose.Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  filter: { type: mongoose.Schema.Types.ObjectId, ref: 'Filter' },
  isRequired: Boolean,
  isActive: Boolean,
  sortOrder: Number
}));

const Category = mongoose.model('Category', new mongoose.Schema({
  name: String,
  slug: String,
  level: Number,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
}));

const Filter = mongoose.model('Filter', new mongoose.Schema({
  name: String,
  type: String,
  options: [{
    value: String,
    label: String,
    isActive: Boolean
  }]
}));

async function checkAllData() {
  try {
    console.log('=== COMPLETE DATABASE CHECK ===\n');
    
    // Check all categories
    const allCategories = await Category.find({});
    console.log(`📁 Total categories: ${allCategories.length}`);
    
    if (allCategories.length > 0) {
      console.log('\nAll categories:');
      allCategories.forEach(cat => {
        console.log(`  - ${cat.name} (Level: ${cat.level || 'undefined'}, ID: ${cat._id})`);
      });
    }
    
    // Check for T-Shirts specifically
    const tshirtVariations = await Category.find({
      $or: [
        { name: /t-shirt/i },
        { name: /tshirt/i },
        { name: /shirt/i }
      ]
    });
    
    console.log(`\n👕 T-Shirt related categories: ${tshirtVariations.length}`);
    tshirtVariations.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat._id})`);
    });
    
    // Check all filters
    const allFilters = await Filter.find({});
    console.log(`\n🔍 Total filters: ${allFilters.length}`);
    
    if (allFilters.length > 0) {
      console.log('\nAll filters:');
      allFilters.forEach(filter => {
        console.log(`  - ${filter.name} (Type: ${filter.type}, ID: ${filter._id})`);
      });
    }
    
    // Check all filter assignments
    const allAssignments = await CategoryFilter.find({});
    console.log(`\n🔗 Total filter assignments: ${allAssignments.length}`);
    
    if (allAssignments.length > 0) {
      console.log('\nAll assignments:');
      const populatedAssignments = await CategoryFilter.find({}).populate('category').populate('filter');
      populatedAssignments.forEach(assignment => {
        console.log(`  - ${assignment.category?.name || 'Unknown'} -> ${assignment.filter?.name || 'Unknown'} (Required: ${assignment.isRequired})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

checkAllData();