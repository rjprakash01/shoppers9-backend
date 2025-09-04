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
  level: Number
}));

async function listCategoriesAndFilters() {
  try {
    console.log('=== ALL CATEGORIES ===\n');
    
    // Find all categories
    const categories = await Category.find({}).sort({ level: 1, name: 1 });
    
    console.log(`Total categories: ${categories.length}\n`);
    
    categories.forEach(cat => {
      console.log(`Level ${cat.level}: ${cat.name} (ID: ${cat._id})`);
    });
    
    console.log('\n=== CATEGORIES WITH FILTERS ===\n');
    
    // Find all filter assignments
    const assignments = await CategoryFilter.find({}).populate('category').populate('filter');
    
    if (assignments.length === 0) {
      console.log('❌ No filter assignments found');
    } else {
      console.log(`Total filter assignments: ${assignments.length}\n`);
      
      const categoryGroups = {};
      assignments.forEach(assignment => {
        const catName = assignment.category.name;
        if (!categoryGroups[catName]) {
          categoryGroups[catName] = [];
        }
        categoryGroups[catName].push(assignment);
      });
      
      Object.keys(categoryGroups).forEach(catName => {
        console.log(`📁 ${catName}:`);
        categoryGroups[catName].forEach(assignment => {
          console.log(`  - ${assignment.filter.name} (${assignment.filter.type}) - Required: ${assignment.isRequired}, Active: ${assignment.isActive}`);
        });
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

listCategoriesAndFilters();