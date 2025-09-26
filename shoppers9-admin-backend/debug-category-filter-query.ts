import mongoose from 'mongoose';
import Filter from './src/models/Filter';
import Category from './src/models/Category';
import CategoryFilter from './src/models/CategoryFilter';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/shoppers9-admin');

async function debugCategoryFilterQuery() {
  try {
    console.log('=== DEBUGGING CATEGORY FILTER QUERY ===');
    
    // Get Men category
    const categoryId = '68bd49495ae9d112cbb249a8';
    const category = await Category.findById(categoryId);
    console.log('🎯 Category:', category ? `${category.name} (level ${category.level})` : 'null');
    
    if (!category) {
      console.log('❌ Category not found');
      return;
    }
    
    // Get already assigned filter IDs using CategoryFilter model
    const assignedFilters = await CategoryFilter.find({ category: categoryId });
    const assignedFilterIds = assignedFilters.map(af => af.filter);
    console.log('🔍 Assigned filter IDs (CategoryFilter):', assignedFilterIds);
    
    // Build query for available filters (this is the query from categoryFilterController)
    const query: any = {
      _id: { $nin: assignedFilterIds },
      isActive: true,
      categoryLevels: { $in: [category.level] } // Only show filters that apply to this category level
    };
    
    console.log('🔍 Query being used:', JSON.stringify(query, null, 2));
    
    // Execute the query
    const availableFilters = await Filter.find(query)
      .sort({ name: 1 })
      .select('name displayName type dataType description categoryLevels');
    
    console.log('🔍 Available filters found:', availableFilters.length);
    availableFilters.forEach((filter, index) => {
      console.log(`  ${index + 1}. ${filter.name} (${filter.displayName}) - Levels: [${filter.categoryLevels ? filter.categoryLevels.join(', ') : 'none'}]`);
    });
    
    // Check all filters to see their categoryLevels
    console.log('\n=== ALL ACTIVE FILTERS ===');
    const allFilters = await Filter.find({ isActive: true })
      .select('name displayName categoryLevels');
    console.log('🔍 Total active filters:', allFilters.length);
    allFilters.forEach((filter, index) => {
      console.log(`  ${index + 1}. ${filter.name} (${filter.displayName}) - Levels: [${filter.categoryLevels ? filter.categoryLevels.join(', ') : 'none'}]`);
    });
    
    // Test the specific query condition
    console.log('\n=== TESTING QUERY CONDITION ===');
    console.log('Category level:', category.level);
    console.log('Looking for filters with categoryLevels containing:', category.level);
    
    const testFilters = await Filter.find({
      isActive: true,
      categoryLevels: { $in: [category.level] }
    }).select('name displayName categoryLevels');
    
    console.log('🔍 Filters matching categoryLevels condition:', testFilters.length);
    testFilters.forEach((filter, index) => {
      console.log(`  ${index + 1}. ${filter.name} (${filter.displayName}) - Levels: [${filter.categoryLevels ? filter.categoryLevels.join(', ') : 'none'}]`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugCategoryFilterQuery();