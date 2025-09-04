const mongoose = require('mongoose');

async function inspectProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');

    // Get all products
    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    console.log(`Found ${products.length} products:`);
    
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   Category: ${product.category} (type: ${typeof product.category})`);
      console.log(`   SubCategory: ${product.subCategory}`);
      console.log(`   Brand: ${product.brand}`);
      console.log(`   IsActive: ${product.isActive}`);
    });

    // Get all categories
    const categories = await mongoose.connection.db.collection('categories').find({}).toArray();
    console.log(`\nFound ${categories.length} categories:`);
    
    categories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name} (ID: ${category._id})`);
    });
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error inspecting data:', error);
    process.exit(1);
  }
}

inspectProducts();