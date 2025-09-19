const { MongoClient } = require('mongodb');

async function createTestOrderForAdmin() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const shoppers9Db = client.db('shoppers9');
    const adminDb = client.db('shoppers9-admin');
    
    const productsCollection = shoppers9Db.collection('products');
    const ordersCollection = adminDb.collection('orders');
    const usersCollection = shoppers9Db.collection('users');
    
    const testAdminId = '68bd48f7e03d384b7a2f92ee';
    const { ObjectId } = require('mongodb');
    
    // Get test admin's first product
    const adminProduct = await productsCollection.findOne({ 
      createdBy: new ObjectId(testAdminId)
    });
    
    if (!adminProduct) {
      console.log('❌ No products found for test admin!');
      return;
    }
    
    console.log(`\n📦 Using test admin's product: ${adminProduct.name} (ID: ${adminProduct._id})`);
    
    // Find or create a customer user to simulate the order
    let customer = await usersCollection.findOne({ 
      primaryRole: 'customer',
      isActive: true
    });
    
    if (!customer) {
      console.log('📝 No customer found, creating test customer...');
      const testCustomer = {
        _id: new ObjectId(),
        firstName: 'Test',
        lastName: 'Customer',
        email: 'testcustomer@example.com',
        password: '$2b$10$hashedpassword', // placeholder hashed password
        primaryRole: 'customer',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await usersCollection.insertOne(testCustomer);
      customer = testCustomer;
      console.log('✅ Created test customer:', customer.firstName, customer.lastName);
    }
    
    console.log(`\n👤 Using customer: ${customer.firstName} ${customer.lastName} (ID: ${customer._id})`);
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Create test order
    const testOrder = {
      orderNumber: orderNumber,
      userId: customer._id.toString(),
      items: [{
        product: adminProduct._id.toString(),
        variantId: 'default',
        size: 'M',
        quantity: 1,
        price: adminProduct.price || 10,
        originalPrice: adminProduct.price || 10,
        discount: 0,
        sellerId: new ObjectId(testAdminId) // This is the key field!
      }],
      shippingAddress: {
        name: `${customer.firstName} ${customer.lastName}`,
        phone: '9876543210',
        addressLine1: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      billingAddress: {
        name: `${customer.firstName} ${customer.lastName}`,
        phone: '9876543210',
        addressLine1: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      paymentMethod: 'COD',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      totalAmount: adminProduct.price || 10,
      discount: 0,
      platformFee: 0,
      deliveryCharge: 0,
      finalAmount: adminProduct.price || 10,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the test order
    const result = await ordersCollection.insertOne(testOrder);
    console.log(`\n✅ Test order created: ${orderNumber}`);
    console.log(`   Order ID: ${result.insertedId}`);
    console.log(`   Product: ${adminProduct.name}`);
    console.log(`   Customer: ${customer.firstName} ${customer.lastName}`);
    console.log(`   Seller ID: ${testAdminId}`);
    
    // Verify the order is now visible to test admin
    const visibleOrders = await ordersCollection.find({
      'items.sellerId': new ObjectId(testAdminId)
    }).toArray();
    
    console.log(`\n📊 Orders now visible to test admin: ${visibleOrders.length}`);
    
    if (visibleOrders.length > 0) {
      console.log('\n🎉 SUCCESS! Test admin can now see orders:');
      visibleOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. ${order.orderNumber} - ${order.createdAt}`);
      });
    }
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await client.close();
    process.exit(1);
  }
}

createTestOrderForAdmin();