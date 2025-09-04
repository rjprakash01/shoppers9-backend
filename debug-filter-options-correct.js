const mongoose = require('mongoose');

// Define schemas based on admin backend models
const filterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    minlength: 2,
    maxlength: 50
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  type: {
    type: String,
    required: true,
    enum: ['single', 'multiple', 'range'],
    default: 'multiple'
  },
  dataType: {
    type: String,
    required: true,
    enum: ['string', 'number', 'boolean'],
    default: 'string'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  categoryLevels: {
    type: [Number],
    enum: [1, 2, 3],
    default: [2, 3]
  },
  categories: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Category',
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const filterOptionSchema = new mongoose.Schema({
  filter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Filter',
    required: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  displayValue: {
    type: String,
    required: true,
    trim: true
  },
  colorCode: {
    type: String,
    trim: true,
    match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Filter = mongoose.model('Filter', filterSchema);
const FilterOption = mongoose.model('FilterOption', filterOptionSchema);

async function debugFilterOptions() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');

    // Get all filters with their options
    const filters = await Filter.find({}).sort({ sortOrder: 1, name: 1 });
    console.log(`\nTotal filters found: ${filters.length}`);
    console.log('=' .repeat(60));

    for (let i = 0; i < filters.length; i++) {
      const filter = filters[i];
      console.log(`\n${i + 1}. Filter: ${filter.displayName} (${filter.name})`);
      console.log(`   Type: ${filter.type}`);
      console.log(`   Data Type: ${filter.dataType}`);
      console.log(`   Active: ${filter.isActive}`);
      console.log(`   Category Levels: [${filter.categoryLevels.join(', ')}]`);
      
      // Get options for this filter
      const options = await FilterOption.find({ filter: filter._id })
        .sort({ sortOrder: 1, displayValue: 1 });
      
      console.log(`   Options count: ${options.length}`);
      
      if (options.length > 0) {
        console.log('   Options:');
        options.forEach((option, optIndex) => {
          let optionStr = `     ${optIndex + 1}. ${option.displayValue} (${option.value})`;
          if (option.colorCode) {
            optionStr += ` [${option.colorCode}]`;
          }
          optionStr += ` - Active: ${option.isActive}`;
          console.log(optionStr);
        });
      } else {
        console.log('   ⚠️  NO OPTIONS FOUND!');
      }
    }
    
    // Get total counts
    const totalOptions = await FilterOption.countDocuments({});
    const activeOptions = await FilterOption.countDocuments({ isActive: true });
    
    console.log('\n' + '=' .repeat(60));
    console.log(`Total Filter Options: ${totalOptions}`);
    console.log(`Active Filter Options: ${activeOptions}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

debugFilterOptions();