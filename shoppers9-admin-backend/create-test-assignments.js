const mongoose = require('mongoose');
require('dotenv').config();

// Import models - using require since this is a JS file
const FilterAssignment = require('./dist/models/FilterAssignment').default;
const Category = require('./dist/models/Category').default;
const Filter = require('./dist/models/Filter').default;

async function createTestAssignments() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin');
    console.log('✅ Connected to MongoDB');
    
    // Get some categories and filters
    const categories = await Category.find({ level: { $lte: 2 } }).limit(3);
    const filters = await Filter.find({ isActive: true }).limit(3);
    
    console.log(`📂 Found ${categories.length} categories`);
    console.log(`🔍 Found ${filters.length} filters`);
    
    if (categories.length === 0 || filters.length === 0) {
      console.log('❌ No categories or filters found to create assignments');
      return;
    }
    
    // Create some test assignments
    for (let i = 0; i < Math.min(categories.length, filters.length); i++) {
      const category = categories[i];
      const filter = filters[i];
      
      // Check if assignment already exists
      const existingAssignment = await FilterAssignment.findOne({
        category: category._id,
        filter: filter._id
      });
      
      if (existingAssignment) {
        console.log(`⚠️  Assignment already exists: ${filter.displayName || filter.name} -> ${category.name}`);
        continue;
      }
      
      // Create new assignment
      const assignment = new FilterAssignment({
        category: category._id,
        filter: filter._id,
        categoryLevel: category.level,
        isRequired: false,
        isActive: true,
        sortOrder: i + 1,
        assignedBy: new mongoose.Types.ObjectId(), // Dummy user ID
        assignedAt: new Date()
      });
      
      await assignment.save();
      console.log(`✅ Created assignment: ${filter.displayName || filter.name} -> ${category.name} (Level ${category.level})`);
    }
    
    // Verify assignments
    console.log('\n📊 Verifying assignments...');
    const totalAssignments = await FilterAssignment.countDocuments();
    console.log(`Total assignments in database: ${totalAssignments}`);
    
    const sampleAssignments = await FilterAssignment.find()
      .populate('filter', 'name displayName')
      .populate('category', 'name level')
      .limit(5);
    
    console.log('\n🎯 Sample assignments:');
    sampleAssignments.forEach((assignment, index) => {
      console.log(`  ${index + 1}. ${assignment.filter?.displayName || assignment.filter?.name} -> ${assignment.category?.name} (Level ${assignment.category?.level})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createTestAssignments();