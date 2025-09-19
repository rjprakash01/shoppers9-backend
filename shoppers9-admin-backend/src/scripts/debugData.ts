import mongoose from 'mongoose';
import User from '../models/User';
import Product from '../models/Product';
import Order from '../models/Order';
import connectDB from '../config/database';

// Debug data isolation
export const debugData = async () => {
  try {
    await connectDB();
    console.log('🔍 Debugging Data Isolation...');

    // Check admin users
    const adminUsers = await User.find({ primaryRole: 'admin' }, '_id email primaryRole');
    console.log('\n📋 Admin Users:');
    adminUsers.forEach(user => {
      console.log(`- ${user.email} (ID: ${user._id})`);
    });

    // Check all products
    const allProducts = await Product.find({}, 'name createdBy isActive')
      .populate('createdBy', 'email primaryRole');
    
    console.log(`\n📦 All Products (${allProducts.length} total):`);
    allProducts.forEach(product => {
      const creator = product.createdBy as any;
      console.log(`- ${product.name} | Created by: ${creator?.email || 'Unknown'} (${creator?.primaryRole || 'Unknown'}) | Active: ${product.isActive}`);
    });

    // Check products by admin
    console.log('\n🎯 Products by Admin Users:');
    for (const admin of adminUsers) {
      const adminProducts = await Product.find({ createdBy: admin._id }, 'name isActive');
      console.log(`- ${admin.email}: ${adminProducts.length} products`);
      adminProducts.forEach(p => console.log(`  • ${p.name} (Active: ${p.isActive})`));
    }

    // Check all orders
    const allOrders = await Order.find({}, 'orderNumber items.sellerId totalAmount createdAt')
      .populate('items.sellerId', 'email primaryRole');
    
    console.log(`\n🛒 All Orders (${allOrders.length} total):`);
    allOrders.forEach(order => {
      const sellers = order.items.map((item: any) => {
        const seller = item.sellerId as any;
        return seller?.email || 'Unknown';
      });
      console.log(`- ${order.orderNumber} | Sellers: ${[...new Set(sellers)].join(', ')} | Amount: $${order.totalAmount}`);
    });

    // Check orders by admin
    console.log('\n🎯 Orders by Admin Users:');
    for (const admin of adminUsers) {
      const adminOrders = await Order.find({ 'items.sellerId': admin._id }, 'orderNumber totalAmount');
      console.log(`- ${admin.email}: ${adminOrders.length} orders`);
      adminOrders.forEach(o => console.log(`  • ${o.orderNumber} ($${o.totalAmount})`));
    }

    // Check data filtering simulation
    console.log('\n🔍 Data Filtering Test:');
    for (const admin of adminUsers) {
      const myProducts = await Product.countDocuments({ createdBy: admin._id, isActive: true });
      const myOrders = await Order.countDocuments({ 'items.sellerId': admin._id });
      
      console.log(`- ${admin.email}:`);
      console.log(`  • My Products: ${myProducts}`);
      console.log(`  • My Orders: ${myOrders}`);
    }

    console.log('\n🎯 Data Isolation Status:');
    if (allProducts.length === 0) {
      console.log('❌ No products found - Admin users need to create products');
    } else {
      const adminCreatedProducts = allProducts.filter(p => {
        const creator = p.createdBy as any;
        return creator?.primaryRole === 'admin';
      });
      console.log(`✅ ${adminCreatedProducts.length}/${allProducts.length} products created by admins`);
    }

    if (allOrders.length === 0) {
      console.log('❌ No orders found - Need to create test orders');
    } else {
      console.log(`✅ ${allOrders.length} orders found`);
    }

  } catch (error) {
    console.error('❌ Error debugging data:', error);
    throw error;
  }
};

// Run the debug if executed directly
if (require.main === module) {
  debugData()
    .then(() => {
      console.log('✅ Data debugging completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Data debugging failed:', error);
      process.exit(1);
    });
}

export default debugData;