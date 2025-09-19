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

async function fixMissingOrder() {
  try {
    await connectDB();
    console.log('🔄 Fixing Missing Order for Test Admin...');
    
    const adminsCollection = mongoose.connection.db.collection('admins');
    const productsCollection = mongoose.connection.db.collection('products');
    const ordersCollection = mongoose.connection.db.collection('orders');
    
    // Get Test Admin
    const testAdmin = await adminsCollection.findOne({ 
      email: 'admin@shoppers9.com' 
    });
    
    console.log(`\n👤 Test Admin: ${testAdmin.email} (${testAdmin._id})`);
    
    // Find the specific order that's missing sellerId
    const problemOrder = await ordersCollection.findOne({
      orderNumber: 'ORD17581216079150076'
    });
    
    if (!problemOrder) {
      console.log('❌ Problem order not found');
      return;
    }
    
    console.log(`\n📦 Found problem order: ${problemOrder.orderNumber}`);
    console.log(`   Created: ${problemOrder.createdAt}`);
    console.log(`   Items: ${problemOrder.items.length}`);
    
    // Check each item in the order
    let updated = false;
    for (let i = 0; i < problemOrder.items.length; i++) {
      const item = problemOrder.items[i];
      console.log(`\n   Item ${i + 1}:`);
      console.log(`     Product ID: ${item.product}`);
      console.log(`     Current Seller ID: ${item.sellerId || 'NOT SET'}`);
      
      if (!item.sellerId) {
        // Find the product to get the createdBy
        const product = await productsCollection.findOne({ _id: item.product });
        
        if (product) {
          console.log(`     Product: ${product.name}`);
          console.log(`     Created By: ${product.createdBy}`);
          
          // Update the item with the correct sellerId
          problemOrder.items[i].sellerId = product.createdBy;
          updated = true;
          
          console.log(`     ✅ Updated Seller ID to: ${product.createdBy}`);
        } else {
          console.log(`     ❌ Product not found`);
        }
      }
    }
    
    if (updated) {
      // Update the order in the database
      await ordersCollection.updateOne(
        { _id: problemOrder._id },
        { 
          $set: { 
            items: problemOrder.items,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`\n✅ Order ${problemOrder.orderNumber} updated successfully`);
    } else {
      console.log(`\n⚠️  No updates needed for order ${problemOrder.orderNumber}`);
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    
    const updatedOrder = await ordersCollection.findOne({
      orderNumber: 'ORD17581216079150076'
    });
    
    if (updatedOrder) {
      console.log(`\n📦 Updated order verification:`);
      updatedOrder.items.forEach((item, index) => {
        console.log(`   Item ${index + 1}:`);
        console.log(`     Product: ${item.product}`);
        console.log(`     Seller ID: ${item.sellerId || 'NOT SET'}`);
        console.log(`     Belongs to Test Admin: ${item.sellerId?.toString() === testAdmin._id.toString() ? '✅' : '❌'}`);
      });
    }
    
    // Check if Test Admin can now see this order
    const visibleOrders = await ordersCollection.find({
      'items.sellerId': testAdmin._id
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`\n📊 Orders now visible to Test Admin: ${visibleOrders.length}`);
    
    if (visibleOrders.length > 0) {
      console.log('\n📋 Recent visible orders:');
      visibleOrders.slice(0, 3).forEach((order, index) => {
        console.log(`   ${index + 1}. ${order.orderNumber} - ${order.createdAt}`);
      });
    }
    
    // Now let's also fix the order creation process to prevent this in the future
    console.log('\n🔧 Checking for other orders with missing sellerId...');
    
    const ordersWithoutSellerId = await ordersCollection.find({
      'items.sellerId': { $exists: false }
    }).toArray();
    
    console.log(`📋 Found ${ordersWithoutSellerId.length} orders with missing sellerId`);
    
    if (ordersWithoutSellerId.length > 0) {
      console.log('\n🔄 Fixing all orders with missing sellerId...');
      
      for (const order of ordersWithoutSellerId) {
        let orderUpdated = false;
        
        for (let i = 0; i < order.items.length; i++) {
          const item = order.items[i];
          
          if (!item.sellerId) {
            const product = await productsCollection.findOne({ _id: item.product });
            
            if (product && product.createdBy) {
              order.items[i].sellerId = product.createdBy;
              orderUpdated = true;
            }
          }
        }
        
        if (orderUpdated) {
          await ordersCollection.updateOne(
            { _id: order._id },
            { 
              $set: { 
                items: order.items,
                updatedAt: new Date()
              }
            }
          );
          
          console.log(`   ✅ Fixed order ${order.orderNumber}`);
        }
      }
    }
    
    // Final verification
    console.log('\n📊 FINAL VERIFICATION:');
    
    const finalVisibleOrders = await ordersCollection.find({
      'items.sellerId': testAdmin._id
    }).toArray();
    
    console.log(`   Orders visible to Test Admin: ${finalVisibleOrders.length}`);
    
    const remainingBrokenOrders = await ordersCollection.find({
      'items.sellerId': { $exists: false }
    }).toArray();
    
    console.log(`   Orders still missing sellerId: ${remainingBrokenOrders.length}`);
    
    if (finalVisibleOrders.length > visibleOrders.length) {
      console.log(`   ✅ Successfully increased visible orders by ${finalVisibleOrders.length - visibleOrders.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔚 Fix completed');
  }
}

fixMissingOrder();