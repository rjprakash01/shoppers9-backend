import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { inventoryService } from '../services/inventoryService';

async function fixProduct() {
  try {
    // Connect to database using the same connection string as the running server
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9');
    console.log('✅ Connected to database');

    // Find the specific product
    const productId = '68c803b6a311b4aaf6ceae0f';
    const product = await Product.findById(productId);
    
    if (!product) {
      console.log('❌ Product not found');
      return;
    }

    console.log(`\n🔍 Product: ${product.name}`);
    console.log(`💰 Price: ${product.variants[0]?.price || 'N/A'}`);
    console.log(`📊 Current status: isActive = ${product.isActive}`);
    
    // Show current stock levels
    console.log('\n📦 Current stock levels:');
    product.variants.forEach((variant, index) => {
      console.log(`  Variant ${index + 1} (${variant.color} ${variant.size}): ${variant.stock} units`);
    });
    
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    console.log(`📊 Total stock: ${totalStock} units`);

    // Manually apply the deactivation logic
    if (totalStock === 0 && product.isActive) {
      console.log('\n🔄 Applying deactivation logic...');
      product.isActive = false;
      await product.save();
      console.log('✅ Product manually deactivated due to zero stock');
    } else if (totalStock === 0 && !product.isActive) {
      console.log('\n✅ Product is already correctly deactivated');
    } else if (totalStock > 0 && !product.isActive) {
      console.log('\n🔄 Reactivating product with available stock...');
      product.isActive = true;
      await product.save();
      console.log('✅ Product reactivated');
    } else {
      console.log('\n✅ Product status is correct');
    }

    // Verify the change
    const updatedProduct = await Product.findById(productId);
    console.log(`\n📊 Final status: isActive = ${updatedProduct?.isActive}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the fix
fixProduct();