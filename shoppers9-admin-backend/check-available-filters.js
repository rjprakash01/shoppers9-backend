const mongoose = require('mongoose');
require('dotenv').config();

async function checkAvailableFilters() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin');
    console.log('✅ Connected to MongoDB');

    // Define schemas directly (simplified approach)
    const filterSchema = new mongoose.Schema({
      name: String,
      displayName: String,
      type: String,
      dataType: String,
      status: String
    });
    
    const categorySchema = new mongoose.Schema({
      name: String,
      level: Number,
      parentCategory: mongoose.Schema.Types.ObjectId
    });
    
    const filterAssignmentSchema = new mongoose.Schema({
      categoryId: mongoose.Schema.Types.ObjectId,
      filterId: mongoose.Schema.Types.ObjectId
    });

    const Filter = mongoose.model('Filter', filterSchema);
    const Category = mongoose.model('Category', categorySchema);
    const FilterAssignment = mongoose.model('FilterAssignment', filterAssignmentSchema);

    // Get all filters
    const allFilters = await Filter.find({}).select('_id name type status');
    console.log('\n📊 Total filters in database:', allFilters.length);
    console.log('Active filters:', allFilters.filter(f => f.status === 'active').length);
    
    if (allFilters.length > 0) {
      console.log('\nFirst 5 filters:');
      allFilters.slice(0, 5).forEach(filter => {
        console.log(`  - ${filter.name} (${filter.type}, ${filter.status})`);
      });
    }
    
    // Get all categories
    const allCategories = await Category.find({}).select('_id name level parentCategory');
    console.log('\n📂 Total categories:', allCategories.length);
    
    // Find level 1 categories
    const level1Categories = allCategories.filter(cat => cat.level === 1);
    console.log('Level 1 categories:', level1Categories.length);
    level1Categories.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat._id})`);
    });

    // Check filter assignments for level 1 categories
    console.log('\n🔗 Filter assignments for level 1 categories:');
    for (const category of level1Categories) {
      const assignments = await FilterAssignment.find({ categoryId: category._id });
      console.log(`\n${category.name} (${category._id}):`);
      console.log(`  Assigned filters: ${assignments.length}`);
      
      if (assignments.length > 0) {
        for (const assignment of assignments) {
          const filter = await Filter.findById(assignment.filterId);
          console.log(`    - ${filter ? filter.name : 'Unknown'} (${assignment.filterId})`);
        }
      }
    }

    // Check what filters should be available for a specific level 1 category
    if (level1Categories.length > 0) {
      const testCategory = level1Categories[0];
      console.log(`\n🧪 Testing available filters for "${testCategory.name}":`);
      
      // Get assigned filter IDs
      const assignedFilters = await FilterAssignment.find({ categoryId: testCategory._id });
      const assignedFilterIds = assignedFilters.map(af => af.filterId.toString());
      
      // Get available filters (not assigned to this category)
      const availableFilters = await Filter.find({
        _id: { $nin: assignedFilterIds },
        status: 'active'
      });
      
      console.log(`  Assigned: ${assignedFilterIds.length}`);
      console.log(`  Available: ${availableFilters.length}`);
      
      if (availableFilters.length > 0) {
        console.log('  Available filters:');
        availableFilters.slice(0, 5).forEach(filter => {
          console.log(`    - ${filter.name} (${filter._id})`);
        });
        if (availableFilters.length > 5) {
          console.log(`    ... and ${availableFilters.length - 5} more`);
        }
      } else {
        console.log('  ❌ No available filters found!');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAvailableFilters();