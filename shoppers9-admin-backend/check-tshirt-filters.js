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
  slug: String
}));

const Filter = mongoose.model('Filter', new mongoose.Schema({
  name: String,
  type: String
}));

async function checkTShirtFilters() {
  try {
    console.log('=== CHECKING T-SHIRTS FILTER ASSIGNMENTS ===\n');
    
    // Find T-Shirts category
    const tshirtCategory = await Category.findOne({ name: 'T-Shirts' });
    if (!tshirtCategory) {
      console.log('❌ T-Shirts category not found');
      return;
    }
    
    console.log(`✅ Found T-Shirts category: ${tshirtCategory.name} (ID: ${tshirtCategory._id})\n`);
    
    // Find filter assignments
    const assignments = await CategoryFilter.find({ 
      category: tshirtCategory._id,
      isActive: true 
    }).populate('filter');
    
    console.log(`📊 Total active filter assignments: ${assignments.length}\n`);
    
    if (assignments.length === 0) {
      console.log('❌ No filters are assigned to T-Shirts category');
    } else {
      console.log('🎯 Assigned filters:');
      assignments.forEach((assignment, index) => {
        console.log(`  ${index + 1}. ${assignment.filter.name}`);
        console.log(`     Type: ${assignment.filter.type}`);
        console.log(`     Required: ${assignment.isRequired ? 'Yes' : 'No'}`);
        console.log(`     Sort Order: ${assignment.sortOrder}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

checkTShirtFilters();