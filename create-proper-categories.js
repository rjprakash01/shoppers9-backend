const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/shoppers9', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Category schema matching the backend model exactly
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true
  },
  image: {
    type: String,
    trim: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    required: true,
    enum: [1, 2, 3],
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

const Category = mongoose.model('Category', categorySchema);

const sampleCategories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices and gadgets',
    level: 1,
    parentCategory: null,
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'Clothing',
    slug: 'clothing',
    description: 'Fashion and apparel',
    level: 1,
    parentCategory: null,
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'Home & Garden',
    slug: 'home-garden',
    description: 'Home improvement and garden supplies',
    level: 1,
    parentCategory: null,
    isActive: true,
    sortOrder: 3
  }
];

async function createProperCategories() {
  try {
    console.log('Connected to MongoDB');
    
    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');
    
    // Create new categories
    const createdCategories = await Category.insertMany(sampleCategories);
    console.log(`Created ${createdCategories.length} sample categories:`);
    
    createdCategories.forEach(category => {
      console.log(`- ${category.name} (ID: ${category._id}, Level: ${category.level})`);
    });
    
    console.log('\nSample categories created successfully!');
    
  } catch (error) {
    console.error('Error creating categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createProperCategories();