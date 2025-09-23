import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { inventoryService } from '../services/inventoryService';
// import { config } from '../config/database';

/**
 * Test script to verify automatic product deactivation when stock reaches zero
 */
async function testAutoDeactivation() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // Find a product with stock to test
    const product = await Product.findOne({
      'variants.stock': { $gt: 0 },
      isActive: true
    });

    if (!product) {
      console.log('❌ No products with stock found for testing');
      return;
    }

    console.log(`\n🧪 Testing with product: ${product.name} (${product._id})`);
    console.log(`📊 Current status: isActive = ${product.isActive}`);
    
    // Show current stock levels
    console.log('\n📦 Current stock levels:');
    product.variants.forEach((variant, index) => {
      console.log(`  Variant ${index + 1} (${variant.color} ${variant.size}): ${variant.stock} units`);
    });
    
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    console.log(`📊 Total stock: ${totalStock} units`);

    // Test: Reduce stock of all variants to zero
    console.log('\n🔄 Testing stock reduction to zero...');
    
    for (const variant of product.variants) {
      if (variant.stock > 0) {
        console.log(`\n⬇️  Reducing stock for variant ${variant.color} ${variant.size} from ${variant.stock} to 0`);
        
        await inventoryService.updateStock({
          productId: product._id.toString(),
          variantId: variant._id!.toString(),
          quantity: variant.stock,
          operation: 'decrease',
          reason: 'Test: Auto-deactivation when stock reaches zero'
        });
      }
    }

    // Check if product was automatically deactivated
    const updatedProduct = await Product.findById(product._id);
    console.log(`\n✅ Test completed!`);
    console.log(`📊 Product status after stock reduction: isActive = ${updatedProduct?.isActive}`);
    
    if (updatedProduct?.isActive === false) {
      console.log('🎉 SUCCESS: Product was automatically deactivated when stock reached zero!');
    } else {
      console.log('❌ FAILED: Product was not automatically deactivated');
    }

    // Test: Add stock back and verify reactivation
    console.log('\n🔄 Testing stock increase and reactivation...');
    
    const firstVariant = updatedProduct!.variants[0];
    await inventoryService.updateStock({
      productId: product._id.toString(),
      variantId: firstVariant._id!.toString(),
      quantity: 5,
      operation: 'increase',
      reason: 'Test: Reactivation when stock becomes available'
    });

    // Check if product was automatically reactivated
    const reactivatedProduct = await Product.findById(product._id);
    console.log(`📊 Product status after stock increase: isActive = ${reactivatedProduct?.isActive}`);
    
    if (reactivatedProduct?.isActive === true) {
      console.log('🎉 SUCCESS: Product was automatically reactivated when stock became available!');
    } else {
      console.log('❌ FAILED: Product was not automatically reactivated');
    }

    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the test
if (require.main === module) {
  testAutoDeactivation();
}

export { testAutoDeactivation };