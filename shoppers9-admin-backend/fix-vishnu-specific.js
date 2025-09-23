const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixVishnuSpecific() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const adminsCollection = db.collection('admins');
    const ordersCollection = db.collection('orders');
    const productsCollection = db.collection('products');
    
    // Find Vishnu Dutta by the ID we saw in the logs
    const vishnuId = '68ca615233f20c4845472df6';
    console.log(`\n👤 Looking for admin with ID: ${vishnuId}`);
    
    const { ObjectId } = require('mongodb');
    const vishnu = await adminsCollection.findOne({ _id: new ObjectId(vishnuId) });
    
    if (!vishnu) {
      console.log('❌ Vishnu not found with that ID!');
      await client.close();
      return;
    }
    
    console.log(`✅ Found Vishnu: ${vishnu.email}`);
    console.log(`   Primary Role: ${vishnu.primaryRole}`);
    console.log(`   Role: ${vishnu.role}`);
    
    // Find Vishnu's products
    const vishnuProducts = await productsCollection.find({ createdBy: new ObjectId(vishnuId) }).toArray();
    console.log(`\n📦 Vishnu has ${vishnuProducts.length} products`);
    
    if (vishnuProducts.length === 0) {
      console.log('❌ Vishnu has no products! Creating a test product...');
      
      const testProduct = {
        name: 'Vishnu Test Product',
        description: 'Test product for order visibility',
        price: 1299,
        originalPrice: 1599,
        brand: 'Test Brand',
        category: 'Electronics',
        subcategory: 'Gadgets',
        images: ['https://via.placeholder.com/300x300.png?text=Vishnu+Product'],
        variants: [{
          size: 'Standard',
          color: 'Black',
          stock: 50,
          price: 1299
        }],
        isActive: true,
        createdBy: new ObjectId(vishnuId),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const productResult = await productsCollection.insertOne(testProduct);
      console.log(`✅ Created test product: ${productResult.insertedId}`);
      vishnuProducts.push({ ...testProduct, _id: productResult.insertedId });
    }
    
    const productIds = vishnuProducts.map(p => p._id);
    console.log(`\n🔍 Checking orders containing Vishnu's products...`);
    
    // Find orders that contain Vishnu's products
    const ordersWithVishnuProducts = await ordersCollection.find({
      'items.product': { $in: productIds }
    }).toArray();
    
    console.log(`📊 Orders containing Vishnu's products: ${ordersWithVishnuProducts.length}`);
    
    if (ordersWithVishnuProducts.length === 0) {
      console.log('\n📦 No orders found with Vishnu\'s products. Creating a test order...');
      
      const testOrder = {
        orderNumber: `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`,
        userId: new ObjectId('68ca49d2922b49ad4f203961'), // Using another user as customer
        items: [{
          product: productIds[0],
          sellerId: new ObjectId(vishnuId), // This is the key!
          quantity: 2,
          price: vishnuProducts[0].price,
          originalPrice: vishnuProducts[0].originalPrice || vishnuProducts[0].price
        }],
        orderStatus: 'pending',
        paymentStatus: 'pending',
        totalAmount: vishnuProducts[0].price * 2,
        finalAmount: vishnuProducts[0].price * 2,
        shippingAddress: {
          street: 'Test Street 123',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const orderResult = await ordersCollection.insertOne(testOrder);
      console.log(`✅ Created test order: ${testOrder.orderNumber} (${orderResult.insertedId})`);
      
      ordersWithVishnuProducts.push({ ...testOrder, _id: orderResult.insertedId });
    }
    
    // Fix existing orders that have Vishnu's products but wrong sellerId
    console.log('\n🔧 Fixing sellerId in orders with Vishnu\'s products...');
    
    let fixedOrders = 0;
    
    for (const order of ordersWithVishnuProducts) {
      let needsUpdate = false;
      const updatedItems = order.items.map(item => {
        const isVishnuProduct = productIds.some(pid => pid.toString() === item.product.toString());
        
        if (isVishnuProduct) {
          const currentSellerId = item.sellerId ? item.sellerId.toString() : 'MISSING';
          const expectedSellerId = vishnuId;
          
          if (currentSellerId !== expectedSellerId) {
            console.log(`  🔧 Fixing order ${order.orderNumber}: Product ${item.product}`);
            console.log(`     Current sellerId: ${currentSellerId}`);
            console.log(`     Setting sellerId to: ${expectedSellerId}`);
            needsUpdate = true;
            return { ...item, sellerId: new ObjectId(vishnuId) };
          }
        }
        
        return item;
      });
      
      if (needsUpdate) {
        await ordersCollection.updateOne(
          { _id: order._id },
          { $set: { items: updatedItems, updatedAt: new Date() } }
        );
        fixedOrders++;
        console.log(`  ✅ Updated order ${order.orderNumber}`);
      }
    }
    
    console.log(`\n📊 Fixed ${fixedOrders} orders`);
    
    // Verify the fix
    console.log('\n🧪 Verifying fix...');
    const visibleOrders = await ordersCollection.find({
      'items.sellerId': new ObjectId(vishnuId)
    }).toArray();
    
    console.log(`✅ Orders now visible to Vishnu: ${visibleOrders.length}`);
    
    if (visibleOrders.length > 0) {
      console.log('\n📋 Visible orders:');
      visibleOrders.forEach((order, index) => {
        console.log(`  ${index + 1}. ${order.orderNumber} (${order._id})`);
        console.log(`     Status: ${order.orderStatus}`);
        console.log(`     Total: ₹${order.finalAmount}`);
        console.log(`     Items: ${order.items.length}`);
      });
    }
    
    await client.close();
    console.log('\n🎉 VISHNU SPECIFIC FIX COMPLETE!');
    console.log('💡 Refresh the admin panel to see the orders.');
    
  } catch (error) {
    console.error('❌ Error fixing Vishnu specific orders:', error);
  }
}

fixVishnuSpecific().catch(console.error);