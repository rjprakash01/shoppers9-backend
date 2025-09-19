const mongoose = require('mongoose');
const Product = require('./src/models/Product').default;
const connectDB = require('./src/config/database').default;

connectDB().then(async () => {
  console.log('=== DETAILED PRODUCT DATA CHECK ===');
  const products = await Product.find().limit(3).select('name price discountedPrice originalPrice images variants stock');
  console.log('Sample products with full data:');
  
  products.forEach((p, i) => {
    console.log(`${i+1}. ${p.name}:`);
    console.log('   Price:', p.price);
    console.log('   Discounted Price:', p.discountedPrice);
    console.log('   Original Price:', p.originalPrice);
    console.log('   Images:', p.images?.length || 0, 'items');
    console.log('   Variants:', p.variants?.length || 0, 'items');
    console.log('   Stock:', p.stock);
    
    if (p.variants && p.variants.length > 0) {
      console.log('   First variant:', {
        price: p.variants[0].price,
        stock: p.variants[0].stock,
        images: p.variants[0].images?.length || 0
      });
    }
    console.log('---');
  });
  
  process.exit(0);
}).catch(err => {
  console.error('Database error:', err);
  process.exit(1);
});