import mongoose from 'mongoose';
import User from '../models/User';
import Product from '../models/Product';
import Order from '../models/Order';
import connectDB from '../config/database';

// Fix data isolation by assigning ownership to existing data
export const fixDataIsolation = async () => {
  try {
    await connectDB();
    console.log('🔧 Fixing Data Isolation...');

    // Get admin users
    const adminUsers = await User.find({ primaryRole: 'admin' }, '_id email');
    console.log(`\n📋 Found ${adminUsers.length} admin users`);

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found');
      return;
    }

    // Fix products without createdBy
    const orphanProducts = await Product.find({ 
      $or: [
        { createdBy: { $exists: false } },
        { createdBy: null }
      ]
    });

    console.log(`\n📦 Found ${orphanProducts.length} products without proper ownership`);

    if (orphanProducts.length > 0) {
      // Distribute products among admin users
      let adminIndex = 0;
      let updatedCount = 0;

      for (const product of orphanProducts) {
        const assignedAdmin = adminUsers[adminIndex % adminUsers.length];
        
        await Product.updateOne(
          { _id: product._id },
          { 
            createdBy: assignedAdmin._id,
            updatedBy: assignedAdmin._id
          }
        );

        console.log(`✅ Assigned "${product.name}" to ${assignedAdmin.email}`);
        updatedCount++;
        adminIndex++;
      }

      console.log(`\n🎯 Updated ${updatedCount} products with proper ownership`);
    }

    // Check orders and fix sellerId if needed
    const orders = await Order.find({});
    console.log(`\n🛒 Found ${orders.length} orders`);

    let orderUpdates = 0;
    for (const order of orders) {
      let needsUpdate = false;
      const updatedItems = [];

      for (const item of order.items) {
        if (!item.sellerId) {
          // Find the product and assign its creator as seller
          const product = await Product.findById(item.product);
          if (product && product.createdBy) {
            updatedItems.push({
              ...item,
              sellerId: product.createdBy
            });
            needsUpdate = true;
          } else {
            // Assign to first admin if product not found
            updatedItems.push({
              ...item,
              sellerId: adminUsers[0]._id
            });
            needsUpdate = true;
          }
        } else {
          updatedItems.push(item);
        }
      }

      if (needsUpdate) {
        await Order.updateOne(
          { _id: order._id },
          { items: updatedItems }
        );
        orderUpdates++;
        console.log(`✅ Updated order ${order.orderNumber} with seller IDs`);
      }
    }

    if (orderUpdates > 0) {
      console.log(`\n🎯 Updated ${orderUpdates} orders with proper seller IDs`);
    }

    // Verify data isolation
    console.log('\n🔍 Verifying Data Isolation:');
    for (const admin of adminUsers) {
      const myProducts = await Product.countDocuments({ createdBy: admin._id, isActive: true });
      const myOrders = await Order.countDocuments({ 'items.sellerId': admin._id });
      
      console.log(`- ${admin.email}:`);
      console.log(`  • Products: ${myProducts}`);
      console.log(`  • Orders: ${myOrders}`);
    }

    console.log('\n✅ Data isolation fix completed!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Admin users should now see their own products and orders');
    console.log('2. Dashboard will show isolated metrics for each admin');
    console.log('3. Product creation will automatically assign ownership');

  } catch (error) {
    console.error('❌ Error fixing data isolation:', error);
    throw error;
  }
};

// Run the fix if executed directly
if (require.main === module) {
  fixDataIsolation()
    .then(() => {
      console.log('✅ Data isolation fix completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Data isolation fix failed:', error);
      process.exit(1);
    });
}

export default fixDataIsolation;