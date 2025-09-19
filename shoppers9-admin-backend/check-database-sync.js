const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

async function checkDatabaseSync() {
  try {
    console.log('🔍 CHECKING DATABASE SYNCHRONIZATION...');
    
    // Connect to both databases
    const mainClient = new MongoClient('mongodb://localhost:27017/shoppers9');
    const adminClient = new MongoClient('mongodb://localhost:27017/shoppers9-admin');
    
    await mainClient.connect();
    await adminClient.connect();
    
    const mainDb = mainClient.db('shoppers9');
    const adminDb = adminClient.db('shoppers9-admin');
    
    console.log('\n📊 DATABASE COMPARISON:');
    
    // Check orders count
    const mainOrdersCount = await mainDb.collection('orders').countDocuments();
    const adminOrdersCount = await adminDb.collection('orders').countDocuments();
    
    console.log(`\n📦 ORDERS:`);
    console.log(`   Main DB (shoppers9): ${mainOrdersCount} orders`);
    console.log(`   Admin DB (shoppers9-admin): ${adminOrdersCount} orders`);
    
    if (mainOrdersCount !== adminOrdersCount) {
      console.log('   ❌ MISMATCH: Different order counts!');
    } else {
      console.log('   ✅ Order counts match');
    }
    
    // Check recent orders in both databases
    console.log('\n🕐 RECENT ORDERS COMPARISON:');
    
    const mainRecentOrders = await mainDb.collection('orders')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
      
    const adminRecentOrders = await adminDb.collection('orders')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    console.log('\n📋 Main DB Recent Orders:');
    mainRecentOrders.forEach((order, i) => {
      console.log(`   ${i+1}. ${order.orderNumber} - ${order.createdAt}`);
      if (order.items) {
        order.items.forEach((item, j) => {
          console.log(`      Item ${j+1}: sellerId = ${item.sellerId || 'NOT SET'}`);
        });
      }
    });
    
    console.log('\n📋 Admin DB Recent Orders:');
    adminRecentOrders.forEach((order, i) => {
      console.log(`   ${i+1}. ${order.orderNumber} - ${order.createdAt}`);
      if (order.items) {
        order.items.forEach((item, j) => {
          console.log(`      Item ${j+1}: sellerId = ${item.sellerId || 'NOT SET'}`);
        });
      }
    });
    
    // Check if the same orders exist in both databases
    console.log('\n🔍 ORDER SYNCHRONIZATION CHECK:');
    
    const mainOrderNumbers = mainRecentOrders.map(o => o.orderNumber);
    const adminOrderNumbers = adminRecentOrders.map(o => o.orderNumber);
    
    const missingInAdmin = mainOrderNumbers.filter(on => !adminOrderNumbers.includes(on));
    const missingInMain = adminOrderNumbers.filter(on => !mainOrderNumbers.includes(on));
    
    if (missingInAdmin.length > 0) {
      console.log(`   ❌ Orders in main but missing in admin: ${missingInAdmin.join(', ')}`);
    }
    
    if (missingInMain.length > 0) {
      console.log(`   ❌ Orders in admin but missing in main: ${missingInMain.join(', ')}`);
    }
    
    if (missingInAdmin.length === 0 && missingInMain.length === 0) {
      console.log('   ✅ Recent orders are synchronized');
    }
    
    // Check admin users in both databases
    console.log('\n👥 ADMIN USERS COMPARISON:');
    
    const mainAdmins = await mainDb.collection('admins').find({}).toArray();
    const adminAdmins = await adminDb.collection('admins').find({}).toArray();
    
    console.log(`   Main DB admins: ${mainAdmins.length}`);
    console.log(`   Admin DB admins: ${adminAdmins.length}`);
    
    // Find test admin in both databases
    const mainTestAdmin = mainAdmins.find(a => a.email === 'admin@shoppers9.com');
    const adminTestAdmin = adminAdmins.find(a => a.email === 'admin@shoppers9.com');
    
    if (mainTestAdmin && adminTestAdmin) {
      console.log('\n🧪 TEST ADMIN COMPARISON:');
      console.log(`   Main DB ID: ${mainTestAdmin._id}`);
      console.log(`   Admin DB ID: ${adminTestAdmin._id}`);
      console.log(`   IDs match: ${mainTestAdmin._id.toString() === adminTestAdmin._id.toString() ? '✅' : '❌'}`);
      
      if (mainTestAdmin._id.toString() !== adminTestAdmin._id.toString()) {
        console.log('   ❌ CRITICAL: Test admin has different IDs in different databases!');
      }
    }
    
    // Check which database the backends are actually using
    console.log('\n🔧 BACKEND CONFIGURATION CHECK:');
    console.log('   Main backend (port 5002) should write to: shoppers9');
    console.log('   Admin backend (port 5003) should read from: shoppers9-admin');
    console.log('\n   If they use different databases, orders created by main backend');
    console.log('   will not be visible in admin backend!');
    
    // Check for orders with test admin products in main database
    if (mainTestAdmin) {
      console.log('\n🔍 CHECKING ORDERS WITH TEST ADMIN PRODUCTS IN MAIN DB:');
      
      const mainProducts = await mainDb.collection('products')
        .find({ createdBy: mainTestAdmin._id })
        .toArray();
        
      console.log(`   Test admin products in main DB: ${mainProducts.length}`);
      
      if (mainProducts.length > 0) {
        const productIds = mainProducts.map(p => p._id);
        
        const ordersWithAdminProducts = await mainDb.collection('orders')
          .find({ 'items.product': { $in: productIds } })
          .toArray();
          
        console.log(`   Orders with test admin products: ${ordersWithAdminProducts.length}`);
        
        if (ordersWithAdminProducts.length > 0) {
          console.log('\n   📦 Sample orders:');
          ordersWithAdminProducts.slice(0, 3).forEach((order, i) => {
            console.log(`      ${i+1}. ${order.orderNumber}`);
            const adminItems = order.items.filter(item => 
              productIds.some(pid => pid.toString() === item.product.toString())
            );
            adminItems.forEach((item, j) => {
              console.log(`         Item ${j+1}: sellerId = ${item.sellerId || 'NOT SET'}`);
            });
          });
        }
      }
    }
    
    await mainClient.close();
    await adminClient.close();
    
    console.log('\n📋 SUMMARY:');
    console.log('   1. Check if both backends use the same database');
    console.log('   2. If using different databases, sync orders from main to admin');
    console.log('   3. Ensure sellerId is properly set in order creation');
    console.log('   4. Verify admin role permissions in data filter');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDatabaseSync();