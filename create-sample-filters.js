const mongoose = require('mongoose');

// Define the filter schema
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

const Filter = mongoose.model('Filter', filterSchema);

async function createSampleFilters() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');

    // Clear existing filters
    await Filter.deleteMany({});
    console.log('Cleared existing filters');

    // Create sample filters
    const sampleFilters = [
      {
        name: 'brand',
        displayName: 'Brand',
        type: 'multiple',
        dataType: 'string',
        description: 'Product brand filter',
        categoryLevels: [1, 2, 3],
        sortOrder: 1
      },
      {
        name: 'price',
        displayName: 'Price Range',
        type: 'range',
        dataType: 'number',
        description: 'Product price range filter',
        categoryLevels: [2, 3],
        sortOrder: 2
      },
      {
        name: 'color',
        displayName: 'Color',
        type: 'multiple',
        dataType: 'string',
        description: 'Product color filter',
        categoryLevels: [2, 3],
        sortOrder: 3
      },
      {
        name: 'size',
        displayName: 'Size',
        type: 'multiple',
        dataType: 'string',
        description: 'Product size filter',
        categoryLevels: [3],
        sortOrder: 4
      },
      {
        name: 'rating',
        displayName: 'Customer Rating',
        type: 'single',
        dataType: 'number',
        description: 'Product rating filter',
        categoryLevels: [1, 2, 3],
        sortOrder: 5
      }
    ];

    const createdFilters = await Filter.insertMany(sampleFilters);
    console.log(`Created ${createdFilters.length} sample filters:`);
    createdFilters.forEach(filter => {
      console.log(`- ${filter.displayName} (${filter.name})`);
    });

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error creating sample filters:', error);
    process.exit(1);
  }
}

createSampleFilters();