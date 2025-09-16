import { Product } from '../models/Product';
import mongoose from 'mongoose';

async function checkProductStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9');
    console.log('✅ Connected to database');

    // Find products with 'vishnu' in the name
    const products = await Product.find({ 
      name: { $regex: 'vishnu', $options: 'i' } 
    }).select('name isActive variants.stock variants.color variants.size');

    console.log('\n🔍 Vishnu products status:');
    products.forEach(product => {
      const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
      console.log(`\n📦 Product: ${product.name}`);
      console.log(`   - isActive: ${product.isActive}`);
      console.log(`   - Total Stock: ${totalStock}`);
      console.log(`   - Variants:`);
      product.variants.forEach((variant, index) => {
        console.log(`     ${index + 1}. ${variant.color} ${variant.size}: ${variant.stock} units`);
      });
    });

    // Also check any products that were recently updated
    const recentlyUpdated = await Product.find({
      updatedAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Last 10 minutes
    }).select('name isActive variants.stock updatedAt').sort({ updatedAt: -1 }).limit(5);

    console.log('\n🕒 Recently updated products (last 10 minutes):');
    recentlyUpdated.forEach(product => {
      const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
      console.log(`   - ${product.name}: isActive=${product.isActive}, totalStock=${totalStock}, updated=${product.updatedAt}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

checkProductStatus();