const mongoose = require('mongoose');

async function checkVishnuOrders() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const ordersCollection = db.collection('orders');
    const usersCollection = db.collection('users');
    
    // Get Vishnu's user ID
    const vishnu = await usersCollection.findOne({ email: 'prakash.jetender@gmail.com' });
    console.log('Vishnu User ID:', vishnu._id);
    
    // Vishnu's product ID
    const vishnuProductId = new mongoose.Types.ObjectId('68d1277494b259df4fe432e3');
    console.log('Vishnu Product ID:', vishnuProductId);
    
    // Check orders containing Vishnu's product
    const ordersWithVishnuProduct = await ordersCollection.find({
      $or: [
        { 'items.productId': vishnuProductId },
        { 'items.productId': vishnuProductId.toString() },
        { 'products.productId': vishnuProductId },
        { 'products.productId': vishnuProductId.toString() }
      ]
    }).toArray();
    
    console.log('\nOrders containing Vishnu\'s product:', ordersWithVishnuProduct.length);
    
    ordersWithVishnuProduct.forEach((order, index) => {
      console.log(`\nOrder ${index + 1}:`);
      console.log('- Order ID:', order._id);
      console.log('- Order Number:', order.orderNumber);
      console.log('- Customer ID:', order.customerId);
      console.log('- Seller ID:', order.sellerId);
      console.log('- Created By:', order.createdBy);
      console.log('- Status:', order.status);
      console.log('- Items:', JSON.stringify(order.items, null, 2));
      console.log('- Products:', JSON.stringify(order.products, null, 2));
      console.log('- Created At:', order.createdAt);
    });
    
    // Check all recent orders to understand structure
    const recentOrders = await ordersCollection.find({}).sort({ createdAt: -1 }).limit(3).toArray();
    console.log('\nRecent orders (last 3):');
    
    recentOrders.forEach((order, index) => {
      console.log(`\nRecent Order ${index + 1}:`);
      console.log('- Order ID:', order._id);
      console.log('- Order Number:', order.orderNumber);
      console.log('- Customer ID:', order.customerId);
      console.log('- Seller ID:', order.sellerId);
      console.log('- Created By:', order.createdBy);
      console.log('- Status:', order.status);
      console.log('- Items count:', order.items ? order.items.length : 'No items');
      console.log('- Products count:', order.products ? order.products.length : 'No products');
      if (order.items && order.items.length > 0) {
        console.log('- First item product ID:', order.items[0].productId);
      }
    });
    
    // Check orders by sellerId
    const ordersBySeller = await ordersCollection.find({
      $or: [
        { sellerId: vishnu._id },
        { sellerId: vishnu._id.toString() },
        { createdBy: vishnu._id },
        { createdBy: vishnu._id.toString() }
      ]
    }).toArray();
    
    console.log('\nOrders by Vishnu as seller/creator:', ordersBySeller.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkVishnuOrders();