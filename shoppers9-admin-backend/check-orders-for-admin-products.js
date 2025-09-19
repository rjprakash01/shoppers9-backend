const { MongoClient } = require('mongodb');

async function checkOrdersForAdminProducts() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const shoppers9Db = client.db('shoppers9');
    const adminDb = client.db('shoppers9-admin');
    
    const productsCollection = shoppers9Db.collection('products');
    const ordersCollection = adminDb.collection('orders');
    
    const testAdminId = '68bd48f7e03d384b7a2f92ee';
    const { ObjectId } = require('mongodb');
    
    // Get test admin's products
    const adminProducts = await productsCollection.find({ 
      $or: [
        { createdBy: testAdminId },
        { createdBy: new ObjectId(testAdminId) }
      ]
    }).toArray();
    
    console.log(`\nTest admin has ${adminProducts.length} products`);
    const productIds = adminProducts.map(p => p._id.toString());
    console.log('Product IDs:', productIds);
    
    // Check orders containing these products
    const ordersWithAdminProducts = await ordersCollection.find({
      'items.product': { $in: productIds }
    }).toArray();
    
    console.log(`\nOrders containing test admin's products: ${ordersWithAdminProducts.length}`);
    
    if (ordersWithAdminProducts.length > 0) {
      console.log('\nAnalyzing orders with admin products:');
      
      ordersWithAdminProducts.forEach((order, index) => {
        console.log(`\nOrder ${index + 1}: ${order.orderNumber}`);
        console.log(`  Created: ${order.createdAt}`);
        console.log(`  Total Items: ${order.items.length}`);
        
        const adminItems = order.items.filter(item => 
          productIds.includes(item.product.toString())
        );
        
        console.log(`  Admin's Items: ${adminItems.length}`);
        
        adminItems.forEach((item, itemIndex) => {
          const product = adminProducts.find(p => p._id.toString() === item.product.toString());
          console.log(`    Item ${itemIndex + 1}: ${product?.name || 'Unknown Product'}`);
          console.log(`      Product ID: ${item.product}`);
          console.log(`      Seller ID: ${item.sellerId || 'NOT SET'}`);
          console.log(`      Should be: ${testAdminId}`);
          console.log(`      Correct: ${item.sellerId?.toString() === testAdminId ? '✅' : '❌'}`);
        });
      });
      
      // Check how many orders have correct sellerId
      const correctOrders = ordersWithAdminProducts.filter(order => 
        order.items.some(item => 
          productIds.includes(item.product.toString()) && 
          item.sellerId?.toString() === testAdminId
        )
      );
      
      console.log(`\n📊 Summary:`);
      console.log(`  Orders with admin products: ${ordersWithAdminProducts.length}`);
      console.log(`  Orders with correct sellerId: ${correctOrders.length}`);
      console.log(`  Orders needing fix: ${ordersWithAdminProducts.length - correctOrders.length}`);
      
    } else {
      console.log('\n❌ No orders found containing test admin\'s products!');
      console.log('This means customers haven\'t purchased any products created by the test admin.');
    }
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await client.close();
    process.exit(1);
  }
}

checkOrdersForAdminProducts();