const mongoose = require('mongoose');
require('dotenv').config();

async function checkFilterAssignments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Define schemas
    const filterAssignmentSchema = new mongoose.Schema({
      category: mongoose.Schema.Types.ObjectId,
      filter: mongoose.Schema.Types.ObjectId,
      categoryLevel: Number,
      isActive: Boolean
    });
    
    const categorySchema = new mongoose.Schema({
      name: String,
      level: Number,
      parentCategory: mongoose.Schema.Types.ObjectId,
      isActive: Boolean
    });
    
    const filterSchema = new mongoose.Schema({
      name: String,
      displayName: String,
      type: String,
      isActive: Boolean
    });
    
    const FilterAssignment = mongoose.model('FilterAssignment', filterAssignmentSchema);
    const Category = mongoose.model('Category', categorySchema);
    const Filter = mongoose.model('Filter', filterSchema);
    
    console.log('\n🔍 Checking all filter assignments...');
    
    // Get all filter assignments
    const allAssignments = await FilterAssignment.find({});
    console.log(`📊 Total filter assignments: ${allAssignments.length}`);
    
    if (allAssignments.length > 0) {
      console.log('\n📋 Filter assignments:');
      for (const assignment of allAssignments.slice(0, 5)) {
         console.log(`  - Assignment ID: ${assignment._id}`);
         console.log(`    Category ID: ${assignment.category}`);
         console.log(`    Filter ID: ${assignment.filter}`);
         console.log(`    Category Level: ${assignment.categoryLevel}`);
         console.log(`    Active: ${assignment.isActive}`);
         console.log('');
       }
      if (allAssignments.length > 5) {
        console.log(`    ... and ${allAssignments.length - 5} more assignments`);
      }
    }
    
    // Check specifically for Men category
    const menCategoryId = '68bd49495ae9d112cbb249a8';
    const menCategory = await Category.findById(menCategoryId);
    console.log(`\n👤 Men category found: ${menCategory ? menCategory.name : 'Not found'}`);
    
    const menAssignments = await FilterAssignment.find({ category: menCategoryId });
    console.log(`🔗 Men category assignments: ${menAssignments.length}`);
    
    if (menAssignments.length > 0) {
      console.log('\n📋 Men category filter assignments:');
      for (const assignment of menAssignments) {
        const filter = await Filter.findById(assignment.filter);
        console.log(`  - Filter: ${filter?.name || 'Unknown'} (Active: ${assignment.isActive})`);
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Check completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkFilterAssignments();