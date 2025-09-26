const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function updateFilterLevels() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin');
    console.log('✅ Connected to MongoDB');
    
    // Define Filter schema
    const filterSchema = new mongoose.Schema({
      name: String,
      displayName: String,
      categoryLevels: [Number],
      isActive: Boolean
    });
    
    const Filter = mongoose.model('Filter', filterSchema);
    
    // Get all filters
    const filters = await Filter.find({});
    console.log(`📊 Found ${filters.length} filters`);
    
    // Check current state
    const filtersWithoutLevels = filters.filter(f => !f.categoryLevels || f.categoryLevels.length === 0);
    console.log(`🔍 Filters without categoryLevels: ${filtersWithoutLevels.length}`);
    
    if (filtersWithoutLevels.length > 0) {
      console.log('\n🔧 Updating filters to support all category levels...');
      
      // Update filters to support all levels (1, 2, 3)
      const updateResult = await Filter.updateMany(
        {
          $or: [
            { categoryLevels: { $exists: false } },
            { categoryLevels: { $size: 0 } }
          ]
        },
        {
          $set: { categoryLevels: [1, 2, 3] }
        }
      );
      
      console.log(`✅ Updated ${updateResult.modifiedCount} filters`);
      
      // Verify the update
      const updatedFilters = await Filter.find({});
      const filtersWithLevels = updatedFilters.filter(f => f.categoryLevels && f.categoryLevels.length > 0);
      console.log(`\n📊 After update:`);
      console.log(`- Total filters: ${updatedFilters.length}`);
      console.log(`- Filters with categoryLevels: ${filtersWithLevels.length}`);
      
      console.log('\n🎯 Sample updated filters:');
      filtersWithLevels.slice(0, 5).forEach(filter => {
        console.log(`- ${filter.name}: levels=${JSON.stringify(filter.categoryLevels)}`);
      });
    } else {
      console.log('✅ All filters already have categoryLevels configured');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

updateFilterLevels();