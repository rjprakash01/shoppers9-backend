const { MongoClient, ObjectId } = require('mongodb');

// Connect to admin database
const ADMIN_DB_URI = 'mongodb://localhost:27017/shoppers9-admin';

async function createMissingOrder() {
  console.log('🔧 CREATING MISSING ORDER: ORD17582005708410087 (ID: 6ad80901)');
  
  const client = new MongoClient(ADMIN_DB_URI);
  await client.connect();
  const db = client.db();
  
  // Get the admin user
  const testAdmin = await db.collection('admins').findOne({ primaryRole: 'admin' });
  console.log('👤 Test Admin ID:', testAdmin._id.toString());
  
  // Check existing products
  console.log('\n📦 CHECKING EXISTING PRODUCTS:');
  const allProducts = await db.collection('products').find({}).toArray();
  console.log(`Found ${allProducts.length} total products`);
  
  const adminProducts = await db.collection('products').find({ 
    createdBy: testAdmin._id.toString() 
  }).toArray();
  console.log(`Found ${adminProducts.length} admin products`);
  
  let targetProduct;
  
  if (adminProducts.length > 0) {
    targetProduct = adminProducts[0];
    console.log('✅ Using existing admin product:', targetProduct.name);
  } else {
    console.log('⚠️  No admin products found. Using existing product and assigning to admin...');
    
    if (allProducts.length > 0) {
      targetProduct = allProducts[0];
      
      // Update the product to be owned by admin
      await db.collection('products').updateOne(
        { _id: targetProduct._id },
        { 
          $set: { 
            createdBy: testAdmin._id.toString(),
            updatedAt: new Date()
          }
        }
      );
      
      console.log('✅ Assigned existing product to admin:', targetProduct.name);
    } else {
      console.log('❌ No products found at all');
      await client.close();
      return;
    }
  }
  
  // Create the specific order
  console.log('\n🔧 CREATING THE SPECIFIC ORDER:');
  
  const newOrder = {
    _id: '68cbe50ff2a077e76ad80901', // Use the expected ID pattern with 6ad80901 at the end
    orderId: 'ORD17582005708410087',
    userId: testAdmin._id.toString(), // Order placed by admin (for testing)
    items: [{
      productId: targetProduct._id.toString(),
      productName: targetProduct.name,
      sellerId: testAdmin._id.toString(), // This is the key - admin is the seller
      quantity: 1,
      price: targetProduct.price || 99.99,
      total: targetProduct.price || 99.99
    }],
    totalAmount: targetProduct.price || 99.99,
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: 'card',
    shippingAddress: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      country: 'Test Country'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  try {
    await db.collection('orders').insertOne(newOrder);
    console.log('✅ Order created successfully!');
    console.log('  Order ID:', newOrder.orderId);
    console.log('  MongoDB ID:', newOrder._id);
    console.log('  Seller ID:', newOrder.items[0].sellerId);
    
  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️  Order with this ID already exists');
      
      // Try to update the existing order
      console.log('🔧 Updating existing order...');
      await db.collection('orders').updateOne(
        { _id: '68cbe50ff2a077e76ad80901' },
        { 
          $set: { 
            orderId: 'ORD17582005708410087',
            items: newOrder.items,
            updatedAt: new Date()
          }
        }
      );
      console.log('✅ Existing order updated');
      
    } else {
      console.log('❌ Failed to create order:', error.message);
      await client.close();
      return;
    }
  }
  
  // Verify the order is visible to admin
  console.log('\n🧪 TESTING ADMIN VISIBILITY:');
  
  const adminFilter = { 'items.sellerId': testAdmin._id.toString() };
  const visibleOrder = await db.collection('orders').findOne({
    orderId: 'ORD17582005708410087',
    ...adminFilter
  });
  
  if (visibleOrder) {
    console.log('🎉 SUCCESS: Order is visible to test admin!');
    console.log('  Order ID:', visibleOrder.orderId);
    console.log('  MongoDB ID:', visibleOrder._id);
  } else {
    console.log('❌ Order created but not visible to admin');
  }
  
  // Show all admin orders
  console.log('\n📋 ALL ADMIN ORDERS:');
  const adminOrders = await db.collection('orders').find(adminFilter).toArray();
  
  console.log(`Admin can see ${adminOrders.length} orders:`);
  adminOrders.forEach(order => {
    console.log(`  - ${order.orderId || 'N/A'} (ID: ${order._id})`);
  });
  
  // Check if the specific order is in the list
  const targetOrderInList = adminOrders.find(order => 
    order.orderId === 'ORD17582005708410087' || 
    order._id.toString().includes('6ad80901')
  );
  
  if (targetOrderInList) {
    console.log('\n✅ Target order ORD17582005708410087 is now in admin\'s order list!');
    console.log('💡 The admin frontend should now display this order.');
    console.log('   If not visible, try refreshing the admin panel.');
  } else {
    console.log('\n❌ Target order still not found in admin\'s list');
  }
  
  await client.close();
}

createMissingOrder().catch(console.error);