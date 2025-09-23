const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function checkRecentPurchase() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const ordersCollection = db.collection('orders');
    const productsCollection = db.collection('products');
    const adminsCollection = db.collection('admins');
    
    console.log('\n🔍 INVESTIGATING RECENT PURCHASE: "Test ADMIN VISHNU"');
    console.log('=' .repeat(60));
    
    // 1. Find the product "Test ADMIN VISHNU"
    console.log('\n1. 📦 Looking for product "Test ADMIN VISHNU"...');
    const product = await productsCollection.findOne({ 
      name: { $regex: /Test.*ADMIN.*VISHNU/i } 
    });
    
    if (!product) {
      console.log('❌ Product "Test ADMIN VISHNU" not found!');
      
      // Search for similar products
      const similarProducts = await productsCollection.find({
        name: { $regex: /(test|admin|vishnu)/i }
      }).toArray();
      
      console.log(`\nFound ${similarProducts.length} similar products:`);
      similarProducts.forEach(p => {
        console.log(`  - ${p.name} (Created by: ${p.createdBy})`);
      });
      
      await client.close();
      return;
    }
    
    console.log(`✅ Found product: ${product.name}`);
    console.log(`   Product ID: ${product._id}`);
    console.log(`   Created by: ${product.createdBy}`);
    console.log(`   Price: ₹${product.price}`);
    console.log(`   Created at: ${product.createdAt}`);
    
    // 2. Find the admin who created this product
    console.log('\n2. 👤 Finding the product creator...');
    const creator = await adminsCollection.findOne({ _id: product.createdBy });
    
    if (creator) {
      console.log(`✅ Product creator found:`);
      console.log(`   Name: ${creator.firstName} ${creator.lastName}`);
      console.log(`   Email: ${creator.email}`);
      console.log(`   Role: ${creator.primaryRole || creator.role}`);
      console.log(`   Admin ID: ${creator._id}`);
    } else {
      console.log(`❌ Creator not found for ID: ${product.createdBy}`);
    }
    
    // 3. Find recent orders containing this product
    console.log('\n3. 📋 Looking for recent orders with this product...');
    const recentOrders = await ordersCollection.find({
      'items.product': product._id
    }).sort({ createdAt: -1 }).limit(5).toArray();
    
    console.log(`Found ${recentOrders.length} orders containing this product:`);
    
    for (const order of recentOrders) {
      console.log(`\n📦 Order: ${order.orderNumber}`);
      console.log(`   Order ID: ${order._id}`);
      console.log(`   Customer: ${order.userId}`);
      console.log(`   Status: ${order.orderStatus}`);
      console.log(`   Payment: ${order.paymentStatus}`);
      console.log(`   Total: ₹${order.finalAmount}`);
      console.log(`   Created: ${order.createdAt}`);
      
      // Check each item in the order
      order.items.forEach((item, index) => {
        if (item.product.toString() === product._id.toString()) {
          console.log(`   Item ${index + 1}:`);
          console.log(`     Product: ${product.name}`);
          console.log(`     Quantity: ${item.quantity}`);
          console.log(`     Price: ₹${item.price}`);
          console.log(`     SellerId: ${item.sellerId}`);
          
          // Check if sellerId matches the product creator
          if (item.sellerId && item.sellerId.toString() === product.createdBy.toString()) {
            console.log(`     ✅ SellerId matches product creator!`);
          } else {
            console.log(`     ❌ SellerId mismatch! Expected: ${product.createdBy}, Got: ${item.sellerId}`);
          }
        }
      });
    }
    
    // 4. Check if orders are visible to the admin
    console.log('\n4. 🔍 Checking admin order visibility...');
    
    if (creator) {
      const visibleOrders = await ordersCollection.find({
        'items.sellerId': creator._id
      }).sort({ createdAt: -1 }).toArray();
      
      console.log(`\n📊 Admin ${creator.email} can see ${visibleOrders.length} orders:`);
      
      const productOrders = visibleOrders.filter(order => 
        order.items.some(item => item.product.toString() === product._id.toString())
      );
      
      console.log(`   - ${productOrders.length} orders contain the "${product.name}" product`);
      
      if (productOrders.length > 0) {
        console.log(`\n✅ SUCCESS: Admin can see orders for their product!`);
        productOrders.forEach(order => {
          console.log(`     - ${order.orderNumber} (${order.orderStatus}) - ₹${order.finalAmount}`);
        });
      } else {
        console.log(`\n❌ ISSUE: Admin cannot see any orders for their product!`);
      }
    }
    
    // 5. Get the most recent order details
    if (recentOrders.length > 0) {
      const latestOrder = recentOrders[0];
      console.log('\n5. 🕐 Most Recent Order Details:');
      console.log(`   Order Number: ${latestOrder.orderNumber}`);
      console.log(`   Placed: ${latestOrder.createdAt}`);
      console.log(`   Time ago: ${Math.round((Date.now() - latestOrder.createdAt.getTime()) / 60000)} minutes ago`);
      
      // Check if this is truly a recent purchase (within last hour)
      const hourAgo = Date.now() - (60 * 60 * 1000);
      if (latestOrder.createdAt.getTime() > hourAgo) {
        console.log(`   🔥 This is a RECENT purchase (within last hour)!`);
      } else {
        console.log(`   ⏰ This order is older than 1 hour`);
      }
    }
    
    await client.close();
    
    console.log('\n🎯 SUMMARY:');
    if (creator && recentOrders.length > 0) {
      console.log(`✅ Product "${product.name}" was created by ${creator.email}`);
      console.log(`✅ Found ${recentOrders.length} orders containing this product`);
      
      const visibleCount = recentOrders.filter(order => 
        order.items.some(item => 
          item.sellerId && item.sellerId.toString() === creator._id.toString()
        )
      ).length;
      
      if (visibleCount > 0) {
        console.log(`✅ Admin WILL see ${visibleCount} of these orders in their dashboard`);
      } else {
        console.log(`❌ Admin WILL NOT see these orders (sellerId mismatch)`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking recent purchase:', error);
  }
}

checkRecentPurchase().catch(console.error);