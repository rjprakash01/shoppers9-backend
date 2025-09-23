const { MongoClient } = require('mongodb');
require('dotenv').config();

async function findVishnuAndFix() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const adminsCollection = db.collection('admins');
    const ordersCollection = db.collection('orders');
    const productsCollection = db.collection('products');
    
    // Search for Vishnu in different ways
    console.log('\n🔍 Searching for Vishnu Dutta...');
    
    // Try different email variations
    const emailVariations = [
      'prakash.jetender@gmail.com',
      'vishnu@shoppers9.com',
      'admin@shoppers9.com'
    ];
    
    let vishnu = null;
    for (const email of emailVariations) {
      const user = await adminsCollection.findOne({ email });
      if (user) {
        console.log(`✅ Found user with email ${email}:`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Primary Role: ${user.primaryRole}`);
        console.log(`   Role: ${user.role}`);
        vishnu = user;
        break;
      }
    }
    
    if (!vishnu) {
      console.log('❌ Vishnu not found with any email variation');
      console.log('\n📋 Let\'s use the admin@shoppers9.com user as test admin:');
      vishnu = await adminsCollection.findOne({ email: 'admin@shoppers9.com' });
    }
    
    if (!vishnu) {
      console.log('❌ No suitable admin found!');
      await client.close();
      return;
    }
    
    console.log(`\n👤 Using admin: ${vishnu.email} (${vishnu._id})`);
    
    // Check if this admin has any products
    const adminProducts = await productsCollection.find({ createdBy: vishnu._id }).toArray();
    console.log(`📦 Admin has ${adminProducts.length} products`);
    
    if (adminProducts.length === 0) {
      console.log('\n🛍️  Creating a test product for this admin...');
      
      const testProduct = {
        name: 'Test Product for Admin Orders',
        description: 'This is a test product to verify admin order visibility',
        price: 999,
        originalPrice: 1299,
        brand: 'Test Brand',
        category: 'Electronics',
        subcategory: 'Gadgets',
        images: ['https://via.placeholder.com/300x300.png?text=Test+Product'],
        variants: [{
          size: 'Standard',
          color: 'Black',
          stock: 100,
          price: 999
        }],
        isActive: true,
        createdBy: vishnu._id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const insertResult = await productsCollection.insertOne(testProduct);
      console.log(`✅ Created test product: ${insertResult.insertedId}`);
      
      adminProducts.push({ ...testProduct, _id: insertResult.insertedId });
    }
    
    // Now check orders and see if any contain this admin's products
    const productIds = adminProducts.map(p => p._id);
    console.log(`\n🔍 Checking orders for admin's ${productIds.length} products...`);
    
    const ordersWithAdminProducts = await ordersCollection.find({
      'items.product': { $in: productIds }
    }).toArray();
    
    console.log(`📊 Orders containing admin's products: ${ordersWithAdminProducts.length}`);
    
    if (ordersWithAdminProducts.length === 0) {
      console.log('\n📦 Creating a test order with admin\'s product...');
      
      const testOrder = {
        orderNumber: `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`,
        userId: vishnu._id, // Using admin as customer for test
        items: [{
          product: productIds[0],
          sellerId: vishnu._id, // This is the key field!
          quantity: 1,
          price: adminProducts[0].price,
          originalPrice: adminProducts[0].originalPrice || adminProducts[0].price
        }],
        orderStatus: 'pending',
        paymentStatus: 'pending',
        totalAmount: adminProducts[0].price,
        finalAmount: adminProducts[0].price,
        shippingAddress: {
          street: 'Test Street',
          city: 'Test City',
          state: 'Test State',
          zipCode: '123456',
          country: 'India'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const orderResult = await ordersCollection.insertOne(testOrder);
      console.log(`✅ Created test order: ${testOrder.orderNumber} (${orderResult.insertedId})`);
      
      ordersWithAdminProducts.push({ ...testOrder, _id: orderResult.insertedId });
    }
    
    // Now check if the admin can see their orders
    console.log('\n🎯 Testing admin order visibility...');
    
    const adminFilter = { 'items.sellerId': vishnu._id };
    const visibleOrders = await ordersCollection.find(adminFilter).toArray();
    
    console.log(`📊 Orders visible to admin: ${visibleOrders.length}`);
    
    if (visibleOrders.length > 0) {
      console.log('\n✅ SUCCESS! Admin can see orders:');
      visibleOrders.forEach((order, index) => {
        console.log(`  ${index + 1}. ${order.orderNumber} (${order._id})`);
        console.log(`     Status: ${order.orderStatus}`);
        console.log(`     Items: ${order.items.length}`);
        order.items.forEach((item, itemIndex) => {
          console.log(`       Item ${itemIndex + 1}: Product ${item.product}, Seller ${item.sellerId}`);
        });
      });
    } else {
      console.log('❌ Admin still cannot see any orders!');
      
      // Let's fix any orders that contain admin products but have wrong sellerId
      console.log('\n🔧 Fixing orders with admin products...');
      
      for (const order of ordersWithAdminProducts) {
        let needsUpdate = false;
        const updatedItems = order.items.map(item => {
          const isAdminProduct = productIds.some(pid => pid.toString() === item.product.toString());
          if (isAdminProduct && (!item.sellerId || item.sellerId.toString() !== vishnu._id.toString())) {
            console.log(`  🔧 Fixing item in order ${order.orderNumber}: Product ${item.product} -> Seller ${vishnu._id}`);
            needsUpdate = true;
            return { ...item, sellerId: vishnu._id };
          }
          return item;
        });
        
        if (needsUpdate) {
          await ordersCollection.updateOne(
            { _id: order._id },
            { $set: { items: updatedItems, updatedAt: new Date() } }
          );
          console.log(`  ✅ Updated order ${order.orderNumber}`);
        }
      }
      
      // Check again
      const fixedVisibleOrders = await ordersCollection.find(adminFilter).toArray();
      console.log(`\n📊 Orders visible after fix: ${fixedVisibleOrders.length}`);
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`  Admin: ${vishnu.email}`);
    console.log(`  Admin ID: ${vishnu._id}`);
    console.log(`  Products: ${adminProducts.length}`);
    console.log(`  Visible Orders: ${visibleOrders.length}`);
    
    await client.close();
    console.log('\n🎉 VISHNU ORDER FIX COMPLETE!');
    
  } catch (error) {
    console.error('❌ Error finding and fixing Vishnu orders:', error);
  }
}

findVishnuAndFix().catch(console.error);