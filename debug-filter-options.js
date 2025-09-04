const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/shoppers9')
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Define Filter schema
    const filterSchema = new mongoose.Schema({
      name: String,
      type: String,
      options: [{
        value: String,
        label: String,
        isActive: { type: Boolean, default: true }
      }],
      isActive: { type: Boolean, default: true }
    });
    
    const Filter = mongoose.model('Filter', filterSchema);
    
    // Find all filters and their options
    return Filter.find({});
  })
  .then(filters => {
    console.log(`\nTotal filters found: ${filters.length}`);
    console.log('=' .repeat(50));
    
    filters.forEach((filter, index) => {
      console.log(`\n${index + 1}. Filter: ${filter.name}`);
      console.log(`   Type: ${filter.type}`);
      console.log(`   Active: ${filter.isActive}`);
      console.log(`   Options count: ${filter.options ? filter.options.length : 0}`);
      
      if (filter.options && filter.options.length > 0) {
        console.log('   Options:');
        filter.options.forEach((option, optIndex) => {
          console.log(`     ${optIndex + 1}. ${option.label} (${option.value}) - Active: ${option.isActive}`);
        });
      } else {
        console.log('   ⚠️  NO OPTIONS FOUND!');
      }
    });
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
  });