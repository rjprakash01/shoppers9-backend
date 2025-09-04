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

async function createFilterOptions() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');

    // Clear existing filter options
    await FilterOption.deleteMany({});
    console.log('Cleared existing filter options');

    // Get all filters
    const filters = await Filter.find({});
    console.log(`Found ${filters.length} filters`);

    const filterOptionsData = [];

    for (const filter of filters) {
      console.log(`\nCreating options for filter: ${filter.name}`);
      
      let options = [];
      
      switch (filter.name) {
        case 'brand':
          options = [
            { value: 'nike', displayValue: 'Nike' },
            { value: 'adidas', displayValue: 'Adidas' },
            { value: 'puma', displayValue: 'Puma' },
            { value: 'reebok', displayValue: 'Reebok' },
            { value: 'under-armour', displayValue: 'Under Armour' },
            { value: 'levis', displayValue: "Levi's" },
            { value: 'zara', displayValue: 'Zara' },
            { value: 'h&m', displayValue: 'H&M' }
          ];
          break;
          
        case 'color':
          options = [
            { value: 'red', displayValue: 'Red', colorCode: '#FF0000' },
            { value: 'blue', displayValue: 'Blue', colorCode: '#0000FF' },
            { value: 'green', displayValue: 'Green', colorCode: '#008000' },
            { value: 'black', displayValue: 'Black', colorCode: '#000000' },
            { value: 'white', displayValue: 'White', colorCode: '#FFFFFF' },
            { value: 'yellow', displayValue: 'Yellow', colorCode: '#FFFF00' },
            { value: 'pink', displayValue: 'Pink', colorCode: '#FFC0CB' },
            { value: 'purple', displayValue: 'Purple', colorCode: '#800080' },
            { value: 'orange', displayValue: 'Orange', colorCode: '#FFA500' },
            { value: 'brown', displayValue: 'Brown', colorCode: '#A52A2A' }
          ];
          break;
          
        case 'size':
          options = [
            { value: 'xs', displayValue: 'XS' },
            { value: 's', displayValue: 'S' },
            { value: 'm', displayValue: 'M' },
            { value: 'l', displayValue: 'L' },
            { value: 'xl', displayValue: 'XL' },
            { value: 'xxl', displayValue: 'XXL' },
            { value: '28', displayValue: '28' },
            { value: '30', displayValue: '30' },
            { value: '32', displayValue: '32' },
            { value: '34', displayValue: '34' },
            { value: '36', displayValue: '36' },
            { value: '38', displayValue: '38' }
          ];
          break;
          
        case 'rating':
          options = [
            { value: '5', displayValue: '5 Stars' },
            { value: '4', displayValue: '4 Stars & Above' },
            { value: '3', displayValue: '3 Stars & Above' },
            { value: '2', displayValue: '2 Stars & Above' },
            { value: '1', displayValue: '1 Star & Above' }
          ];
          break;
          
        case 'price':
          // For range type filters, we might not need options
          // But let's add some price ranges as options
          options = [
            { value: '0-500', displayValue: 'Under ₹500' },
            { value: '500-1000', displayValue: '₹500 - ₹1000' },
            { value: '1000-2000', displayValue: '₹1000 - ₹2000' },
            { value: '2000-5000', displayValue: '₹2000 - ₹5000' },
            { value: '5000-10000', displayValue: '₹5000 - ₹10000' },
            { value: '10000+', displayValue: 'Above ₹10000' }
          ];
          break;
          
        default:
          console.log(`No predefined options for filter: ${filter.name}`);
          continue;
      }
      
      // Create filter options for this filter
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        filterOptionsData.push({
          filter: filter._id,
          value: option.value,
          displayValue: option.displayValue,
          colorCode: option.colorCode || null,
          isActive: true,
          sortOrder: i + 1
        });
      }
      
      console.log(`  Added ${options.length} options`);
    }

    // Insert all filter options
    if (filterOptionsData.length > 0) {
      const createdOptions = await FilterOption.insertMany(filterOptionsData);
      console.log(`\n✅ Successfully created ${createdOptions.length} filter options`);
      
      // Show summary by filter
      const summary = {};
      for (const option of createdOptions) {
        const filter = await Filter.findById(option.filter);
        if (filter) {
          if (!summary[filter.name]) {
            summary[filter.name] = 0;
          }
          summary[filter.name]++;
        }
      }
      
      console.log('\nSummary:');
      Object.entries(summary).forEach(([filterName, count]) => {
        console.log(`  ${filterName}: ${count} options`);
      });
    } else {
      console.log('\n⚠️  No filter options were created');
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error creating filter options:', error);
    process.exit(1);
  }
}

createFilterOptions();