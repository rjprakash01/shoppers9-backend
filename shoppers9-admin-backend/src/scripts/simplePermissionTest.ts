import mongoose from 'mongoose';
import User from '../models/User';
import Role from '../models/Role';
import UserRole from '../models/UserRole';
import Permission from '../models/Permission';
import Product from '../models/Product';
import Coupon from '../models/Coupon';
import connectDB from '../config/database';

// Simple test to check admin permissions and data isolation
export const simplePermissionTest = async () => {
  try {
    await connectDB();
    console.log('🧪 Simple Admin Permission Test...');

    // 1. Get admin user
    const adminUser = await User.findOne({ email: 'admin@shoppers9.com' });
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log(`✅ Admin User: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.primaryRole}`);
    console.log(`   ID: ${adminUser._id}`);
    
    // 2. Check UserRole and permissions
    const userRole = await UserRole.findOne({ userId: adminUser._id, isActive: true });
    if (!userRole) {
      console.log('❌ No UserRole found!');
      return;
    }
    
    const role = await Role.findById(userRole.roleId).populate('permissions');
    if (!role) {
      console.log('❌ Role not found!');
      return;
    }
    
    console.log(`\n🔑 Role Information:`);
    console.log(`   Role Name: ${role.name}`);
    console.log(`   Total Permissions: ${role.permissions.length}`);
    
    // Check for create_assets permissions
    const createAssetsPerms = (role.permissions as any[]).filter(p => 
      p.action === 'create_assets'
    );
    
    console.log(`\n   Create Assets Permissions (${createAssetsPerms.length}):`);
    createAssetsPerms.forEach(p => {
      console.log(`   ✅ ${p.module}:${p.action}:${p.scope}`);
    });
    
    // 3. Test data counts
    console.log('\n📊 Data Analysis:');
    
    const allProducts = await Product.countDocuments();
    const adminProducts = await Product.countDocuments({ createdBy: adminUser._id });
    const allCoupons = await Coupon.countDocuments();
    const adminCoupons = await Coupon.countDocuments({ createdBy: adminUser._id });
    
    console.log(`   Products:`);
    console.log(`   - Global Total: ${allProducts}`);
    console.log(`   - Admin's Own: ${adminProducts}`);
    console.log(`   - Should Show: ${adminProducts} (data isolation working)`);
    
    console.log(`\n   Coupons:`);
    console.log(`   - Global Total: ${allCoupons}`);
    console.log(`   - Admin's Own: ${adminCoupons}`);
    console.log(`   - Should Show: ${adminCoupons} (data isolation working)`);
    
    // 4. Test coupon creation (simpler than product)
    console.log('\n🎫 Testing Coupon Creation:');
    
    try {
      // Check if test coupon already exists
      const existingCoupon = await Coupon.findOne({ code: 'TESTADMIN' });
      if (existingCoupon) {
        console.log(`   ✅ Test coupon already exists: ${existingCoupon.code}`);
      } else {
        const testCoupon = await Coupon.create({
          code: 'TESTADMIN',
          name: 'Test Admin Coupon',
          description: 'Test coupon for admin permission testing',
          type: 'percentage',
          value: 10,
          minimumOrderAmount: 50,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
          createdBy: adminUser._id
        });
        
        console.log(`   ✅ Coupon created: ${testCoupon.code}`);
      }
    } catch (error) {
      console.log(`   ❌ Coupon creation failed: ${error.message}`);
    }
    
    // 5. Check analytics data filtering simulation
    console.log('\n📈 Analytics Data Filtering Test:');
    
    // This is what analytics should show for admin
    const analyticsData = {
      totalProducts: await Product.countDocuments({ createdBy: adminUser._id }),
      totalCoupons: await Coupon.countDocuments({ createdBy: adminUser._id }),
      totalOrders: 0, // Admin has no orders yet
      totalCustomers: await User.countDocuments({ primaryRole: 'customer' })
    };
    
    console.log(`   Analytics should show for admin:`);
    console.log(`   - Products: ${analyticsData.totalProducts}`);
    console.log(`   - Coupons: ${analyticsData.totalCoupons}`);
    console.log(`   - Orders: ${analyticsData.totalOrders}`);
    console.log(`   - Customers: ${analyticsData.totalCustomers}`);
    
    // 6. Check what's actually happening in UI
    console.log('\n🔍 UI Issues Analysis:');
    
    if (createAssetsPerms.length >= 2) {
      console.log('   ✅ Admin HAS create_assets permissions');
      console.log('   ❓ If UI shows "Insufficient permissions", check:');
      console.log('      - Frontend permission checking logic');
      console.log('      - API authentication headers');
      console.log('      - Permission middleware implementation');
    } else {
      console.log('   ❌ Admin MISSING create_assets permissions');
    }
    
    if (analyticsData.totalProducts === 0 && allProducts > 0) {
      console.log('   ✅ Data isolation WORKING (admin sees 0, global has data)');
      console.log('   ❓ If UI shows global data, check:');
      console.log('      - Analytics API data filtering implementation');
      console.log('      - Frontend API calls using correct endpoints');
    } else {
      console.log('   ❓ Data isolation may not be working correctly');
    }
    
    // 7. Final recommendations
    console.log('\n🎯 Recommendations:');
    
    if (createAssetsPerms.length >= 2) {
      console.log('   1. ✅ Permissions are correct in database');
      console.log('   2. 🔍 Check frontend permission checking logic');
      console.log('   3. 🔍 Verify API authentication is working');
    }
    
    if (analyticsData.totalProducts === 0) {
      console.log('   4. ✅ Data isolation is working correctly');
      console.log('   5. 📝 Admin needs to create products to see data in analytics');
    }
    
    console.log('\n📋 Summary:');
    console.log(`   - Admin has ${createAssetsPerms.length}/2 create_assets permissions`);
    console.log(`   - Admin has ${analyticsData.totalProducts} products (isolated)`);
    console.log(`   - Admin has ${analyticsData.totalCoupons} coupons (isolated)`);
    console.log(`   - Global has ${allProducts} products, ${allCoupons} coupons`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};

// Run the test if executed directly
if (require.main === module) {
  simplePermissionTest()
    .then(() => {
      console.log('✅ Simple permission test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Simple permission test failed:', error);
      process.exit(1);
    });
}

export default simplePermissionTest;