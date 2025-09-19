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

async function checkRecentOrders() {
  try {
    await connectDB();
    console.log('🔍 Checking Recent Orders...');

    const ordersCollection = mongoose.connection.db.collection('orders');
    const adminsCollection = mongoose.connection.db.collection('admins');

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    console.log(`📅 Checking orders from ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    // Find all orders created today
    const todaysOrders = await ordersCollection.find({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    }).toArray();

    console.log(`\n📦 Orders Created Today: ${todaysOrders.length}`);

    for (const order of todaysOrders) {
      console.log(`\n🛍️ Order: ${order.orderNumber}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log(`   User ID: ${order.userId}`);
      console.log(`   Status: ${order.status || order.orderStatus}`);
      console.log(`   Payment: ${order.paymentStatus}`);
      console.log(`   Items: ${order.items.length}`);
      
      for (const item of order.items) {
        console.log(`     - Product: ${item.product} (Seller: ${item.sellerId})`);
      }
    }

    // Check all orders in the database
    const totalOrders = await ordersCollection.countDocuments();
    const allOrders = await ordersCollection.find({}).sort({ createdAt: -1 }).limit(10).toArray();
    console.log(`\n📊 Total Orders in Database: ${totalOrders}`);
    console.log(`\n🕐 Last 10 Orders:`);
    
    for (const order of allOrders) {
      console.log(`   ${order.orderNumber} - ${order.createdAt} - User: ${order.userId} - Items: ${order.items.length}`);
    }

    // Check admin user details
    const adminUser = await adminsCollection.findOne({ email: 'admin@shoppers9.com' });
    console.log(`\n👤 Admin User Details:`);
    console.log(`   ID: ${adminUser._id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Active: ${adminUser.isActive}`);

    // Check if there are orders with different seller IDs
    const ordersBySeller = await ordersCollection.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.sellerId', count: { $sum: 1 }, orders: { $addToSet: '$orderNumber' } } },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log(`\n📈 Orders by Seller ID:`);
    for (const seller of ordersBySeller) {
      console.log(`   Seller ${seller._id}: ${seller.count} items in ${seller.orders.length} orders`);
      if (seller.orders.length <= 5) {
        console.log(`     Orders: ${seller.orders.join(', ')}`);
      } else {
        console.log(`     Orders: ${seller.orders.slice(0, 5).join(', ')} ... and ${seller.orders.length - 5} more`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkRecentOrders();