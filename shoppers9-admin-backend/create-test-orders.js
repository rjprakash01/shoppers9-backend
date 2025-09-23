const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function createTestOrders() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const ordersCollection = db.collection('orders');
    const productsCollection = db.collection('products');
    
    const adminId = new ObjectId('68ca615233f20c4845472df6'); // prakash.jetender@gmail.com
    
    console.log('\n🔧 CREATING TEST ORDERS FOR PRAKASH.JETENDER@GMAIL.COM');
    console.log('=' .repeat(60));
    
    // Get admin's products
    const adminProducts = await productsCollection.find({ createdBy: adminId }).toArray();
    console.log(`Found ${adminProducts.length} products for admin`);
    
    if (adminProducts.length === 0) {
      console.log('🔧 Creating a test product first...');
      
      const testProduct = {
        name: 'Prakash Test Product',
        description: 'Test product for order visibility testing',
        price: 1999,
        originalPrice: 2499,
        brand: 'TestBrand',
        category: 'Electronics',
        subcategory: 'Accessories',
        images: ['https://via.placeholder.com/300x300.png?text=Test+Product'],
        variants: [{ size: 'Standard', color: 'Black', stock: 100, price: 1999 }],
        isActive: true,
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const productResult = await productsCollection.insertOne(testProduct);
      console.log(`✅ Created test product: ${productResult.insertedId}`);
      adminProducts.push({ ...testProduct, _id: productResult.insertedId });
    }
    
    // Create multiple test orders
    console.log('\n📋 Creating test orders...');
    
    const testOrders = [
      {
        orderNumber: `TEST${Date.now()}001`,
        userId: new ObjectId('68bd48f7e03d384b7a2f92ee'), // Customer ID
        items: [{
          product: adminProducts[0]._id,
          sellerId: adminId, // CRITICAL: This must match the admin ID
          quantity: 1,
          price: adminProducts[0].price,
          originalPrice: adminProducts[0].originalPrice,
          name: adminProducts[0].name
        }],
        orderStatus: 'pending',
        paymentStatus: 'paid',
        totalAmount: adminProducts[0].price,
        finalAmount: adminProducts[0].price,
        shippingAddress: {
          street: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India'
        },
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        updatedAt: new Date()
      },
      {
        orderNumber: `TEST${Date.now()}002`,
        userId: new ObjectId('68cc0c7b12553ee4cba0565c'), // Another customer
        items: [{
          product: adminProducts[0]._id,
          sellerId: adminId, // CRITICAL: This must match the admin ID
          quantity: 2,
          price: adminProducts[0].price,
          originalPrice: adminProducts[0].originalPrice,
          name: adminProducts[0].name
        }],
        orderStatus: 'confirmed',
        paymentStatus: 'paid',
        totalAmount: adminProducts[0].price * 2,
        finalAmount: adminProducts[0].price * 2,
        shippingAddress: {
          street: '456 Another Street',
          city: 'Delhi',
          state: 'Delhi',
          zipCode: '110001',
          country: 'India'
        },
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
        updatedAt: new Date()
      },
      {
        orderNumber: `TEST${Date.now()}003`,
        userId: new ObjectId('68beb3ede848e94bb2067119'), // Third customer
        items: [{
          product: adminProducts[0]._id,
          sellerId: adminId, // CRITICAL: This must match the admin ID
          quantity: 1,
          price: adminProducts[0].price,
          originalPrice: adminProducts[0].originalPrice,
          name: adminProducts[0].name
        }],
        orderStatus: 'delivered',
        paymentStatus: 'paid',
        totalAmount: adminProducts[0].price,
        finalAmount: adminProducts[0].price,
        shippingAddress: {
          street: '789 Third Street',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560001',
          country: 'India'
        },
        createdAt: new Date(Date.now() - 10800000), // 3 hours ago
        updatedAt: new Date()
      }
    ];
    
    // Insert all test orders
    for (const order of testOrders) {
      const result = await ordersCollection.insertOne(order);
      console.log(`✅ Created order: ${order.orderNumber} (${result.insertedId})`);
      console.log(`   - Items: ${order.items.length}`);
      console.log(`   - SellerId: ${order.items[0].sellerId}`);
      console.log(`   - Status: ${order.orderStatus}`);
      console.log(`   - Total: ₹${order.finalAmount}`);
    }
    
    // Verify the orders are visible
    console.log('\n🧪 Verifying order visibility...');
    
    const visibleOrders = await ordersCollection.find({
      'items.sellerId': adminId
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`\n✅ SUCCESS! Admin can now see ${visibleOrders.length} orders:`);
    
    visibleOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. ${order.orderNumber}`);
      console.log(`     Status: ${order.orderStatus}`);
      console.log(`     Payment: ${order.paymentStatus}`);
      console.log(`     Total: ₹${order.finalAmount}`);
      console.log(`     Created: ${order.createdAt.toLocaleString()}`);
      console.log(`     SellerId: ${order.items[0].sellerId}`);
      console.log('');
    });
    
    await client.close();
    
    console.log('🎉 TEST ORDERS CREATED SUCCESSFULLY!');
    console.log('💡 The admin panel should now show orders for prakash.jetender@gmail.com');
    console.log('🔄 Refresh the admin frontend to see the changes.');
    
  } catch (error) {
    console.error('❌ Error creating test orders:', error);
  }
}

createTestOrders().catch(console.error);