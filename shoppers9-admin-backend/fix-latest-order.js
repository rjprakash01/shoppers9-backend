const mongoose = require('mongoose');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoppers9', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function fixLatestOrder() {
  try {
    await connectDB();
    console.log('🔧 FIXING LATEST ORDER AND IMPLEMENTING PERMANENT SOLUTION...');
    console.log('=' .repeat(60));
    
    const adminsCollection = mongoose.connection.db.collection('admins');
    const productsCollection = mongoose.connection.db.collection('products');
    const ordersCollection = mongoose.connection.db.collection('orders');
    
    // Get Test Admin
    const testAdmin = await adminsCollection.findOne({ 
      email: 'admin@shoppers9.com' 
    });
    
    console.log(`\n👤 Test Admin: ${testAdmin.email} (${testAdmin._id})`);
    
    // Get Test Admin products
    const adminProducts = await productsCollection.find({ 
      createdBy: testAdmin._id 
    }).toArray();
    
    console.log(`\n📦 Test Admin Products: ${adminProducts.length}`);
    adminProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (${product._id})`);
    });
    
    // Fix the latest problematic order
    console.log('\n🔧 FIXING LATEST ORDER: ORD17581222671940077');
    
    const latestOrder = await ordersCollection.findOne({
      orderNumber: 'ORD17581222671940077'
    });
    
    if (latestOrder) {
      console.log(`   Found order: ${latestOrder.orderNumber}`);
      console.log(`   Created: ${latestOrder.createdAt}`);
      console.log(`   Items: ${latestOrder.items.length}`);
      
      let updated = false;
      const updatedItems = latestOrder.items.map(item => {
        console.log(`\n   Processing item:`);
        console.log(`     Product ID: ${item.product}`);
        console.log(`     Current Seller ID: ${item.sellerId || 'NOT SET'}`);
        
        // Find the product
        const product = adminProducts.find(p => p._id.toString() === item.product.toString());
        
        if (product) {
          console.log(`     Product: ${product.name}`);
          console.log(`     Created By: ${product.createdBy}`);
          
          if (!item.sellerId || item.sellerId.toString() !== product.createdBy.toString()) {
            console.log(`     ✅ Updating Seller ID to: ${product.createdBy}`);
            updated = true;
            return {
              ...item,
              sellerId: product.createdBy
            };
          } else {
            console.log(`     ✅ Seller ID already correct`);
          }
        } else {
          console.log(`     ❌ Product not found in admin products`);
        }
        
        return item;
      });
      
      if (updated) {
        await ordersCollection.updateOne(
          { _id: latestOrder._id },
          { 
            $set: { 
              items: updatedItems,
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`\n   ✅ Order ${latestOrder.orderNumber} updated successfully`);
      } else {
        console.log(`\n   ⚠️  No updates needed for order ${latestOrder.orderNumber}`);
      }
    } else {
      console.log('   ❌ Latest order not found');
    }
    
    // Now fix ALL orders with missing sellerId for admin products
    console.log('\n🔧 FIXING ALL ORDERS WITH ADMIN PRODUCTS...');
    
    const productIds = adminProducts.map(p => p._id);
    
    // Find all orders that contain admin products
    const allOrdersWithAdminProducts = await ordersCollection.find({
      'items.product': { $in: productIds }
    }).toArray();
    
    console.log(`\n📊 Found ${allOrdersWithAdminProducts.length} orders with admin products`);
    
    let fixedCount = 0;
    
    for (const order of allOrdersWithAdminProducts) {
      let orderNeedsUpdate = false;
      
      const updatedItems = order.items.map(item => {
        const isAdminProduct = productIds.some(pid => pid.toString() === item.product.toString());
        
        if (isAdminProduct) {
          const product = adminProducts.find(p => p._id.toString() === item.product.toString());
          
          if (product && (!item.sellerId || item.sellerId.toString() !== product.createdBy.toString())) {
            orderNeedsUpdate = true;
            return {
              ...item,
              sellerId: product.createdBy
            };
          }
        }
        
        return item;
      });
      
      if (orderNeedsUpdate) {
        await ordersCollection.updateOne(
          { _id: order._id },
          { 
            $set: { 
              items: updatedItems,
              updatedAt: new Date()
            }
          }
        );
        
        fixedCount++;
        console.log(`   ✅ Fixed order ${order.orderNumber}`);
      }
    }
    
    console.log(`\n📊 Fixed ${fixedCount} orders`);
    
    // Verify the fixes
    console.log('\n🔍 VERIFYING FIXES...');
    
    const finalVisibleOrders = await ordersCollection.find({
      'items.sellerId': testAdmin._id
    }).sort({ createdAt: -1 }).toArray();
    
    const finalOrdersWithProducts = await ordersCollection.find({
      'items.product': { $in: productIds }
    }).toArray();
    
    console.log(`\n📊 VERIFICATION RESULTS:`);
    console.log(`   Orders with admin products: ${finalOrdersWithProducts.length}`);
    console.log(`   Orders visible to admin: ${finalVisibleOrders.length}`);
    console.log(`   Match: ${finalVisibleOrders.length === finalOrdersWithProducts.length ? '✅' : '❌'}`);
    
    if (finalVisibleOrders.length > 0) {
      console.log('\n📦 Orders now visible to Test Admin:');
      finalVisibleOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. ${order.orderNumber} - ${order.createdAt}`);
      });
    }
    
    // Check the specific latest order
    const verifyLatestOrder = await ordersCollection.findOne({
      orderNumber: 'ORD17581222671940077'
    });
    
    if (verifyLatestOrder) {
      console.log('\n🔍 Latest Order Verification:');
      console.log(`   Order: ${verifyLatestOrder.orderNumber}`);
      verifyLatestOrder.items.forEach((item, index) => {
        console.log(`   Item ${index + 1}:`);
        console.log(`     Product: ${item.product}`);
        console.log(`     Seller ID: ${item.sellerId || 'NOT SET'}`);
        console.log(`     Correct: ${item.sellerId?.toString() === testAdmin._id.toString() ? '✅' : '❌'}`);
      });
    }
    
    // Final summary
    console.log('\n📋 FINAL SUMMARY:');
    console.log(`   ✅ Test Admin has ${adminProducts.length} products`);
    console.log(`   ✅ ${finalOrdersWithProducts.length} orders contain admin products`);
    console.log(`   ✅ ${finalVisibleOrders.length} orders are visible to admin`);
    console.log(`   ✅ ${fixedCount} orders were fixed`);
    console.log(`   ${finalVisibleOrders.length === finalOrdersWithProducts.length ? '✅' : '❌'} All orders are now properly mapped`);
    
    if (finalVisibleOrders.length === finalOrdersWithProducts.length && finalOrdersWithProducts.length > 0) {
      console.log('\n🎉 SUCCESS: All orders with admin products are now visible to Test Admin!');
    } else if (finalOrdersWithProducts.length === 0) {
      console.log('\n⚠️  INFO: No orders found with admin products. Test by placing a new order.');
    } else {
      console.log('\n❌ ISSUE: Some orders are still not properly mapped');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔚 Fix completed');
  }
}

fixLatestOrder();