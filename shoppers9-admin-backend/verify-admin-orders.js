const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function verifyAdminOrders() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('shoppers9');
    const testAdminId = '68bd48f7e03d384b7a2f92ee';
    
    // Check orders visible to test admin
    const orders = await db.collection('orders').find({
      'items.sellerId': new ObjectId(testAdminId)
    }).sort({ createdAt: -1 }).toArray();
    
    console.log('\n📋 Orders visible to test admin:', orders.length);
    
    orders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.orderNumber} - ${order.createdAt} - Status: ${order.status}`);
      console.log('   Items:', order.items.map(item => `${item.name} (Seller: ${item.sellerId})`));
      console.log('   Total: $' + order.totalAmount);
      console.log('');
    });
    
    if (orders.length > 0) {
      console.log('✅ SUCCESS! Test admin can now see orders in the system.');
    } else {
      console.log('❌ No orders found for test admin.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

verifyAdminOrders();