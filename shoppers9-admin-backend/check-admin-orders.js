const mongoose = require('mongoose');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoppers9', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function checkAdminOrders() {
  try {
    await connectDB();
    console.log('🔍 Checking Admin Orders Visibility...');
    
    const adminsCollection = mongoose.connection.db.collection('admins');
    const ordersCollection = mongoose.connection.db.collection('orders');
    
    // Get all admins
    const admins = await adminsCollection.find({}).toArray();
    console.log('\n👥 Admin Users:');
    
    for (const admin of admins) {
      console.log(`\n📋 Admin: ${admin.email}`);
      console.log(`   ID: ${admin._id}`);
      console.log(`   Primary Role: ${admin.primaryRole || 'NOT SET'}`);
      console.log(`   Role: ${admin.role || 'NOT SET'}`);
      
      // Find orders for this admin
      const adminOrders = await ordersCollection.find({
        'items.sellerId': admin._id
      }).toArray();
      
      console.log(`   Orders Found: ${adminOrders.length}`);
      
      if (adminOrders.length > 0) {
        console.log('   📦 Order Numbers:');
        adminOrders.slice(0, 5).forEach(order => {
          console.log(`     - ${order.orderNumber}`);
        });
        if (adminOrders.length > 5) {
          console.log(`     ... and ${adminOrders.length - 5} more`);
        }
      }
    }
    
    // Check orders with seller IDs
    console.log('\n📊 Orders with Seller IDs:');
    const ordersWithSellers = await ordersCollection.find({
      'items.sellerId': { $exists: true, $ne: null }
    }).toArray();
    
    console.log(`Total orders with sellers: ${ordersWithSellers.length}`);
    
    // Group by seller ID
    const sellerOrderCounts = {};
    ordersWithSellers.forEach(order => {
      order.items.forEach(item => {
        if (item.sellerId) {
          const sellerId = item.sellerId.toString();
          sellerOrderCounts[sellerId] = (sellerOrderCounts[sellerId] || 0) + 1;
        }
      });
    });
    
    console.log('\n📈 Orders by Seller ID:');
    Object.entries(sellerOrderCounts).forEach(([sellerId, count]) => {
      console.log(`   ${sellerId}: ${count} order items`);
    });
    
    // Test the filtering query that admin backend uses
    console.log('\n🧪 Testing Admin Backend Query:');
    for (const admin of admins) {
      const testQuery = { 'items.sellerId': admin._id };
      const testResults = await ordersCollection.find(testQuery).toArray();
      console.log(`   Admin ${admin.email}: Query { 'items.sellerId': '${admin._id}' } returns ${testResults.length} orders`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkAdminOrders();