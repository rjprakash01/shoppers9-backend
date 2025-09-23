const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkAllAdmins() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const adminsCollection = db.collection('admins');
    const ordersCollection = db.collection('orders');
    const productsCollection = db.collection('products');
    
    // Find all admins
    console.log('\n👥 All admin users:');
    const allAdmins = await adminsCollection.find({}).toArray();
    
    if (allAdmins.length === 0) {
      console.log('❌ No admin users found!');
      await client.close();
      return;
    }
    
    console.log(`📊 Found ${allAdmins.length} admin users:`);
    
    for (const admin of allAdmins) {
      console.log(`\n👤 Admin: ${admin.email || 'No email'}`);
      console.log(`   ID: ${admin._id}`);
      console.log(`   Primary Role: ${admin.primaryRole || 'NOT SET'}`);
      console.log(`   Role: ${admin.role || 'NOT SET'}`);
      console.log(`   Active: ${admin.isActive !== false ? '✅' : '❌'}`);
      
      // Check products created by this admin
      const adminProducts = await productsCollection.find({ createdBy: admin._id }).toArray();
      console.log(`   Products: ${adminProducts.length}`);
      
      if (adminProducts.length > 0) {
        console.log(`   📦 Product names:`);
        adminProducts.slice(0, 3).forEach(product => {
          console.log(`     - ${product.name}`);
        });
        if (adminProducts.length > 3) {
          console.log(`     ... and ${adminProducts.length - 3} more`);
        }
      }
      
      // Check orders visible to this admin
      const adminOrders = await ordersCollection.find({
        'items.sellerId': admin._id
      }).toArray();
      console.log(`   Visible Orders: ${adminOrders.length}`);
      
      if (adminOrders.length > 0) {
        console.log(`   📋 Order numbers:`);
        adminOrders.slice(0, 3).forEach(order => {
          console.log(`     - ${order.orderNumber || 'N/A'}`);
        });
        if (adminOrders.length > 3) {
          console.log(`     ... and ${adminOrders.length - 3} more`);
        }
      }
    }
    
    // Check for orders with products but missing sellerId
    console.log('\n🔍 Checking for potential issues...');
    
    const totalOrders = await ordersCollection.countDocuments();
    console.log(`📊 Total orders: ${totalOrders}`);
    
    const ordersWithSellerId = await ordersCollection.countDocuments({
      'items.sellerId': { $exists: true, $ne: null }
    });
    console.log(`📊 Orders with sellerId: ${ordersWithSellerId}`);
    
    const ordersWithoutSellerId = await ordersCollection.countDocuments({
      $or: [
        { 'items.sellerId': { $exists: false } },
        { 'items.sellerId': null }
      ]
    });
    console.log(`📊 Orders without sellerId: ${ordersWithoutSellerId}`);
    
    // Sample some recent orders
    console.log('\n📋 Recent orders sample:');
    const recentOrders = await ordersCollection.find({}).sort({ createdAt: -1 }).limit(5).toArray();
    
    recentOrders.forEach((order, index) => {
      console.log(`\n  ${index + 1}. Order ${order.orderNumber || 'N/A'} (${order._id})`);
      console.log(`     Created: ${order.createdAt}`);
      console.log(`     Status: ${order.orderStatus}`);
      console.log(`     Items: ${order.items?.length || 0}`);
      
      if (order.items && order.items.length > 0) {
        order.items.forEach((item, itemIndex) => {
          console.log(`       Item ${itemIndex + 1}:`);
          console.log(`         Product: ${item.product || 'MISSING'}`);
          console.log(`         Seller ID: ${item.sellerId || 'MISSING'}`);
          console.log(`         Quantity: ${item.quantity || 'MISSING'}`);
        });
      }
    });
    
    await client.close();
    console.log('\n🎉 ADMIN CHECK COMPLETE!');
    
  } catch (error) {
    console.error('❌ Error checking admins:', error);
  }
}

checkAllAdmins().catch(console.error);