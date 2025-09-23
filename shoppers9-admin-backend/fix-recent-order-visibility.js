const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function fixRecentOrderVisibility() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const ordersCollection = db.collection('orders');
    const adminsCollection = db.collection('admins');
    
    console.log('\n🔧 FIXING RECENT ORDER VISIBILITY ISSUE');
    console.log('=' .repeat(60));
    
    // Find Vishnu admin
    const vishnu = await adminsCollection.findOne({ email: 'prakash.jetender@gmail.com' });
    console.log(`✅ Admin: ${vishnu.email} (ID: ${vishnu._id})`);
    
    // Find the specific recent order
    const recentOrder = await ordersCollection.findOne({ 
      orderNumber: 'ORD17585421552620098' 
    });
    
    if (!recentOrder) {
      console.log('❌ Recent order not found!');
      await client.close();
      return;
    }
    
    console.log(`\n📦 Found recent order: ${recentOrder.orderNumber}`);
    console.log(`   ID: ${recentOrder._id}`);
    console.log(`   Created: ${recentOrder.createdAt}`);
    console.log(`   Status: ${recentOrder.orderStatus}`);
    console.log(`   Items: ${recentOrder.items?.length || 0}`);
    
    // Check current sellerId
    if (recentOrder.items) {
      console.log('\n🔍 Current item details:');
      recentOrder.items.forEach((item, i) => {
        console.log(`   Item ${i + 1}:`);
        console.log(`     Product: ${item.product}`);
        console.log(`     SellerId: ${item.sellerId}`);
        console.log(`     Expected: ${vishnu._id}`);
        console.log(`     Match: ${item.sellerId?.toString() === vishnu._id.toString() ? '✅' : '❌'}`);
      });
    }
    
    // Force update the sellerId to ensure visibility
    console.log('\n🔧 Ensuring correct sellerId...');
    
    const updatedItems = recentOrder.items.map(item => ({
      ...item,
      sellerId: vishnu._id
    }));
    
    await ordersCollection.updateOne(
      { _id: recentOrder._id },
      { 
        $set: { 
          items: updatedItems,
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ Updated sellerId for recent order');
    
    // Verify the fix
    console.log('\n🧪 Verifying the fix...');
    
    const verifyOrder = await ordersCollection.findOne({ 
      orderNumber: 'ORD17585421552620098' 
    });
    
    const isNowVisible = verifyOrder.items?.some(item => 
      item.sellerId && item.sellerId.toString() === vishnu._id.toString()
    );
    
    console.log(`Order now visible to admin: ${isNowVisible ? '✅ YES' : '❌ NO'}`);
    
    // Get updated list of all visible orders
    console.log('\n📋 Updated list of all visible orders:');
    
    const allVisibleOrders = await ordersCollection.find({
      'items.sellerId': vishnu._id
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`\n📊 TOTAL VISIBLE ORDERS: ${allVisibleOrders.length}`);
    
    allVisibleOrders.forEach((order, index) => {
      const minutesAgo = Math.round((Date.now() - order.createdAt.getTime()) / 60000);
      console.log(`  ${index + 1}. ${order.orderNumber} (${minutesAgo}min ago) - ${order.orderStatus}`);
    });
    
    // Check if the recent order is now at the top
    if (allVisibleOrders.length > 0) {
      const topOrder = allVisibleOrders[0];
      const minutesAgo = Math.round((Date.now() - topOrder.createdAt.getTime()) / 60000);
      
      console.log(`\n🕐 Most recent order: ${topOrder.orderNumber} (${minutesAgo} minutes ago)`);
      
      if (topOrder.orderNumber === 'ORD17585421552620098') {
        console.log('🎉 SUCCESS! Recent order is now at the top!');
      } else if (minutesAgo < 15) {
        console.log('🔥 Very recent order found at top!');
      }
    }
    
    // Also check for any other recent orders that might need fixing
    console.log('\n🔍 Checking for other recent orders needing fixes...');
    
    const oneHourAgo = new Date(Date.now() - (60 * 60 * 1000));
    const recentOrders = await ordersCollection.find({
      createdAt: { $gte: oneHourAgo }
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`Found ${recentOrders.length} orders from last hour:`);
    
    for (const order of recentOrders) {
      const minutesAgo = Math.round((Date.now() - order.createdAt.getTime()) / 60000);
      const visibleToAdmin = order.items?.some(item => 
        item.sellerId && item.sellerId.toString() === vishnu._id.toString()
      );
      
      console.log(`  - ${order.orderNumber} (${minutesAgo}min ago) - Visible: ${visibleToAdmin ? '✅' : '❌'}`);
      
      // If not visible but should be (contains admin's products), fix it
      if (!visibleToAdmin) {
        const productsCollection = db.collection('products');
        
        for (const item of order.items || []) {
          const product = await productsCollection.findOne({ _id: item.product });
          
          if (product && product.createdBy && product.createdBy.toString() === vishnu._id.toString()) {
            console.log(`    🔧 Fixing order ${order.orderNumber} - contains admin's product`);
            
            const fixedItems = order.items.map(orderItem => {
              if (orderItem.product.toString() === product._id.toString()) {
                return { ...orderItem, sellerId: vishnu._id };
              }
              return orderItem;
            });
            
            await ordersCollection.updateOne(
              { _id: order._id },
              { 
                $set: { 
                  items: fixedItems,
                  updatedAt: new Date()
                }
              }
            );
            
            console.log(`    ✅ Fixed order ${order.orderNumber}`);
            break;
          }
        }
      }
    }
    
    // Final verification
    console.log('\n🎯 FINAL VERIFICATION:');
    
    const finalVisibleOrders = await ordersCollection.find({
      'items.sellerId': vishnu._id
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`\n✅ FINAL RESULT: ${finalVisibleOrders.length} orders visible to admin`);
    
    finalVisibleOrders.slice(0, 5).forEach((order, index) => {
      const minutesAgo = Math.round((Date.now() - order.createdAt.getTime()) / 60000);
      console.log(`  ${index + 1}. ${order.orderNumber} (${minutesAgo}min ago) - ${order.orderStatus}`);
    });
    
    if (finalVisibleOrders.length > 5) {
      console.log(`  ... and ${finalVisibleOrders.length - 5} more orders`);
    }
    
    await client.close();
    
    console.log('\n🎉 ORDER VISIBILITY FIX COMPLETE!');
    console.log('🔄 Please refresh the admin frontend to see all orders');
    console.log('💡 The recent order should now appear at the top of the list');
    
  } catch (error) {
    console.error('❌ Error fixing order visibility:', error);
  }
}

fixRecentOrderVisibility().catch(console.error);