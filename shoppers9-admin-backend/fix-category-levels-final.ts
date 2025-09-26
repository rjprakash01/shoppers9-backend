import mongoose from 'mongoose';
import Filter from './src/models/Filter';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/shoppers9-admin');

async function fixCategoryLevels() {
  try {
    console.log('=== FIXING CATEGORY LEVELS FOR ALL FILTERS ===');
    
    // Update all active filters to include level 1 in their categoryLevels
    const result = await Filter.updateMany(
      { isActive: true },
      { $set: { categoryLevels: [1, 2, 3] } }
    );
    
    console.log('✅ Updated filters:', result.modifiedCount);
    
    // Verify the update
    const updatedFilters = await Filter.find({ isActive: true })
      .select('name displayName categoryLevels');
    
    console.log('\n=== VERIFICATION ===');
    console.log('🔍 Total active filters:', updatedFilters.length);
    updatedFilters.forEach((filter, index) => {
      console.log(`  ${index + 1}. ${filter.name} (${filter.displayName}) - Levels: [${filter.categoryLevels ? filter.categoryLevels.join(', ') : 'none'}]`);
    });
    
    // Test the query that was failing
    console.log('\n=== TESTING LEVEL 1 QUERY ===');
    const level1Filters = await Filter.find({
      isActive: true,
      categoryLevels: { $in: [1] }
    }).select('name displayName categoryLevels');
    
    console.log('🔍 Filters available for level 1 categories:', level1Filters.length);
    level1Filters.forEach((filter, index) => {
      console.log(`  ${index + 1}. ${filter.name} (${filter.displayName}) - Levels: [${filter.categoryLevels ? filter.categoryLevels.join(', ') : 'none'}]`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixCategoryLevels();