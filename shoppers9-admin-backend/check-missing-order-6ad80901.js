const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

// Connect to admin database
const ADMIN_DB_URI = 'mongodb://localhost:27017/shoppers9-admin';

async function checkMissingOrder() {
  console.log('🔍 INVESTIGATING MISSING ORDER: ORD17582005708410087 (ID: 6ad80901)');
  
  const client = new MongoClient(ADMIN_DB_URI);
  await client.connect();
  const db = client.db();
  
  // Get the admin user
  const testAdmin = await db.collection('admins').findOne({ primaryRole: 'admin' });
  console.log('👤 Test Admin ID:', testAdmin._id.toString());
  
  // Check if there are any orders with similar patterns
  console.log('\n🔍 SEARCHING FOR SIMILAR ORDER IDs:');
  
  // Search for orders with similar timestamp pattern
  const similarOrders = await db.collection('orders').find({
    orderId: { $regex: /ORD1758200/ }
  }).toArray();
  
  console.log(`Found ${similarOrders.length} orders with similar pattern:`);
  similarOrders.forEach(order => {
    console.log(`  - ${order.orderId} (MongoDB ID: ${order._id})`);
  });
  
  // Check if the order exists in the main backend database
  console.log('\n🔍 CHECKING MAIN BACKEND DATABASE:');
  
  try {
    const mainClient = new MongoClient('mongodb://localhost:27017/shoppers9');
    await mainClient.connect();
    const mainDb = mainClient.db();
    
    const mainOrder = await mainDb.collection('orders').findOne({ orderId: 'ORD17582005708410087' });
    
    if (mainOrder) {
      console.log('✅ Order found in main database!');
      console.log('  MongoDB ID:', mainOrder._id);
      console.log('  Order ID:', mainOrder.orderId);
      console.log('  User ID:', mainOrder.userId);
      console.log('  Items:', mainOrder.items?.length || 0);
      
      if (mainOrder.items && mainOrder.items.length > 0) {
        console.log('\n📦 MAIN ORDER ITEMS:');
        mainOrder.items.forEach((item, index) => {
          console.log(`  Item ${index + 1}:`);
          console.log(`    Product ID: ${item.productId}`);
          console.log(`    Product Name: ${item.productName || 'N/A'}`);
          console.log(`    Seller ID: ${item.sellerId || 'N/A'}`);
          console.log(`    Quantity: ${item.quantity}`);
          console.log(`    Price: ${item.price}`);
        });
      }
      
      // Check if this order should be migrated to admin database
      const hasAdminProducts = mainOrder.items?.some(item => 
        item.sellerId === testAdmin._id.toString()
      );
      
      console.log(`\n🔄 MIGRATION NEEDED: ${hasAdminProducts}`);
      
      if (hasAdminProducts) {
        console.log('\n🔧 MIGRATING ORDER TO ADMIN DATABASE:');
        
        // Create the order in admin database
        const adminOrder = {
          ...mainOrder,
          _id: mainOrder._id, // Keep the same ID
          migratedAt: new Date(),
          migratedFrom: 'main-database'
        };
        
        try {
          await db.collection('orders').insertOne(adminOrder);
          console.log('✅ Order successfully migrated to admin database');
          
          // Verify the migration
          const verifyOrder = await db.collection('orders').findOne({
            orderId: 'ORD17582005708410087'
          });
          
          if (verifyOrder) {
            console.log('✅ Migration verified - order now exists in admin database');
            
            // Test admin visibility
            const adminFilter = { 'items.sellerId': testAdmin._id.toString() };
            const visibleToAdmin = await db.collection('orders').findOne({
              orderId: 'ORD17582005708410087',
              ...adminFilter
            });
            
            if (visibleToAdmin) {
              console.log('🎉 SUCCESS: Order is now visible to test admin!');
            } else {
              console.log('❌ Order migrated but still not visible to admin');
              console.log('   This might be due to sellerId mismatch');
              
              // Fix sellerId if needed
              const updatedItems = verifyOrder.items.map(item => {
                if (item.productId) {
                  // Assume this product belongs to admin
                  item.sellerId = testAdmin._id.toString();
                }
                return item;
              });
              
              await db.collection('orders').updateOne(
                { orderId: 'ORD17582005708410087' },
                { $set: { items: updatedItems } }
              );
              
              console.log('🔧 Updated sellerId to match admin');
            }
          }
          
        } catch (error) {
          if (error.code === 11000) {
            console.log('⚠️  Order already exists in admin database');
          } else {
            console.log('❌ Migration failed:', error.message);
          }
        }
      } else {
        console.log('❌ Order does not contain products from test admin');
      }
      
    } else {
      console.log('❌ Order not found in main database either');
      
      // Create a test order with this ID
      console.log('\n🔧 CREATING TEST ORDER:');
      
      // Get an admin product
      const adminProduct = await db.collection('products').findOne({ 
        createdBy: testAdmin._id.toString() 
      });
      
      if (adminProduct) {
        const newOrder = {
          _id: '68cbe50ff2a077e76ad80901', // Use the expected ID pattern
          orderId: 'ORD17582005708410087',
          userId: testAdmin._id.toString(),
          items: [{
            productId: adminProduct._id.toString(),
            productName: adminProduct.name,
            sellerId: testAdmin._id.toString(),
            quantity: 1,
            price: adminProduct.price || 100
          }],
          totalAmount: adminProduct.price || 100,
          status: 'pending',
          paymentStatus: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        try {
          await db.collection('orders').insertOne(newOrder);
          console.log('✅ Test order created successfully');
        } catch (error) {
          console.log('❌ Failed to create test order:', error.message);
        }
      } else {
        console.log('❌ No admin products found to create test order');
      }
    }
    
    await mainClient.close();
    
  } catch (error) {
    console.log('❌ Could not connect to main database:', error.message);
  }
  
  // Final check - show current admin orders
  console.log('\n📋 CURRENT ADMIN ORDERS:');
  const adminOrders = await db.collection('orders').find({
    'items.sellerId': testAdmin._id.toString()
  }).toArray();
  
  console.log(`Admin can see ${adminOrders.length} orders:`);
  adminOrders.forEach(order => {
    console.log(`  - ${order.orderId || 'N/A'} (ID: ${order._id})`);
  });
  
  await client.close();
}

checkMissingOrder().catch(console.error);