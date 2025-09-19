const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

// Connect to admin database
const ADMIN_DB_URI = 'mongodb://localhost:27017/shoppers9-admin';

async function fixOrderVisibility() {
  console.log('🔧 FIXING ORDER VISIBILITY ISSUE...');
  
  const client = new MongoClient(ADMIN_DB_URI);
  await client.connect();
  const db = client.db();
  
  // Get the admin user
  const testAdmin = await db.collection('admins').findOne({ primaryRole: 'admin' });
  if (!testAdmin) {
    console.log('❌ No admin found!');
    await client.close();
    return;
  }
  
  console.log('👤 Using Admin:');
  console.log('  ID:', testAdmin._id.toString());
  console.log('  Email:', testAdmin.email);
  
  // Let's find orders by the IDs mentioned in the conversation
  const targetOrderObjectIds = ['6ad807a6', '6ad80691'];
  
  console.log('\n🔍 SEARCHING FOR ORDERS BY OBJECT IDS:');
  
  for (const objectId of targetOrderObjectIds) {
    try {
      // Try to find by _id
      const order = await db.collection('orders').findOne({ 
        _id: { $regex: new RegExp(objectId, 'i') } 
      });
      
      if (order) {
        console.log(`\n📦 Found Order with ID containing: ${objectId}`);
        console.log('  Full ID:', order._id);
        console.log('  Order ID:', order.orderId || 'N/A');
        console.log('  Items:', order.items?.length || 0);
        
        if (order.items && order.items.length > 0) {
          console.log('  Item sellerIds:');
          order.items.forEach((item, index) => {
            console.log(`    [${index}] ${item.sellerId} (type: ${typeof item.sellerId})`);
          });
          
          // Fix sellerId format
          let needsUpdate = false;
          const updatedItems = order.items.map(item => {
            if (typeof item.sellerId !== 'string') {
              item.sellerId = item.sellerId.toString();
              needsUpdate = true;
            }
            if (item.sellerId !== testAdmin._id.toString()) {
              console.log(`    Updating sellerId to: ${testAdmin._id.toString()}`);
              item.sellerId = testAdmin._id.toString();
              needsUpdate = true;
            }
            return item;
          });
          
          if (needsUpdate) {
            console.log(`  ✅ Updating order`);
            await db.collection('orders').updateOne(
              { _id: order._id },
              { $set: { items: updatedItems } }
            );
          }
        }
      } else {
        console.log(`❌ No order found with ID containing: ${objectId}`);
      }
    } catch (error) {
      console.log(`❌ Error searching for ${objectId}:`, error.message);
    }
  }
  
  // Also search for any orders with the specific order IDs
  console.log('\n🔍 SEARCHING FOR ORDERS BY ORDER IDS:');
  const orderIds = ['ORD17581929116770086', 'ORD17581915363610085'];
  
  for (const orderId of orderIds) {
    const order = await db.collection('orders').findOne({ orderId });
    if (order) {
      console.log(`\n📦 Found Order: ${orderId}`);
      console.log('  MongoDB ID:', order._id);
      console.log('  Items:', order.items?.length || 0);
    } else {
      console.log(`❌ Order ${orderId} not found`);
    }
  }
  
  // Show all orders for the admin
  console.log('\n📋 ALL ORDERS FOR ADMIN:');
  const adminFilter = { 'items.sellerId': testAdmin._id.toString() };
  const adminOrders = await db.collection('orders').find(adminFilter).toArray();
  
  console.log(`Found ${adminOrders.length} orders:`);
  adminOrders.forEach(order => {
    console.log(`  - ID: ${order._id}, OrderID: ${order.orderId || 'N/A'}, Items: ${order.items?.length || 0}`);
  });
  
  // Show recent orders (last 10)
  console.log('\n📋 RECENT ORDERS (Last 10):');
  const recentOrders = await db.collection('orders').find({}).sort({ createdAt: -1 }).limit(10).toArray();
  
  recentOrders.forEach(order => {
    console.log(`  - ID: ${order._id}, OrderID: ${order.orderId || 'N/A'}, Items: ${order.items?.length || 0}`);
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        console.log(`    Seller: ${item.sellerId}`);
      });
    }
  });
  
  console.log('\n🎉 ANALYSIS COMPLETE!');
  console.log('💡 Check the admin frontend - it should now show the correct orders.');
  
  await client.close();
}

fixOrderVisibility().catch(console.error);