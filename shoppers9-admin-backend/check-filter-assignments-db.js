const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const FilterAssignment = require('./src/models/FilterAssignment').default;
const Category = require('./src/models/Category').default;
const Filter = require('./src/models/Filter').default;

async function checkFilterAssignments() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin');
    console.log('✅ Connected to MongoDB');
    
    // Check total filter assignments
    const totalAssignments = await FilterAssignment.countDocuments();
    console.log(`📊 Total filter assignments in database: ${totalAssignments}`);
    
    if (totalAssignments > 0) {
      console.log('\n🔍 Sample filter assignments:');
      const sampleAssignments = await FilterAssignment.find()
        .populate('filter', 'name displayName')
        .populate('category', 'name level')
        .limit(10);
      
      sampleAssignments.forEach((assignment, index) => {
        console.log(`  ${index + 1}. Category: ${assignment.category?.name} (Level ${assignment.category?.level})`);
        console.log(`     Filter: ${assignment.filter?.displayName || assignment.filter?.name}`);
        console.log(`     Required: ${assignment.isRequired}, Active: ${assignment.isActive}`);
        console.log(`     Assignment ID: ${assignment._id}`);
        console.log('');
      });
    }
    
    // Check assignments by category level
    console.log('\n📈 Assignments by category level:');
    for (let level = 1; level <= 3; level++) {
      const levelAssignments = await FilterAssignment.find({ categoryLevel: level });
      console.log(`  Level ${level}: ${levelAssignments.length} assignments`);
    }
    
    // Check specific categories
    console.log('\n🎯 Checking specific categories:');
    const categories = await Category.find({ level: { $lte: 2 } }).limit(5);
    
    for (const category of categories) {
      const assignments = await FilterAssignment.find({ category: category._id })
        .populate('filter', 'name displayName');
      
      console.log(`\n📂 ${category.name} (Level ${category.level}):`);
      console.log(`   Category ID: ${category._id}`);
      console.log(`   Assignments: ${assignments.length}`);
      
      if (assignments.length > 0) {
        assignments.forEach((assignment, index) => {
          console.log(`     ${index + 1}. ${assignment.filter?.displayName || assignment.filter?.name}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkFilterAssignments();