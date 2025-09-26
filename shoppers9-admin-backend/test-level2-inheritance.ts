import mongoose from 'mongoose';
import Category from './src/models/Category';
import Filter from './src/models/Filter';
import CategoryFilter from './src/models/CategoryFilter';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/shoppers9-admin');

async function testLevel2Inheritance() {
  try {
    console.log('=== TESTING LEVEL 2 CATEGORY FILTER INHERITANCE ===');
    
    // Find Men category (level 1)
    const menCategory = await Category.findOne({ name: 'Men', level: 1 });
    if (!menCategory) {
      console.log('❌ Men category not found');
      return;
    }
    console.log(`✅ Found Men category: ${menCategory.name} (ID: ${menCategory._id}, Level: ${menCategory.level})`);
    
    // Find a level 2 category under Men
    const level2Category = await Category.findOne({ 
      parentCategory: menCategory._id, 
      level: 2 
    });
    
    if (!level2Category) {
      console.log('❌ No level 2 category found under Men');
      
      // List all level 2 categories
      const allLevel2 = await Category.find({ level: 2 }).select('name parentCategory level');
      console.log('\n📋 All level 2 categories:');
      for (const cat of allLevel2) {
        const parent = await Category.findById(cat.parentCategory).select('name');
        console.log(`  - ${cat.name} (Parent: ${parent?.name || 'Unknown'})`);
      }
      return;
    }
    
    console.log(`✅ Found level 2 category: ${level2Category.name} (ID: ${level2Category._id}, Level: ${level2Category.level})`);
    
    // Test the available filters query for level 2 category
    console.log('\n=== TESTING AVAILABLE FILTERS FOR LEVEL 2 CATEGORY ===');
    
    // Get assigned filters for this category
    const assignedFilters = await CategoryFilter.find({ 
      category: level2Category._id 
    });
    
    console.log(`🔍 Assigned filters for ${level2Category.name}: ${assignedFilters.length}`);
    
    // Get filter details for assigned filters
    const assignedFilterIds = assignedFilters.map(cf => cf.filter);
    const assignedFilterDetails = await Filter.find({ 
      _id: { $in: assignedFilterIds } 
    }).select('name displayName');
    
    assignedFilterDetails.forEach((filter, index) => {
      console.log(`  ${index + 1}. ${filter.name} (${filter.displayName})`);
    });
    
    const availableFilters = await Filter.find({
      isActive: true,
      _id: { $nin: assignedFilterIds },
      categoryLevels: { $in: [level2Category.level] }
    }).select('name displayName categoryLevels');
    
    console.log(`\n🎯 Available filters for ${level2Category.name} (Level ${level2Category.level}): ${availableFilters.length}`);
    availableFilters.forEach((filter, index) => {
      console.log(`  ${index + 1}. ${filter.name} (${filter.displayName}) - Levels: [${filter.categoryLevels.join(', ')}]`);
    });
    
    // Test inheritance logic - check if level 2 can access level 1 filters
    console.log('\n=== TESTING INHERITANCE LOGIC ===');
    
    const inheritedFilters = await Filter.find({
      isActive: true,
      _id: { $nin: assignedFilterIds },
      categoryLevels: { $in: [1, level2Category.level] } // Should include both level 1 and level 2
    }).select('name displayName categoryLevels');
    
    console.log(`🔄 Filters available with inheritance (Level 1 + ${level2Category.level}): ${inheritedFilters.length}`);
    inheritedFilters.forEach((filter, index) => {
      console.log(`  ${index + 1}. ${filter.name} (${filter.displayName}) - Levels: [${filter.categoryLevels.join(', ')}]`);
    });
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`📊 Category: ${level2Category.name} (Level ${level2Category.level})`);
    console.log(`📊 Assigned filters: ${assignedFilters.length}`);
    console.log(`📊 Available filters (level-specific): ${availableFilters.length}`);
    console.log(`📊 Available filters (with inheritance): ${inheritedFilters.length}`);
    
    if (inheritedFilters.length >= 15) {
      console.log('✅ SUCCESS: Level 2 category has access to sufficient filters!');
    } else {
      console.log('⚠️  WARNING: Level 2 category may not have enough available filters');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testLevel2Inheritance();