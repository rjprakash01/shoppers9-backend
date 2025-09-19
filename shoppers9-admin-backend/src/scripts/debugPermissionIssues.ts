import mongoose from 'mongoose';
import User from '../models/User';
import Role from '../models/Role';
import UserRole from '../models/UserRole';
import Permission from '../models/Permission';
import Product from '../models/Product';
import Order from '../models/Order';
import connectDB from '../config/database';

// Debug permission and data isolation issues
export const debugPermissionIssues = async () => {
  try {
    await connectDB();
    console.log('🔍 Debugging Permission and Data Isolation Issues...');

    // 1. Check admin user and their permissions
    console.log('\n1. 📋 Checking Admin User Permissions:');
    const adminUser = await User.findOne({ email: 'admin@shoppers9.com' });
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log(`✅ Admin User Found: ${adminUser.email} (Role: ${adminUser.primaryRole})`);
    
    // Check UserRole for this admin
    const userRole = await UserRole.findOne({ userId: adminUser._id, isActive: true })
      .populate('roleId')
      .populate('permissions.permissionId');
    
    if (!userRole) {
      console.log('❌ No UserRole found for admin user!');
      return;
    }
    
    const role = userRole.roleId as any;
    console.log(`✅ UserRole Found: ${role.name}`);
    console.log(`   - Role Permissions: ${role.permissions.length}`);
    console.log(`   - User Specific Permissions: ${userRole.permissions.length}`);
    
    // 2. Check specific permissions for products and coupons
    console.log('\n2. 🔑 Checking Specific Permissions:');
    
    const rolePermissions = await Permission.find({ _id: { $in: role.permissions } });
    
    const productPermissions = rolePermissions.filter(p => p.module === 'products');
    const couponPermissions = rolePermissions.filter(p => p.module === 'coupons');
    
    console.log(`\n   Products Module Permissions (${productPermissions.length}):`);
    productPermissions.forEach(p => {
      console.log(`   - ${p.module}:${p.action}:${p.scope} (${p.isActive ? 'Active' : 'Inactive'})`);
    });
    
    console.log(`\n   Coupons Module Permissions (${couponPermissions.length}):`);
    couponPermissions.forEach(p => {
      console.log(`   - ${p.module}:${p.action}:${p.scope} (${p.isActive ? 'Active' : 'Inactive'})`);
    });
    
    // Check for create_assets permission specifically
    const createAssetsPermissions = rolePermissions.filter(p => p.action === 'create_assets');
    console.log(`\n   Create Assets Permissions (${createAssetsPermissions.length}):`);
    createAssetsPermissions.forEach(p => {
      console.log(`   - ${p.module}:${p.action}:${p.scope} (${p.isActive ? 'Active' : 'Inactive'})`);
    });
    
    // 3. Test data filtering
    console.log('\n3. 📊 Testing Data Filtering:');
    
    // Check products
    const allProducts = await Product.countDocuments();
    const adminProducts = await Product.countDocuments({ createdBy: adminUser._id });
    console.log(`   Products - Total: ${allProducts}, Admin's: ${adminProducts}`);
    
    // Check orders
    const allOrders = await Order.countDocuments();
    const adminOrders = await Order.countDocuments({ 'items.sellerId': adminUser._id });
    console.log(`   Orders - Total: ${allOrders}, Admin's: ${adminOrders}`);
    
    // 4. Check if data filter middleware is working
    console.log('\n4. 🛠️ Data Filter Middleware Test:');
    
    // Simulate data filter function
    const getDataFilterForRole = (role: string, userId: string, modelType: string): any => {
      if (role === 'super_admin') {
        return {};
      }
      
      if (role === 'admin') {
        switch (modelType) {
          case 'Product':
            return { createdBy: userId };
          case 'Order':
            return { 'items.sellerId': userId };
          default:
            return { createdBy: userId };
        }
      }
      
      return {};
    };
    
    const productFilter = getDataFilterForRole(adminUser.primaryRole, adminUser._id.toString(), 'Product');
    const orderFilter = getDataFilterForRole(adminUser.primaryRole, adminUser._id.toString(), 'Order');
    
    console.log(`   Product Filter: ${JSON.stringify(productFilter)}`);
    console.log(`   Order Filter: ${JSON.stringify(orderFilter)}`);
    
    const filteredProducts = await Product.countDocuments(productFilter);
    const filteredOrders = await Order.countDocuments(orderFilter);
    
    console.log(`   Filtered Products: ${filteredProducts}`);
    console.log(`   Filtered Orders: ${filteredOrders}`);
    
    // 5. Check permission validation
    console.log('\n5. ✅ Permission Validation Test:');
    
    const hasProductCreateAssets = rolePermissions.some(p => 
      p.module === 'products' && p.action === 'create_assets' && p.isActive
    );
    const hasCouponCreateAssets = rolePermissions.some(p => 
      p.module === 'coupons' && p.action === 'create_assets' && p.isActive
    );
    
    console.log(`   Can create product assets: ${hasProductCreateAssets ? '✅ YES' : '❌ NO'}`);
    console.log(`   Can create coupon assets: ${hasCouponCreateAssets ? '✅ YES' : '❌ NO'}`);
    
    // 6. Summary and recommendations
    console.log('\n6. 📝 Summary & Recommendations:');
    
    if (!hasProductCreateAssets) {
      console.log('   ❌ ISSUE: Admin lacks products:create_assets permission');
      console.log('   💡 FIX: Grant products:create_assets permission to admin role');
    }
    
    if (!hasCouponCreateAssets) {
      console.log('   ❌ ISSUE: Admin lacks coupons:create_assets permission');
      console.log('   💡 FIX: Grant coupons:create_assets permission to admin role');
    }
    
    if (adminProducts === 0 && allProducts > 0) {
      console.log('   ❌ ISSUE: Admin has no products but global products exist');
      console.log('   💡 FIX: Data isolation working correctly - admin should create own products');
    }
    
    if (adminOrders === 0 && allOrders > 0) {
      console.log('   ❌ ISSUE: Admin has no orders but global orders exist');
      console.log('   💡 FIX: Data isolation working correctly - admin will see orders when they have products');
    }
    
    console.log('\n✅ Debug completed!');
    
  } catch (error) {
    console.error('❌ Error debugging permission issues:', error);
    throw error;
  }
};

// Run the debug if executed directly
if (require.main === module) {
  debugPermissionIssues()
    .then(() => {
      console.log('✅ Permission debug completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Permission debug failed:', error);
      process.exit(1);
    });
}

export default debugPermissionIssues;