const mongoose = require('mongoose');
const { User } = require('./src/models/User.ts');
const { Product } = require('./src/models/Product.ts');
const { Order } = require('./src/models/Order.ts');

require('dotenv').config();

async function checkVishnuAccount() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find Vishnu Dutta's account
    const vishnuUser = await User.findOne({ 
      $or: [
        { name: /vishnu.*dutta/i },
        { name: /vishnu/i },
        { email: /vishnu/i },
        { phone: /vishnu/i }
      ]
    });

    if (vishnuUser) {
      console.log('\n=== VISHNU DUTTA ACCOUNT DETAILS ===');
      console.log('User ID:', vishnuUser._id.toString());
      console.log('Name:', vishnuUser.name);
      console.log('Email:', vishnuUser.email);
      console.log('Phone:', vishnuUser.phone);
      console.log('Role:', vishnuUser.role);
      console.log('Is Admin:', vishnuUser.isAdmin);
      console.log('Created At:', vishnuUser.createdAt);
      console.log('Last Login:', vishnuUser.lastLogin);

      // Check products created by Vishnu
      const vishnuProducts = await Product.find({ createdBy: vishnuUser._id.toString() });
      console.log('\n=== VISHNU\'S PRODUCTS ===');
      console.log('Total products created:', vishnuProducts.length);
      
      if (vishnuProducts.length > 0) {
        console.log('\nProduct details:');
        vishnuProducts.forEach((product, index) => {
          console.log(`${index + 1}. ${product.name}`);
          console.log(`   ID: ${product._id}`);
          console.log(`   Created: ${product.createdAt}`);
          console.log(`   Active: ${product.isActive}`);
          console.log(`   Created By: ${product.createdBy}`);
        });

        // Check recent orders for Vishnu's products
        const productIds = vishnuProducts.map(p => p._id.toString());
        console.log('\n=== CHECKING ORDERS FOR VISHNU\'S PRODUCTS ===');
        
        const ordersWithVishnuProducts = await Order.find({
          'items.product': { $in: productIds }
        }).sort({ createdAt: -1 }).limit(10);

        console.log('Orders containing Vishnu\'s products:', ordersWithVishnuProducts.length);
        
        if (ordersWithVishnuProducts.length > 0) {
          console.log('\nOrder details:');
          ordersWithVishnuProducts.forEach((order, index) => {
            console.log(`${index + 1}. Order ${order.orderNumber}`);
            console.log(`   Order ID: ${order._id}`);
            console.log(`   Customer: ${order.userId}`);
            console.log(`   Created: ${order.createdAt}`);
            console.log(`   Status: ${order.orderStatus}`);
            console.log(`   Total: $${order.finalAmount}`);
            
            // Check which items are Vishnu's
            const vishnuItems = order.items.filter(item => 
              productIds.includes(item.product.toString())
            );
            console.log(`   Vishnu's items in this order: ${vishnuItems.length}`);
            vishnuItems.forEach(item => {
              console.log(`     - Product: ${item.product}`);
              console.log(`     - Seller ID: ${item.sellerId}`);
              console.log(`     - Quantity: ${item.quantity}`);
              console.log(`     - Price: $${item.price}`);
            });
          });
        }

        // Check orders by sellerId
        console.log('\n=== CHECKING ORDERS BY SELLER ID ===');
        const ordersBySellerId = await Order.find({
          'items.sellerId': vishnuUser._id.toString()
        }).sort({ createdAt: -1 }).limit(5);

        console.log('Orders with Vishnu as seller:', ordersBySellerId.length);
        if (ordersBySellerId.length > 0) {
          ordersBySellerId.forEach((order, index) => {
            console.log(`${index + 1}. Order ${order.orderNumber} - ${order.createdAt}`);
          });
        }
      }
    } else {
      console.log('❌ Vishnu Dutta account not found');
      
      // Search for similar names
      console.log('\n=== SEARCHING FOR SIMILAR NAMES ===');
      const similarUsers = await User.find({
        $or: [
          { name: /vishnu/i },
          { name: /dutta/i }
        ]
      });
      
      console.log('Users with similar names:');
      similarUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email || user.phone}) - Role: ${user.role}`);
      });
    }

    // Also check all recent orders to see the pattern
    console.log('\n=== RECENT ORDERS ANALYSIS ===');
    const recentOrders = await Order.find({}).sort({ createdAt: -1 }).limit(5);
    console.log('Total recent orders:', recentOrders.length);
    
    recentOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order ${order.orderNumber}`);
      console.log(`   Customer: ${order.userId}`);
      console.log(`   Items: ${order.items.length}`);
      order.items.forEach((item, itemIndex) => {
        console.log(`     ${itemIndex + 1}. Product: ${item.product}, Seller: ${item.sellerId}`);
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkVishnuAccount();