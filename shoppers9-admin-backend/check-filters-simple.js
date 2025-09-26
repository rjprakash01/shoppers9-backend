const mongoose = require('mongoose');
require('dotenv').config();

// Simple filter schema for checking
const filterSchema = new mongoose.Schema({
  name: String,
  displayName: String,
  type: String,
  isActive: Boolean,
  categoryLevels: [Number]
});

const Filter = mongoose.model('Filter', filterSchema);

async function checkFilters() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const filters = await Filter.find({});
    console.log('\n=== FILTERS IN DATABASE ===');
    console.log('Total filters:', filters.length);
    
    if (filters.length > 0) {
      filters.forEach((filter, index) => {
        console.log(`${index + 1}. ${filter.name} (${filter.displayName})`);
        console.log(`   Type: ${filter.type}, Active: ${filter.isActive}`);
        console.log(`   Category Levels: ${filter.categoryLevels}`);
        console.log('');
      });
    } else {
      console.log('No filters found in database!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkFilters();