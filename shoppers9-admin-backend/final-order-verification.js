const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function finalOrderVerification() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const ordersCollection = db.collection('orders');
    const adminsCollection = db.collection('admins');
    
    console.log('\n🔍 FINAL ORDER VERIFICATION FOR VISHNU ADMIN');
    console.log('=' .repeat(60));
    
    // Find Vishnu admin
    const vishnu = await adminsCollection.findOne({ email: 'prakash.jetender@gmail.com' });
    console.log(`✅ Admin: ${vishnu.email} (ID: ${vishnu._id})`);
    
    // Get current timestamp
    const now = new Date();
    console.log(`🕐 Current time: ${now}`);
    
    // Get ALL orders visible to this admin (no filters)
    console.log('\n📋 ALL ORDERS VISIBLE TO ADMIN (Raw Query):');
    
    const allVisibleOrders = await ordersCollection.find({
      'items.sellerId': vishnu._id
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`\n📊 TOTAL VISIBLE ORDERS: ${allVisibleOrders.length}`);
    
    allVisibleOrders.forEach((order, index) => {
      const minutesAgo = Math.round((now.getTime() - order.createdAt.getTime()) / 60000);
      const hoursAgo = Math.round(minutesAgo / 60);
      
      console.log(`\n${index + 1}. 📦 ${order.orderNumber || 'NO_ORDER_NUMBER'}`);
      console.log(`   ID: ${order._id}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log(`   Time ago: ${minutesAgo} minutes (${hoursAgo} hours)`);
      console.log(`   Status: ${order.orderStatus}`);
      console.log(`   Payment: ${order.paymentStatus}`);
      console.log(`   Total: ₹${order.finalAmount}`);
      console.log(`   Items: ${order.items?.length || 0}`);
      
      // Mark recent orders
      if (minutesAgo < 30) {
        console.log(`   🔥 RECENT ORDER (< 30 min)`);
      } else if (minutesAgo < 120) {
        console.log(`   🕐 FAIRLY RECENT (< 2 hours)`);
      }
      
      // Verify sellerId for each item
      if (order.items) {
        order.items.forEach((item, i) => {
          const sellerMatch = item.sellerId && item.sellerId.toString() === vishnu._id.toString();
          console.log(`     Item ${i + 1}: SellerId=${item.sellerId} ${sellerMatch ? '✅' : '❌'}`);
        });
      }
    });
    
    // Check for the specific recent order mentioned by user
    console.log('\n🔍 CHECKING FOR SPECIFIC RECENT ORDER:');
    
    const recentOrderNumbers = [
      'ORD17585421552620098',
      'ORD17585378146110094'
    ];
    
    for (const orderNumber of recentOrderNumbers) {
      const order = await ordersCollection.findOne({ orderNumber });
      
      if (order) {
        const minutesAgo = Math.round((now.getTime() - order.createdAt.getTime()) / 60000);
        console.log(`\n✅ Found ${orderNumber}:`);
        console.log(`   Created: ${order.createdAt}`);
        console.log(`   Time ago: ${minutesAgo} minutes`);
        console.log(`   Status: ${order.orderStatus}`);
        
        // Check if visible to admin
        const visibleToAdmin = order.items?.some(item => 
          item.sellerId && item.sellerId.toString() === vishnu._id.toString()
        );
        
        console.log(`   Visible to admin: ${visibleToAdmin ? '✅ YES' : '❌ NO'}`);
        
        if (!visibleToAdmin) {
          console.log(`   🚨 THIS ORDER SHOULD BE VISIBLE BUT ISN'T!`);
        }
      } else {
        console.log(`❌ Order ${orderNumber} not found`);
      }
    }
    
    // Test the exact query that the frontend would use
    console.log('\n🧪 TESTING FRONTEND-STYLE QUERY:');
    
    const frontendQuery = {
      'items.sellerId': vishnu._id
    };
    
    const frontendOrders = await ordersCollection.find(frontendQuery)
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    console.log(`Frontend query returned ${frontendOrders.length} orders:`);
    
    frontendOrders.forEach((order, index) => {
      const minutesAgo = Math.round((now.getTime() - order.createdAt.getTime()) / 60000);
      console.log(`  ${index + 1}. ${order.orderNumber} (${minutesAgo}min ago) - ${order.orderStatus}`);
    });
    
    // Check database connection and collection stats
    console.log('\n📊 DATABASE STATS:');
    
    const totalOrders = await ordersCollection.countDocuments();
    const ordersWithSellerId = await ordersCollection.countDocuments({
      'items.sellerId': { $exists: true, $ne: null }
    });
    
    console.log(`Total orders in database: ${totalOrders}`);
    console.log(`Orders with sellerId: ${ordersWithSellerId}`);
    console.log(`Orders visible to this admin: ${allVisibleOrders.length}`);
    
    // Check for any orders created in the last hour
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    const veryRecentOrders = await ordersCollection.find({
      createdAt: { $gte: oneHourAgo }
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`\n🕐 ORDERS CREATED IN LAST HOUR: ${veryRecentOrders.length}`);
    
    veryRecentOrders.forEach((order, index) => {
      const minutesAgo = Math.round((now.getTime() - order.createdAt.getTime()) / 60000);
      const visibleToAdmin = order.items?.some(item => 
        item.sellerId && item.sellerId.toString() === vishnu._id.toString()
      );
      
      console.log(`  ${index + 1}. ${order.orderNumber} (${minutesAgo}min ago) - Visible: ${visibleToAdmin ? '✅' : '❌'}`);
    });
    
    await client.close();
    
    console.log('\n🎯 FINAL SUMMARY:');
    console.log(`📊 Total orders visible to admin: ${allVisibleOrders.length}`);
    
    if (allVisibleOrders.length > 0) {
      const mostRecent = allVisibleOrders[0];
      const minutesAgo = Math.round((now.getTime() - mostRecent.createdAt.getTime()) / 60000);
      console.log(`🕐 Most recent visible order: ${mostRecent.orderNumber} (${minutesAgo} minutes ago)`);
      
      if (minutesAgo < 15) {
        console.log(`🔥 VERY RECENT ORDER - Should definitely be visible in frontend!`);
      } else if (minutesAgo < 60) {
        console.log(`⏰ Recent order - Should be visible in frontend`);
      } else {
        console.log(`📅 Older order - Check if user is looking for a more recent one`);
      }
    } else {
      console.log(`❌ NO ORDERS VISIBLE - This is the problem!`);
    }
    
    console.log(`\n🔄 Admin backend server restarted - frontend should now show all ${allVisibleOrders.length} orders`);
    
  } catch (error) {
    console.error('❌ Error in final verification:', error);
  }
}

finalOrderVerification().catch(console.error);