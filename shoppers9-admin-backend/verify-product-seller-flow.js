const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function verifyProductSellerFlow() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('shoppers9');
    const testAdminId = '68bd48f7e03d384b7a2f92ee';
    
    console.log('\n=== CHECKING TEST ADMIN PRODUCTS ===');
    console.log('Test Admin ID:', testAdminId);
    
    // Check products created by test admin
    const adminProducts = await db.collection('products').find({
      createdBy: new ObjectId(testAdminId)
    }).toArray();
    
    console.log('\nProducts created by test admin:', adminProducts.length);
    adminProducts.forEach((product, i) => {
      console.log(`\nProduct ${i+1}:`);
      console.log(`  ID: ${product._id}`);
      console.log(`  Name: ${product.name}`);
      console.log(`  Created By: ${product.createdBy}`);
      console.log(`  Status: ${product.status || 'active'}`);
      console.log(`  Price: ${product.price}`);
    });
    
    // Check orders containing these products
    console.log('\n=== CHECKING ORDERS FOR ADMIN PRODUCTS ===');
    
    const productIds = adminProducts.map(p => p._id);
    console.log('\nLooking for orders containing product IDs:', productIds.map(id => id.toString()));
    
    const ordersWithAdminProducts = await db.collection('orders').find({
      'items.product': { $in: productIds }
    }).toArray();
    
    console.log('\nOrders containing admin products:', ordersWithAdminProducts.length);
    
    ordersWithAdminProducts.forEach((order, i) => {
      console.log(`\nOrder ${i+1}:`);
      console.log(`  Order Number: ${order.orderNumber}`);
      console.log(`  Created At: ${order.createdAt}`);
      console.log(`  User ID: ${order.userId}`);
      console.log(`  Items: ${order.items?.length || 0}`);
      
      if (order.items) {
        order.items.forEach((item, j) => {
          const isAdminProduct = productIds.some(pid => pid.toString() === item.product.toString());
          console.log(`    Item ${j+1}:`);
          console.log(`      Product ID: ${item.product}`);
          console.log(`      Is Admin Product: ${isAdminProduct}`);
          console.log(`      Seller ID: ${item.sellerId || 'NOT SET'}`);
          console.log(`      Seller ID Type: ${typeof item.sellerId}`);
          console.log(`      Quantity: ${item.quantity}`);
          console.log(`      Price: ${item.price}`);
          
          // Check if sellerId matches admin ID
          if (item.sellerId) {
            const sellerMatches = item.sellerId.toString() === testAdminId;
            console.log(`      Seller Matches Admin: ${sellerMatches}`);
          }
        });
      }
    });
    
    // Check recent orders to see if new orders are being created correctly
    console.log('\n=== CHECKING RECENT ORDERS (Last 5) ===');
    
    const recentOrders = await db.collection('orders').find({})
      .sort({createdAt: -1})
      .limit(5)
      .toArray();
    
    recentOrders.forEach((order, i) => {
      console.log(`\nRecent Order ${i+1}:`);
      console.log(`  Order Number: ${order.orderNumber}`);
      console.log(`  Created At: ${order.createdAt}`);
      console.log(`  Items:`);
      
      if (order.items) {
        order.items.forEach((item, j) => {
          console.log(`    Item ${j+1}: Product ${item.product}, Seller ${item.sellerId || 'NOT SET'}`);
        });
      }
    });
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Test Admin Products: ${adminProducts.length}`);
    console.log(`Orders with Admin Products: ${ordersWithAdminProducts.length}`);
    
    const ordersWithCorrectSeller = ordersWithAdminProducts.filter(order => 
      order.items && order.items.some(item => 
        item.sellerId && item.sellerId.toString() === testAdminId
      )
    );
    
    console.log(`Orders with Correct Seller ID: ${ordersWithCorrectSeller.length}`);
    
    if (ordersWithAdminProducts.length > ordersWithCorrectSeller.length) {
      console.log('\n⚠️  ISSUE FOUND: Some orders with admin products do not have correct sellerId!');
      console.log('This means the order creation process is not properly setting sellerId.');
    } else {
      console.log('\n✅ All orders with admin products have correct sellerId.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

verifyProductSellerFlow();