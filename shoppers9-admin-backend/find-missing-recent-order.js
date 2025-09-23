const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function findMissingRecentOrder() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const ordersCollection = db.collection('orders');
    const adminsCollection = db.collection('admins');
    
    console.log('\n🔍 SEARCHING FOR THE MISSING RECENT ORDER');
    console.log('=' .repeat(60));
    
    // Find Vishnu admin
    const vishnu = await adminsCollection.findOne({ email: 'prakash.jetender@gmail.com' });
    console.log(`Admin ID: ${vishnu._id}`);
    
    // Search for the specific recent order mentioned earlier
    console.log('\n1. 🔍 Looking for order: ORD17585421552620098');
    const specificOrder = await ordersCollection.findOne({ 
      orderNumber: 'ORD17585421552620098' 
    });
    
    if (specificOrder) {
      console.log('✅ Found the specific order!');
      console.log(`   Order ID: ${specificOrder._id}`);
      console.log(`   Status: ${specificOrder.orderStatus}`);
      console.log(`   Payment: ${specificOrder.paymentStatus}`);
      console.log(`   Total: ₹${specificOrder.finalAmount}`);
      console.log(`   Created: ${specificOrder.createdAt}`);
      console.log(`   Items: ${specificOrder.items?.length || 0}`);
      
      // Check if this order should be visible to admin
      const hasAdminItems = specificOrder.items?.some(item => 
        item.sellerId && item.sellerId.toString() === vishnu._id.toString()
      );
      
      console.log(`   Visible to admin: ${hasAdminItems ? '✅ YES' : '❌ NO'}`);
      
      if (specificOrder.items) {
        specificOrder.items.forEach((item, i) => {
          console.log(`     Item ${i + 1}:`);
          console.log(`       Product: ${item.product}`);
          console.log(`       SellerId: ${item.sellerId}`);
          console.log(`       Expected: ${vishnu._id}`);
          console.log(`       Match: ${item.sellerId?.toString() === vishnu._id.toString() ? '✅' : '❌'}`);
        });
      }
    } else {
      console.log('❌ Order ORD17585421552620098 not found!');
    }
    
    // Search for all recent orders (last 2 hours)
    console.log('\n2. 🕐 Looking for ALL recent orders (last 2 hours)...');
    const twoHoursAgo = new Date(Date.now() - (2 * 60 * 60 * 1000));
    
    const recentOrders = await ordersCollection.find({
      createdAt: { $gte: twoHoursAgo }
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`Found ${recentOrders.length} recent orders:`);
    
    recentOrders.forEach((order, index) => {
      console.log(`\n${index + 1}. Order: ${order.orderNumber || 'NO_NUMBER'}`);
      console.log(`   ID: ${order._id}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log(`   Status: ${order.orderStatus}`);
      console.log(`   Items: ${order.items?.length || 0}`);
      
      const minutesAgo = Math.round((Date.now() - order.createdAt.getTime()) / 60000);
      console.log(`   Time ago: ${minutesAgo} minutes`);
      
      // Check if visible to admin
      const visibleToAdmin = order.items?.some(item => 
        item.sellerId && item.sellerId.toString() === vishnu._id.toString()
      );
      console.log(`   Visible to admin: ${visibleToAdmin ? '✅ YES' : '❌ NO'}`);
      
      if (order.items) {
        order.items.forEach((item, i) => {
          console.log(`     Item ${i + 1}: SellerId=${item.sellerId}`);
        });
      }
    });
    
    // Search for orders containing the Test ADMIN VISHNU product
    console.log('\n3. 🛍️ Looking for orders with "Test ADMIN VISHNU" product...');
    
    const productsCollection = db.collection('products');
    const testProduct = await productsCollection.findOne({ 
      name: { $regex: /Test.*ADMIN.*VISHNU/i } 
    });
    
    if (testProduct) {
      console.log(`✅ Found product: ${testProduct.name} (ID: ${testProduct._id})`);
      
      const productOrders = await ordersCollection.find({
        'items.product': testProduct._id
      }).sort({ createdAt: -1 }).toArray();
      
      console.log(`\nFound ${productOrders.length} orders with this product:`);
      
      productOrders.forEach((order, index) => {
        console.log(`\n${index + 1}. Order: ${order.orderNumber || 'NO_NUMBER'}`);
        console.log(`   ID: ${order._id}`);
        console.log(`   Created: ${order.createdAt}`);
        console.log(`   Status: ${order.orderStatus}`);
        
        const minutesAgo = Math.round((Date.now() - order.createdAt.getTime()) / 60000);
        console.log(`   Time ago: ${minutesAgo} minutes`);
        
        // Check if visible to admin
        const visibleToAdmin = order.items?.some(item => 
          item.sellerId && item.sellerId.toString() === vishnu._id.toString()
        );
        console.log(`   Visible to admin: ${visibleToAdmin ? '✅ YES' : '❌ NO'}`);
        
        if (!visibleToAdmin && order.items) {
          console.log('   🔧 FIXING SELLER ID...');
          
          const updatedItems = order.items.map(item => {
            if (item.product.toString() === testProduct._id.toString()) {
              return { ...item, sellerId: vishnu._id };
            }
            return item;
          });
          
          // Update the order
          ordersCollection.updateOne(
            { _id: order._id },
            { 
              $set: { 
                items: updatedItems,
                updatedAt: new Date()
              }
            }
          ).then(() => {
            console.log(`   ✅ Fixed sellerId for order ${order.orderNumber}`);
          }).catch(err => {
            console.log(`   ❌ Failed to fix order: ${err.message}`);
          });
        }
      });
    }
    
    // Final check - count all visible orders
    console.log('\n4. 📊 FINAL COUNT CHECK...');
    
    const finalVisibleOrders = await ordersCollection.find({
      'items.sellerId': vishnu._id
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`\n✅ FINAL RESULT: ${finalVisibleOrders.length} orders visible to admin`);
    
    finalVisibleOrders.forEach((order, index) => {
      const minutesAgo = Math.round((Date.now() - order.createdAt.getTime()) / 60000);
      console.log(`  ${index + 1}. ${order.orderNumber} - ${minutesAgo}min ago - ${order.orderStatus}`);
    });
    
    await client.close();
    
    console.log('\n🎯 SUMMARY:');
    console.log(`📊 Total visible orders: ${finalVisibleOrders.length}`);
    
    if (finalVisibleOrders.length > 0) {
      const mostRecent = finalVisibleOrders[0];
      const minutesAgo = Math.round((Date.now() - mostRecent.createdAt.getTime()) / 60000);
      console.log(`🕐 Most recent order: ${mostRecent.orderNumber} (${minutesAgo} minutes ago)`);
      
      if (minutesAgo < 30) {
        console.log(`🔥 Recent order found - should be visible in frontend!`);
      } else {
        console.log(`⏰ Most recent order is ${minutesAgo} minutes old`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error finding missing order:', error);
  }
}

findMissingRecentOrder().catch(console.error);