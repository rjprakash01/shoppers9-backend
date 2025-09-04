const mongoose = require('mongoose');

// Connect to admin backend MongoDB (might be different port/database)
mongoose.connect('mongodb://localhost:27017/shoppers9-admin');

// Define schemas for admin backend
const CategoryFilter = mongoose.model('CategoryFilter', new mongoose.Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  filter: { type: mongoose.Schema.Types.ObjectId, ref: 'Filter' },
  isRequired: Boolean,
  isActive: Boolean,
  sortOrder: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

const Category = mongoose.model('Category', new mongoose.Schema({
  name: String,
  slug: String,
  level: Number,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}));

const Filter = mongoose.model('Filter', new mongoose.Schema({
  name: String,
  type: String,
  options: [{
    value: String,
    label: String,
    isActive: { type: Boolean, default: true }
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}));

async function checkAdminDatabase() {
  try {
    console.log('=== CHECKING ADMIN BACKEND DATABASE ===\n');
    
    // Check all categories
    const allCategories = await Category.find({}).populate('parent');
    console.log(`📁 Total categories: ${allCategories.length}\n`);
    
    if (allCategories.length > 0) {
      console.log('All categories by level:');
      const categoryLevels = {};
      allCategories.forEach(cat => {
        const level = cat.level || 'undefined';
        if (!categoryLevels[level]) categoryLevels[level] = [];
        categoryLevels[level].push(cat);
      });
      
      Object.keys(categoryLevels).sort().forEach(level => {
        console.log(`\n  Level ${level}:`);
        categoryLevels[level].forEach(cat => {
          const parentName = cat.parent ? cat.parent.name : 'No parent';
          console.log(`    - ${cat.name} (ID: ${cat._id}, Parent: ${parentName})`);
        });
      });
    }
    
    // Check for T-Shirt related categories
    const tshirtCategories = await Category.find({
      $or: [
        { name: /t-shirt/i },
        { name: /tshirt/i },
        { name: /shirt/i }
      ]
    });
    
    console.log(`\n\n👕 T-Shirt related categories: ${tshirtCategories.length}`);
    tshirtCategories.forEach(cat => {
      console.log(`  - ${cat.name} (Level: ${cat.level}, ID: ${cat._id})`);
    });
    
    // Check all filters
    const allFilters = await Filter.find({});
    console.log(`\n\n🔍 Total filters: ${allFilters.length}`);
    
    if (allFilters.length > 0) {
      console.log('\nAll filters:');
      allFilters.forEach(filter => {
        const optionsCount = filter.options ? filter.options.length : 0;
        console.log(`  - ${filter.name} (Type: ${filter.type}, Options: ${optionsCount}, ID: ${filter._id})`);
      });
    }
    
    // Check all filter assignments
    const allAssignments = await CategoryFilter.find({}).populate('category').populate('filter');
    console.log(`\n\n🔗 Total filter assignments: ${allAssignments.length}`);
    
    if (allAssignments.length > 0) {
      console.log('\nFilter assignments:');
      allAssignments.forEach(assignment => {
        const catName = assignment.category?.name || 'Unknown Category';
        const filterName = assignment.filter?.name || 'Unknown Filter';
        console.log(`  - ${catName} -> ${filterName} (Required: ${assignment.isRequired}, Active: ${assignment.isActive})`);
      });
    }
    
    // Specifically check level 3 categories with filters
    const level3Categories = await Category.find({ level: 3 });
    console.log(`\n\n📊 Level 3 categories: ${level3Categories.length}`);
    
    for (const cat of level3Categories) {
      const assignments = await CategoryFilter.find({ category: cat._id }).populate('filter');
      console.log(`\n  ${cat.name} (${assignments.length} filters):`);
      assignments.forEach(assignment => {
        console.log(`    - ${assignment.filter?.name || 'Unknown'} (${assignment.filter?.type || 'Unknown type'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nTrying alternative database name...');
    
    // Try connecting to the main database
    await mongoose.disconnect();
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    
    const categories = await Category.find({});
    console.log(`Found ${categories.length} categories in main database`);
    
  } finally {
    mongoose.connection.close();
  }
}

checkAdminDatabase();