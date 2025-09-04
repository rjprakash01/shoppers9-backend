const mongoose = require('mongoose');

// Category schema
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  image: {
    type: String
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

// Product schema (simplified for this update)
const productSchema = new mongoose.Schema({
  name: String,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  // ... other fields
}, {
  timestamps: true,
  strict: false // Allow other fields
});

const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);

async function updateProductCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/shoppers9', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Get all categories
    const categories = await Category.find({});
    console.log('Found categories:', categories.map(c => `${c.name} (${c._id})`));

    // Create a mapping of category names to ObjectIds
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category.name] = category._id;
    });

    // Get all products
    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    console.log(`Found ${products.length} products to update`);

    // Update products with category ObjectIds
    for (const product of products) {
      const categoryName = product.category;
      const categoryDoc = categories.find(cat => cat.name === categoryName);
      
      console.log(`Processing product "${product.name}" with category "${categoryName}"`);
      
      if (categoryDoc) {
        // Force update regardless of current type
        await mongoose.connection.db.collection('products').updateOne(
          { _id: product._id },
          { $set: { category: categoryDoc._id } }
        );
        console.log(`Updated product "${product.name}" with category ObjectId: ${categoryDoc._id}`);
      } else {
        console.log(`Skipping product "${product.name}" - category "${categoryName}" not found`);
      }
    }

    console.log('\nProduct categories updated successfully!');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error updating product categories:', error);
    process.exit(1);
  }
}

updateProductCategories();