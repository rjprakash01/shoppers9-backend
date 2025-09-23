const mongoose = require('mongoose');
const User = require('./src/models/User.ts').default;
const Product = require('./src/models/Product.ts').default;
const Order = require('./src/models/Order.ts').default;

require('dotenv').config();

async function findVishnuAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB (Admin Backend)');

    // Search for Vishnu in admin backend
    console.log('=== SEARCHING FOR VISHNU IN ADMIN BACKEND ===');
    const vishnuUsers = await User.find({
      $or: [
        { firstName: { $regex: /vishnu/i } },
        { lastName: { $regex: /dutta/i } },
        { email: { $regex: /vishnu/i } },
        { phone: { $regex: /vishnu/i } }
      ]
    });

    console.log(`Found ${vishnuUsers.length} users matching Vishnu/Dutta:`);
    vishnuUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Phone: ${user.phone}`);
      console.log(`   Primary Role: ${user.primaryRole}`);
      console.log(`   Roles: ${user.roles}`);
      console.log(`   Is Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    // Search for the missing user ID from main backend
    console.log('=== CHECKING FOR MISSING USER ID ===');
    const missingUserId = '68bd48f7e03d384b7a2f92ee';
    const missingUser = await User.findById(missingUserId);
    
    if (missingUser) {
      console.log(`Found missing user ${missingUserId}:`);
      console.log(`Name: ${missingUser.firstName} ${missingUser.lastName}`);
      console.log(`Email: ${missingUser.email}`);
      console.log(`Role: ${missingUser.primaryRole}`);
      console.log(`Active: ${missingUser.isActive}`);
    } else {
      console.log(`User ${missingUserId} not found in admin backend either`);
    }

    // Check all admin users
    console.log('\n=== ALL ADMIN USERS ===');
    const allAdmins = await User.find({
      $or: [
        { primaryRole: 'admin' },
        { primaryRole: 'super_admin' },
        { primaryRole: 'sub_admin' }
      ]
    });

    console.log(`Found ${allAdmins.length} admin users:`);
    allAdmins.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.primaryRole}`);
      console.log(`   Active: ${user.isActive}`);
      console.log('');
    });

    // Check products in admin backend
    console.log('=== CHECKING PRODUCTS IN ADMIN BACKEND ===');
    const adminProducts = await Product.find({}).sort({ createdAt: -1 }).limit(10);
    console.log(`Found ${adminProducts.length} recent products in admin backend:`);
    
    adminProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   ID: ${product._id}`);
      console.log(`   Created By: ${product.createdBy}`);
      console.log(`   Created: ${product.createdAt}`);
      console.log('');
    });

    // Check orders in admin backend
    console.log('=== CHECKING ORDERS IN ADMIN BACKEND ===');
    const adminOrders = await Order.find({}).sort({ createdAt: -1 }).limit(5);
    console.log(`Found ${adminOrders.length} recent orders in admin backend:`);
    
    adminOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order ${order.orderNumber || order._id}`);
      console.log(`   Customer: ${order.userId}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log(`   Items: ${order.items ? order.items.length : 0}`);
      if (order.items) {
        order.items.forEach((item, itemIndex) => {
          console.log(`     ${itemIndex + 1}. Product: ${item.product}, Seller: ${item.sellerId}`);
        });
      }
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

findVishnuAdmin();