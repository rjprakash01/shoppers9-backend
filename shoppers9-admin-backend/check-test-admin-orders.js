const { MongoClient } = require('mongodb');

async function checkTestAdminOrders() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('shoppers9-admin');
    const ordersCollection = db.collection('orders');
    
    const testAdminId = '68bd48f7e03d384b7a2f92ee';
    
    // Check orders with test admin as seller (try both string and ObjectId)
    const { ObjectId } = require('mongodb');
    const ordersWithTestAdmin = await ordersCollection.find({ 
      $or: [
        { 'items.sellerId': testAdminId },
        { 'items.sellerId': new ObjectId(testAdminId) }
      ]
    }).toArray();
    
    console.log(`\nOrders with test admin (${testAdminId}) as seller:`, ordersWithTestAdmin.length);
    
    if (ordersWithTestAdmin.length > 0) {
      console.log('\nSample order with test admin as seller:');
      const sampleOrder = ordersWithTestAdmin[0];
      console.log('Order ID:', sampleOrder._id);
      console.log('Order Number:', sampleOrder.orderNumber);
      console.log('Items with test admin as seller:');
      sampleOrder.items.forEach((item, index) => {
        if (item.sellerId && item.sellerId.toString() === testAdminId) {
          console.log(`  Item ${index + 1}: Product ${item.product}, Seller ${item.sellerId}`);
        }
      });
    }
    
    // Check all recent orders to see sellerId distribution
    const recentOrders = await ordersCollection.find().sort({ createdAt: -1 }).limit(10).toArray();
    console.log('\nRecent 10 orders sellerId distribution:');
    recentOrders.forEach((order, index) => {
      console.log(`Order ${index + 1} (${order.orderNumber}):`);
      order.items.forEach((item, itemIndex) => {
        console.log(`  Item ${itemIndex + 1}: sellerId = ${item.sellerId}`);
      });
    });
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await client.close();
    process.exit(1);
  }
}

checkTestAdminOrders();