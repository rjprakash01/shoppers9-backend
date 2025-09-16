import { Product } from '../models/Product';
import mongoose from 'mongoose';

async function manualReactivation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9');
    console.log('✅ Connected to database');

    // Find the Vishnu Shoe product
    const product = await Product.findOne({ name: { $regex: 'vishnu', $options: 'i' } });
    
    if (!product) {
      console.log('❌ Vishnu Shoe product not found');
      return;
    }

    console.log(`\n🔍 Found product: ${product.name}`);
    console.log(`   - Current isActive: ${product.isActive}`);
    
    // Calculate total stock
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    console.log(`   - Total stock: ${totalStock}`);
    
    // Apply reactivation logic
    const wasActive = product.isActive;
    
    if (totalStock === 0 && product.isActive) {
      product.isActive = false;
      console.log(`   - 🔴 Deactivating product (total stock is zero)`);
    } else if (totalStock > 0 && !product.isActive) {
      product.isActive = true;
      console.log(`   - 🟢 Reactivating product (stock available)`);
    } else {
      console.log(`   - ⚪ No status change needed`);
    }
    
    if (wasActive !== product.isActive) {
      await product.save();
      console.log(`   - ✅ Product status updated and saved`);
    }
    
    console.log(`   - Final isActive: ${product.isActive}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

manualReactivation();