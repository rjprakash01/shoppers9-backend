import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product';

dotenv.config();

async function findSareeProducts() {
  try {
    console.log('\n=== SEARCHING FOR SAREE PRODUCTS ===');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin');
    console.log('✅ Connected to database');
    
    // Search for products with 'saree' in the name (case insensitive)
    const sareeProducts = await Product.find({
      name: { $regex: 'saree', $options: 'i' }
    }).select('name images variants brand isActive reviewStatus createdAt');
    
    console.log(`\n🔍 Found ${sareeProducts.length} products with 'saree' in the name:`);
    
    if (sareeProducts.length === 0) {
      console.log('❌ No saree products found');
      
      // Let's also search for products with 'saree1' specifically
      const saree1Products = await Product.find({
        $or: [
          { name: { $regex: 'saree1', $options: 'i' } },
          { sku: { $regex: 'saree1', $options: 'i' } },
          { 'variants.sku': { $regex: 'saree1', $options: 'i' } }
        ]
      }).select('name images variants brand isActive reviewStatus createdAt');
      
      console.log(`\n🔍 Found ${saree1Products.length} products with 'saree1' in name/sku:`);
      
      if (saree1Products.length === 0) {
        // Let's check all products to see what's available
        const allProducts = await Product.find({}).select('name brand').limit(10);
        console.log(`\n📋 Sample of available products (first 10):`);
        allProducts.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} (Brand: ${product.brand || 'N/A'})`);
        });
      } else {
        saree1Products.forEach((product, index) => {
          console.log(`\n${index + 1}. Product: ${product.name}`);
          console.log(`   ID: ${product._id}`);
          console.log(`   Brand: ${product.brand || 'N/A'}`);
          console.log(`   Active: ${product.isActive}`);
          console.log(`   Review Status: ${product.reviewStatus}`);
          console.log(`   Images: ${JSON.stringify(product.images, null, 2)}`);
          console.log(`   Variants: ${product.variants?.length || 0}`);
          if (product.variants && product.variants.length > 0) {
            product.variants.forEach((variant, vIndex) => {
              console.log(`     Variant ${vIndex + 1}: ${variant.color} ${variant.size} - Images: ${JSON.stringify(variant.images)}`);
            });
          }
        });
      }
    } else {
      sareeProducts.forEach((product, index) => {
        console.log(`\n${index + 1}. Product: ${product.name}`);
        console.log(`   ID: ${product._id}`);
        console.log(`   Brand: ${product.brand || 'N/A'}`);
        console.log(`   Active: ${product.isActive}`);
        console.log(`   Review Status: ${product.reviewStatus}`);
        console.log(`   Images: ${JSON.stringify(product.images, null, 2)}`);
        console.log(`   Variants: ${product.variants?.length || 0}`);
        if (product.variants && product.variants.length > 0) {
          product.variants.forEach((variant, vIndex) => {
            console.log(`     Variant ${vIndex + 1}: ${variant.color} ${variant.size} - Images: ${JSON.stringify(variant.images)}`);
          });
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

findSareeProducts();