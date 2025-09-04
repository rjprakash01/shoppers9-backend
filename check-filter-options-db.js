/**
 * Database Check Script for Filter Options
 * This script can be run in the backend to check if filter options exist in the database
 */

const mongoose = require('mongoose');

// Filter Option Schema (simplified)
const filterOptionSchema = new mongoose.Schema({
  filter: { type: mongoose.Schema.Types.ObjectId, ref: 'Filter', required: true },
  value: { type: String, required: true },
  displayValue: { type: String, required: true },
  colorCode: String,
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
});

const FilterOption = mongoose.model('FilterOption', filterOptionSchema);

// Filter Schema (simplified)
const filterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  type: { type: String, enum: ['single', 'multiple'], required: true },
  dataType: { type: String, enum: ['string', 'number', 'boolean'], required: true },
  isActive: { type: Boolean, default: true }
});

const Filter = mongoose.model('Filter', filterSchema);

async function checkFilterOptions() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    console.log('✅ Connected to MongoDB');
    
    // Get all filters
    const filters = await Filter.find({});
    console.log(`\n📋 Found ${filters.length} filters:`);
    
    for (const filter of filters) {
      console.log(`\n🔍 Filter: ${filter.displayName} (${filter.name})`);
      console.log(`   ID: ${filter._id}`);
      console.log(`   Type: ${filter.type}, Data Type: ${filter.dataType}`);
      console.log(`   Active: ${filter.isActive}`);
      
      // Get filter options for this filter
      const options = await FilterOption.find({ filter: filter._id }).sort({ sortOrder: 1, displayValue: 1 });
      console.log(`   📊 Filter Options: ${options.length}`);
      
      if (options.length > 0) {
        options.forEach((option, index) => {
          console.log(`      ${index + 1}. ${option.displayValue} (${option.value})`);
          console.log(`         Color: ${option.colorCode || 'None'}, Active: ${option.isActive}, Sort: ${option.sortOrder}`);
        });
      } else {
        console.log(`      ⚠️ No options found for this filter`);
      }
    }
    
    // Get total count of all filter options
    const totalOptions = await FilterOption.countDocuments({});
    console.log(`\n📈 Total filter options in database: ${totalOptions}`);
    
    // Check for orphaned filter options (options without valid filter reference)
    const orphanedOptions = await FilterOption.find({}).populate('filter');
    const orphaned = orphanedOptions.filter(opt => !opt.filter);
    
    if (orphaned.length > 0) {
      console.log(`\n⚠️ Found ${orphaned.length} orphaned filter options:`);
      orphaned.forEach(opt => {
        console.log(`   - ${opt.displayValue} (${opt.value}) - Filter ID: ${opt.filter}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking filter options:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check
if (require.main === module) {
  checkFilterOptions();
}

module.exports = { checkFilterOptions };