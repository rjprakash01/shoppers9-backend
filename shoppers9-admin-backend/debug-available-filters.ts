import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Filter from './src/models/Filter';
import FilterAssignment from './src/models/FilterAssignment';
import Category from './src/models/Category';

dotenv.config();

async function debugAvailableFilters() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9');
    console.log('✅ Connected to MongoDB');

    // Find Men category
    const menCategory = await Category.findOne({ name: 'Men' });
    console.log('\n=== MEN CATEGORY ===');
    console.log('Men category:', menCategory ? `${menCategory.name} (ID: ${menCategory._id}, Level: ${menCategory.level})` : 'Not found');

    if (!menCategory) {
      console.log('❌ Men category not found!');
      return;
    }

    const categoryId = menCategory._id;
    console.log('\n=== DEBUGGING FILTER QUERY ===');
    console.log('🔍 Category ID:', categoryId, 'Type:', typeof categoryId);
    
    // Step 1: Get assigned filter IDs
    const assignedFilterIds = await FilterAssignment.find({ category: categoryId })
      .distinct('filter');
    console.log('🔍 Assigned filter IDs:', assignedFilterIds);
    console.log('🔍 Number of assigned filters:', assignedFilterIds.length);

    // Step 2: Build the query
    const query: any = {
      _id: { $nin: assignedFilterIds },
      isActive: true
    };
    console.log('🔍 Query for available filters:', JSON.stringify(query, null, 2));

    // Step 3: Execute the query
    const availableFilters = await Filter.find(query)
      .sort({ name: 1 })
      .select('name displayName type dataType description categoryLevels');
    
    console.log('\n=== AVAILABLE FILTERS RESULT ===');
    console.log('🔍 Number of available filters:', availableFilters.length);
    console.log('🔍 Available filters:');
    availableFilters.forEach((filter, index) => {
      console.log(`  ${index + 1}. ${filter.name} (${filter.displayName}) - Levels: [${filter.categoryLevels ? filter.categoryLevels.join(', ') : 'none'}]`);
    });

    // Step 4: Check all filters in database
    console.log('\n=== ALL FILTERS IN DATABASE ===');
    const allFilters = await Filter.find({ isActive: true })
      .select('name displayName categoryLevels');
    console.log('🔍 Total active filters in database:', allFilters.length);
    allFilters.forEach((filter, index) => {
      console.log(`  ${index + 1}. ${filter.name} (${filter.displayName}) - Levels: [${filter.categoryLevels ? filter.categoryLevels.join(', ') : 'none'}]`);
    });

    // Step 5: Check if there are any filters that should be excluded
    console.log('\n=== FILTER EXCLUSION ANALYSIS ===');
    const excludedFilters = allFilters.filter(filter => 
      assignedFilterIds.some(assignedId => assignedId.toString() === filter._id.toString())
    );
    console.log('🔍 Filters excluded due to assignment:', excludedFilters.length);
    excludedFilters.forEach(filter => {
      console.log(`  - ${filter.name} (${filter.displayName})`);
    });

    const shouldBeAvailable = allFilters.filter(filter => 
      !assignedFilterIds.some(assignedId => assignedId.toString() === filter._id.toString())
    );
    console.log('🔍 Filters that should be available:', shouldBeAvailable.length);
    
    if (shouldBeAvailable.length !== availableFilters.length) {
      console.log('❌ MISMATCH! Expected', shouldBeAvailable.length, 'but got', availableFilters.length);
      console.log('Missing filters:');
      shouldBeAvailable.forEach(expected => {
        const found = availableFilters.find(available => available._id.toString() === expected._id.toString());
        if (!found) {
          console.log(`  - ${expected.name} (${expected.displayName})`);
        }
      });
    } else {
      console.log('✅ Filter count matches expected');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugAvailableFilters();