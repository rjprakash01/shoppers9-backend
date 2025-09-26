const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/shoppers9')
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Define a simple product schema to query
    const productSchema = new mongoose.Schema({}, { strict: false });
    const Product = mongoose.model('Product', productSchema);
    
    // Find a few products and check their variants
    return Product.find({}).limit(3).lean();
  })
  .then(products => {
    console.log('\n=== PRODUCT VARIANTS ANALYSIS ===\n');
    
    products.forEach((product, index) => {
      console.log(`Product ${index + 1}: ${product.name}`);
      console.log(`ID: ${product._id}`);
      console.log(`Variants count: ${product.variants ? product.variants.length : 0}`);
      console.log(`Available colors count: ${product.availableColors ? product.availableColors.length : 0}`);
      console.log(`Available sizes count: ${product.availableSizes ? product.availableSizes.length : 0}`);
      console.log(`Display filters: ${product.displayFilters ? product.displayFilters.length : 0}`);
      
      if (product.variants && product.variants.length > 0) {
        console.log('Variants:');
        product.variants.forEach((variant, vIndex) => {
          console.log(`  ${vIndex + 1}. Color: ${variant.color}, Size: ${variant.size}, Price: ${variant.price}`);
        });
      } else {
        console.log('❌ No variants found!');
      }
      
      if (product.availableColors && product.availableColors.length > 0) {
        console.log('Available Colors:');
        product.availableColors.forEach((color, cIndex) => {
          console.log(`  ${cIndex + 1}. ${color.name} (${color.code})`);
        });
      } else {
        console.log('❌ No available colors found!');
      }
      
      if (product.availableSizes && product.availableSizes.length > 0) {
        console.log('Available Sizes:');
        product.availableSizes.forEach((size, sIndex) => {
          console.log(`  ${sIndex + 1}. ${size.name}`);
        });
      } else {
        console.log('❌ No available sizes found!');
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });