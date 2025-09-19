const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function checkOrderDatabases() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const adminDb = client.db('shoppers9-admin');
    const mainDb = client.db('shoppers9');
    const testAdminId = '68bd48f7e03d384b7a2f92ee';
    
    console.log('\n=== CHECKING ORDER DATABASES ===');
    
    // Check orders in admin database
    const adminOrders = await adminDb.collection('orders').find({
      'items.sellerId': new ObjectId(testAdminId)
    }).toArray();
    console.log('Orders in shoppers9-admin DB with test admin sellerId:', adminOrders.length);
    
    // Check orders in main database
    const mainOrders = await mainDb.collection('orders').find({
      'items.sellerId': new ObjectId(testAdminId)
    }).toArray();
    console.log('Orders in shoppers9 DB with test admin sellerId:', mainOrders.length);
    
    console.log('\n=== RECENT ORDERS IN EACH DB ===');
    
    // Recent orders in admin DB
    const recentAdminOrders = await adminDb.collection('orders').find({})
      .sort({createdAt: -1}).limit(3).toArray();
    console.log('\nRecent orders in shoppers9-admin:', recentAdminOrders.length);
    recentAdminOrders.forEach((order, i) => {
      console.log(`  ${i+1}. ${order.orderNumber} - Items: ${order.items?.length || 0}`);
      if (order.items) {
        order.items.forEach((item, j) => {
          console.log(`     Item ${j+1}: sellerId = ${item.sellerId || 'NOT SET'}`);
        });
      }
    });
    
    // Recent orders in main DB
    const recentMainOrders = await mainDb.collection('orders').find({})
      .sort({createdAt: -1}).limit(3).toArray();
    console.log('\nRecent orders in shoppers9:', recentMainOrders.length);
    recentMainOrders.forEach((order, i) => {
      console.log(`  ${i+1}. ${order.orderNumber} - Items: ${order.items?.length || 0}`);
      if (order.items) {
        order.items.forEach((item, j) => {
          console.log(`     Item ${j+1}: sellerId = ${item.sellerId || 'NOT SET'}`);
        });
      }
    });
    
    // Check which database the main backend is using
    console.log('\n=== DATABASE CONFIGURATION CHECK ===');
    console.log('Main backend should be writing to: shoppers9');
    console.log('Admin backend should be reading from: shoppers9-admin');
    console.log('\nISSUE: If main backend writes to shoppers9 but admin reads from shoppers9-admin,');
    console.log('       orders will not be visible to admin users!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkOrderDatabases();