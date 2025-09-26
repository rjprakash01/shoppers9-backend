const mongoose = require('mongoose');
require('dotenv').config();

async function fixFilterStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin');
    console.log('✅ Connected to MongoDB');

    // Define filter schema
    const filterSchema = new mongoose.Schema({
      name: String,
      displayName: String,
      type: String,
      dataType: String,
      status: String
    });

    const Filter = mongoose.model('Filter', filterSchema);

    // Get all filters with undefined status
    const filtersWithUndefinedStatus = await Filter.find({
      $or: [
        { status: { $exists: false } },
        { status: undefined },
        { status: null }
      ]
    });
    
    console.log(`\n📊 Found ${filtersWithUndefinedStatus.length} filters with undefined/null status`);
    
    if (filtersWithUndefinedStatus.length > 0) {
      console.log('\nFilters to update:');
      filtersWithUndefinedStatus.forEach(filter => {
        console.log(`  - ${filter.name} (ID: ${filter._id}, current status: ${filter.status})`);
      });
      
      // Update all filters to have 'active' status
      const updateResult = await Filter.updateMany(
        {
          $or: [
            { status: { $exists: false } },
            { status: undefined },
            { status: null }
          ]
        },
        { $set: { status: 'active' } }
      );
      
      console.log(`\n✅ Updated ${updateResult.modifiedCount} filters to 'active' status`);
      
      // Verify the update
      const activeFilters = await Filter.find({ status: 'active' });
      console.log(`\n📈 Total active filters now: ${activeFilters.length}`);
      
      console.log('\nFirst 5 active filters:');
      activeFilters.slice(0, 5).forEach(filter => {
        console.log(`  - ${filter.name} (${filter.status})`);
      });
    } else {
      console.log('\n✅ All filters already have a defined status');
      
      // Show current status distribution
      const statusCounts = await Filter.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      
      console.log('\nCurrent status distribution:');
      statusCounts.forEach(item => {
        console.log(`  - ${item._id || 'undefined'}: ${item.count}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixFilterStatus();