const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');

async function createTestOrder() {
  try {
    console.log('🛒 Creating test order for admin user...');
    
    const client = new MongoClient('mongodb://localhost:27017/shoppers9');
    await client.connect();
    const db = client.db();
    
    // Get the test admin user
    const testAdmin = await db.collection('admins').findOne({ email: 'admin@shoppers9.com' });
    if (!testAdmin) {
      console.log('❌ Test admin not found!');
      return;
    }
    
    console.log(`👤 Test Admin ID: ${testAdmin._id}`);
    
    // Create a test order
    const testOrder = {
      _id: new ObjectId(),
      orderNumber: `TEST${Date.now()}`,
      orderId: `ORD${Date.now()}`,
      userId: new ObjectId(),
      items: [{
        productId: new ObjectId(),
        sellerId: testAdmin._id, // Assign to test admin
        name: 'Test Product for Admin',
        price: 100,
        quantity: 1,
        total: 100
      }],
      totalAmount: 100,
      paymentStatus: 'completed',
      orderStatus: 'pending',
      shippingAddress: {
        street: 'Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'India'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the order
    await db.collection('orders').insertOne(testOrder);
    
    console.log(`✅ Test order created: ${testOrder.orderNumber}`);
    console.log(`   Order ID: ${testOrder.orderId}`);
    console.log(`   Seller ID: ${testOrder.items[0].sellerId}`);
    
    // Verify the order was created
    const createdOrder = await db.collection('orders').findOne({ orderNumber: testOrder.orderNumber });
    if (createdOrder) {
      console.log('✅ Order verified in database');
    }
    
    // Check how many orders the test admin now has
    const adminOrders = await db.collection('orders').find({
      'items.sellerId': testAdmin._id
    }).toArray();
    
    console.log(`📊 Total orders for test admin: ${adminOrders.length}`);
    
    await client.close();
    console.log('\n🎉 Test order creation completed!');
    console.log('\n📝 Next: Check the admin panel to see if this order appears automatically');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestOrder();