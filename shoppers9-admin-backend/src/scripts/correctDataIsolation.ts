import mongoose from 'mongoose';
import User from '../models/User';
import Product from '../models/Product';
import Order from '../models/Order';
import connectDB from '../config/database';

// Correct data isolation - remove incorrectly assigned products
export const correctDataIsolation = async () => {
  try {
    await connectDB();
    console.log('🔧 Correcting Data Isolation...');

    // Get super admin user
    const superAdmin = await User.findOne({ primaryRole: 'super_admin' });
    if (!superAdmin) {
      console.log('❌ No super admin found');
      return;
    }

    console.log(`\n👑 Super Admin: ${superAdmin.email}`);

    // Get admin users
    const adminUsers = await User.find({ primaryRole: 'admin' }, '_id email');
    console.log(`\n📋 Found ${adminUsers.length} admin users`);

    // Find all products that were incorrectly assigned to admin users
    // These should belong to super admin or be unassigned
    const incorrectlyAssignedProducts = await Product.find({
      createdBy: { $in: adminUsers.map(u => u._id) }
    });

    console.log(`\n📦 Found ${incorrectlyAssignedProducts.length} products incorrectly assigned to admin users`);

    if (incorrectlyAssignedProducts.length > 0) {
      // Reassign all these products back to super admin
      const result = await Product.updateMany(
        { createdBy: { $in: adminUsers.map(u => u._id) } },
        { 
          createdBy: superAdmin._id,
          updatedBy: superAdmin._id
        }
      );

      console.log(`✅ Reassigned ${result.modifiedCount} products back to super admin`);
      
      // List the products that were reassigned
      for (const product of incorrectlyAssignedProducts) {
        console.log(`  • "${product.name}" -> ${superAdmin.email}`);
      }
    }

    // Fix orders - remove sellerId from items that belong to super admin products
    const orders = await Order.find({});
    console.log(`\n🛒 Checking ${orders.length} orders for incorrect seller assignments`);

    let orderUpdates = 0;
    for (const order of orders) {
      let needsUpdate = false;
      const updatedItems = [];

      for (const item of order.items) {
        // Find the product to check its actual owner
        const product = await Product.findById(item.product);
        
        if (product && product.createdBy) {
          // If product belongs to super admin, remove sellerId or set to super admin
          if (product.createdBy.toString() === superAdmin._id.toString()) {
            updatedItems.push({
              ...item,
              sellerId: superAdmin._id
            });
            needsUpdate = true;
          } else {
            // Keep existing sellerId if product belongs to actual admin
            updatedItems.push(item);
          }
        } else {
          // If product not found or no owner, assign to super admin
          updatedItems.push({
            ...item,
            sellerId: superAdmin._id
          });
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await Order.updateOne(
          { _id: order._id },
          { items: updatedItems }
        );
        orderUpdates++;
      }
    }

    if (orderUpdates > 0) {
      console.log(`✅ Updated ${orderUpdates} orders with correct seller assignments`);
    }

    // Verify correct data isolation
    console.log('\n🔍 Verifying Corrected Data Isolation:');
    
    // Check super admin data
    const superAdminProducts = await Product.countDocuments({ createdBy: superAdmin._id, isActive: true });
    const superAdminOrders = await Order.countDocuments({ 'items.sellerId': superAdmin._id });
    console.log(`- ${superAdmin.email} (Super Admin):`);
    console.log(`  • Products: ${superAdminProducts}`);
    console.log(`  • Orders: ${superAdminOrders}`);
    
    // Check admin users (should have 0 products now)
    for (const admin of adminUsers) {
      const myProducts = await Product.countDocuments({ createdBy: admin._id, isActive: true });
      const myOrders = await Order.countDocuments({ 'items.sellerId': admin._id });
      
      console.log(`- ${admin.email} (Admin):`);
      console.log(`  • Products: ${myProducts} (should be 0)`);
      console.log(`  • Orders: ${myOrders} (should be 0)`);
    }

    console.log('\n✅ Data isolation correction completed!');
    console.log('\n🎯 Current State:');
    console.log('1. Super admin owns all existing products and orders');
    console.log('2. Admin users have clean slate (0 products, 0 orders)');
    console.log('3. Admin users will only see products they create going forward');
    console.log('4. Each admin operates as independent seller with own data');

  } catch (error) {
    console.error('❌ Error correcting data isolation:', error);
    throw error;
  }
};

// Run the correction if executed directly
if (require.main === module) {
  correctDataIsolation()
    .then(() => {
      console.log('✅ Data isolation correction completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Data isolation correction failed:', error);
      process.exit(1);
    });
}

export default correctDataIsolation;