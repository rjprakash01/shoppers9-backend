const mongoose = require('mongoose');
const { User } = require('./src/models/User.ts');
const { Product } = require('./src/models/Product.ts');
const { Order } = require('./src/models/Order.ts');

require('dotenv').config();

async function searchAdminUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Search for all users with admin-like roles
    console.log('=== SEARCHING FOR ALL ADMIN USERS ===');
    const adminUsers = await User.find({
      $or: [
        { role: 'admin' },
        { isAdmin: true },
        { role: { $regex: /admin/i } }
      ]
    });

    console.log(`Found ${adminUsers.length} admin users:`);
    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || `${user.firstName} ${user.lastName}`}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Phone: ${user.phone}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Is Admin: ${user.isAdmin}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    // Search for users with names containing 'vishnu' or 'dutta'
    console.log('=== SEARCHING FOR VISHNU/DUTTA USERS ===');
    const vishnuUsers = await User.find({
      $or: [
        { name: { $regex: /vishnu/i } },
        { name: { $regex: /dutta/i } },
        { firstName: { $regex: /vishnu/i } },
        { lastName: { $regex: /dutta/i } },
        { email: { $regex: /vishnu/i } }
      ]
    });

    console.log(`Found ${vishnuUsers.length} users with Vishnu/Dutta:`);
    vishnuUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || `${user.firstName} ${user.lastName}`}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Is Admin: ${user.isAdmin}`);
      console.log('');
    });

    // Get all unique seller IDs from recent orders
    console.log('=== ANALYZING SELLER IDS FROM RECENT ORDERS ===');
    const recentOrders = await Order.find({}).sort({ createdAt: -1 }).limit(20);
    const sellerIds = new Set();
    
    recentOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.sellerId) {
          sellerIds.add(item.sellerId.toString());
        }
      });
    });

    console.log(`Found ${sellerIds.size} unique seller IDs in recent orders:`);
    
    // Look up each seller ID
    for (const sellerId of sellerIds) {
      try {
        const seller = await User.findById(sellerId);
        if (seller) {
          console.log(`Seller: ${seller.name || `${seller.firstName} ${seller.lastName}`} (${sellerId})`);
          console.log(`   Email: ${seller.email}`);
          console.log(`   Role: ${seller.role}`);
          console.log(`   Is Admin: ${seller.isAdmin}`);
          
          // Check if this seller has products
          const sellerProducts = await Product.find({ createdBy: sellerId });
          console.log(`   Products created: ${sellerProducts.length}`);
          
          if (sellerProducts.length > 0) {
            console.log(`   Recent products:`);
            sellerProducts.slice(0, 3).forEach(product => {
              console.log(`     - ${product.name} (${product._id})`);
            });
          }
          console.log('');
        } else {
          console.log(`Seller ID ${sellerId} - User not found`);
        }
      } catch (error) {
        console.log(`Error looking up seller ${sellerId}:`, error.message);
      }
    }

    // Check if there are any products without proper seller mapping
    console.log('=== CHECKING PRODUCT OWNERSHIP ISSUES ===');
    const recentProducts = await Product.find({}).sort({ createdAt: -1 }).limit(10);
    console.log(`Checking ${recentProducts.length} recent products:`);
    
    for (const product of recentProducts) {
      console.log(`Product: ${product.name} (${product._id})`);
      console.log(`   Created By: ${product.createdBy}`);
      console.log(`   Created At: ${product.createdAt}`);
      
      if (product.createdBy) {
        try {
          const creator = await User.findById(product.createdBy);
          if (creator) {
            console.log(`   Creator: ${creator.name || `${creator.firstName} ${creator.lastName}`}`);
            console.log(`   Creator Role: ${creator.role}`);
            console.log(`   Creator Is Admin: ${creator.isAdmin}`);
          } else {
            console.log(`   ⚠️  Creator not found for ID: ${product.createdBy}`);
          }
        } catch (error) {
          console.log(`   ❌ Error finding creator: ${error.message}`);
        }
      } else {
        console.log(`   ⚠️  No createdBy field`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

searchAdminUsers();