import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product';
import Category from './src/models/Category';

dotenv.config();

async function checkProductCategories() {
  try {
    console.log('\n=== CHECKING PRODUCT CATEGORIES ===');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin');
    console.log('✅ Connected to database');
    
    // Find specific products
    const productNames = ['saree1', 'shirt1', 't-shirt1'];
    
    for (const productName of productNames) {
      console.log(`\n🔍 Searching for product: ${productName}`);
      
      const product = await Product.findOne({
        name: { $regex: productName, $options: 'i' }
      }).populate('category', 'name slug level')
        .populate('subCategory', 'name slug level')
        .populate('subSubCategory', 'name slug level');
      
      if (product) {
        console.log(`✅ Found: ${product.name}`);
        console.log(`   ID: ${product._id}`);
        console.log(`   Category: ${(product.category as any)?.name || 'N/A'} (${(product.category as any)?.slug || 'N/A'}) - Level ${(product.category as any)?.level || 'N/A'}`);
        console.log(`   SubCategory: ${(product.subCategory as any)?.name || 'N/A'} (${(product.subCategory as any)?.slug || 'N/A'}) - Level ${(product.subCategory as any)?.level || 'N/A'}`);
        console.log(`   SubSubCategory: ${(product.subSubCategory as any)?.name || 'N/A'} (${(product.subSubCategory as any)?.slug || 'N/A'}) - Level ${(product.subSubCategory as any)?.level || 'N/A'}`);
        console.log(`   Brand: ${product.brand || 'N/A'}`);
        console.log(`   Active: ${product.isActive}`);
        console.log(`   Review Status: ${product.reviewStatus}`);
      } else {
        console.log(`❌ Product '${productName}' not found`);
      }
    }
    
    // Also check what categories exist
    console.log('\n📋 Available Categories:');
    const categories = await Category.find({ isActive: true }).sort({ level: 1, name: 1 });
    
    categories.forEach(cat => {
      const indent = '  '.repeat(cat.level - 1);
      console.log(`${indent}- ${cat.name} (${cat.slug}) - Level ${cat.level}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

checkProductCategories();