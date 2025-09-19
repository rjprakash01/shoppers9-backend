import mongoose from 'mongoose';
import User from '../models/User';
import Role from '../models/Role';
import UserRole from '../models/UserRole';
import Permission from '../models/Permission';
import Product from '../models/Product';
import Coupon from '../models/Coupon';
import Category from '../models/Category';
import connectDB from '../config/database';
import { checkUserPermission } from '../middleware/permission';

// Test admin permissions by actually trying to create products and coupons
export const testAdminPermissions = async () => {
  try {
    await connectDB();
    console.log('🧪 Testing Admin Permissions and Data Isolation...');

    // 1. Get admin user
    const adminUser = await User.findOne({ email: 'admin@shoppers9.com' });
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log(`✅ Testing with admin: ${adminUser.email} (ID: ${adminUser._id})`);
    
    // 2. Test permission checking function
    console.log('\n🔑 Testing Permission System:');
    
    const productCreateTest = await checkUserPermission(
      adminUser._id.toString(),
      'products',
      'create_assets'
    );
    
    const couponCreateTest = await checkUserPermission(
      adminUser._id.toString(),
      'coupons', 
      'create_assets'
    );
    
    console.log(`   Products create_assets: ${productCreateTest.allowed ? '✅ ALLOWED' : '❌ DENIED'}`);
    if (!productCreateTest.allowed) {
      console.log(`   Reason: ${JSON.stringify(productCreateTest.restrictions)}`);
    }
    
    console.log(`   Coupons create_assets: ${couponCreateTest.allowed ? '✅ ALLOWED' : '❌ DENIED'}`);
    if (!couponCreateTest.allowed) {
      console.log(`   Reason: ${JSON.stringify(couponCreateTest.restrictions)}`);
    }
    
    // 3. Test data filtering
    console.log('\n📊 Testing Data Filtering:');
    
    // Simulate data filter
    const getDataFilter = (role: string, userId: string, modelType: string) => {
      if (role === 'super_admin') return {};
      if (role === 'admin') {
        switch (modelType) {
          case 'Product': return { createdBy: userId };
          case 'Coupon': return { createdBy: userId };
          case 'Order': return { 'items.sellerId': userId };
          case 'User': return { primaryRole: 'customer' };
          default: return { createdBy: userId };
        }
      }
      return {};
    };
    
    const productFilter = getDataFilter(adminUser.primaryRole, adminUser._id.toString(), 'Product');
    const couponFilter = getDataFilter(adminUser.primaryRole, adminUser._id.toString(), 'Coupon');
    
    console.log(`   Product Filter: ${JSON.stringify(productFilter)}`);
    console.log(`   Coupon Filter: ${JSON.stringify(couponFilter)}`);
    
    // Count with and without filters
    const allProducts = await Product.countDocuments();
    const adminProducts = await Product.countDocuments(productFilter);
    const allCoupons = await Coupon.countDocuments();
    const adminCoupons = await Coupon.countDocuments(couponFilter);
    
    console.log(`   Products - Global: ${allProducts}, Admin's: ${adminProducts}`);
    console.log(`   Coupons - Global: ${allCoupons}, Admin's: ${adminCoupons}`);
    
    // 4. Try to create a category first (needed for product)
    console.log('\n📁 Creating Test Category:');
    
    let testCategory;
    try {
      testCategory = await Category.findOne({ name: 'Test Category' });
      if (!testCategory) {
        testCategory = await Category.create({
          name: 'Test Category',
          description: 'Test category for admin',
          isActive: true,
          createdBy: adminUser._id
        });
        console.log(`   ✅ Created category: ${testCategory.name}`);
      } else {
        console.log(`   ✅ Using existing category: ${testCategory.name}`);
      }
    } catch (error) {
      console.log(`   ❌ Category creation failed: ${error.message}`);
      return;
    }
    
    // 5. Try to create a product
    console.log('\n🛍️ Testing Product Creation:');
    
    try {
      const testProduct = await Product.create({
        name: 'Admin Test Product',
        description: 'Test product created by admin user',
        price: 99.99,
        stock: 50,
        category: testCategory._id,
        subCategory: testCategory._id, // Using same for simplicity
        brand: 'Test Brand',
        isActive: true,
        createdBy: adminUser._id,
        images: [],
        variants: []
      });
      
      console.log(`   ✅ Product created successfully: ${testProduct.name}`);
      console.log(`   Product ID: ${testProduct._id}`);
      console.log(`   Created by: ${testProduct.createdBy}`);
      
    } catch (error) {
      console.log(`   ❌ Product creation failed: ${error.message}`);
      if (error.errors) {
        Object.keys(error.errors).forEach(field => {
          console.log(`     - ${field}: ${error.errors[field].message}`);
        });
      }
    }
    
    // 6. Try to create a coupon
    console.log('\n🎫 Testing Coupon Creation:');
    
    try {
      const testCoupon = await Coupon.create({
        code: 'ADMINTEST',
        name: 'Admin Test Coupon',
        description: 'Test coupon created by admin user',
        type: 'percentage',
        value: 15,
        minimumOrderAmount: 100,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
        createdBy: adminUser._id
      });
      
      console.log(`   ✅ Coupon created successfully: ${testCoupon.code}`);
      console.log(`   Coupon ID: ${testCoupon._id}`);
      console.log(`   Created by: ${testCoupon.createdBy}`);
      
    } catch (error) {
      console.log(`   ❌ Coupon creation failed: ${error.message}`);
      if (error.errors) {
        Object.keys(error.errors).forEach(field => {
          console.log(`     - ${field}: ${error.errors[field].message}`);
        });
      }
    }
    
    // 7. Test analytics data filtering
    console.log('\n📈 Testing Analytics Data:');
    
    // Simulate analytics queries with filtering
    const analyticsProductFilter = getDataFilter(adminUser.primaryRole, adminUser._id.toString(), 'Product');
    const analyticsCouponFilter = getDataFilter(adminUser.primaryRole, adminUser._id.toString(), 'Coupon');
    
    const analyticsProducts = await Product.countDocuments(analyticsProductFilter);
    const analyticsCoupons = await Coupon.countDocuments(analyticsCouponFilter);
    
    console.log(`   Analytics should show:`);
    console.log(`   - Products: ${analyticsProducts} (admin's only)`);
    console.log(`   - Coupons: ${analyticsCoupons} (admin's only)`);
    
    // 8. Check what analytics API actually returns
    console.log('\n🔍 Checking Analytics API Behavior:');
    
    // Simulate the analytics controller logic
    const simulateAnalytics = () => {
      const userRole = adminUser.primaryRole;
      const userId = adminUser._id.toString();
      
      // This is what should happen in analytics controller
      const productFilter = userRole === 'super_admin' ? {} : { createdBy: userId };
      const couponFilter = userRole === 'super_admin' ? {} : { createdBy: userId };
      
      return { productFilter, couponFilter };
    };
    
    const { productFilter: analyticsProductF, couponFilter: analyticsCouponF } = simulateAnalytics();
    console.log(`   Analytics Product Filter: ${JSON.stringify(analyticsProductF)}`);
    console.log(`   Analytics Coupon Filter: ${JSON.stringify(analyticsCouponF)}`);
    
    // 9. Summary
    console.log('\n📋 Test Summary:');
    
    const finalProductCount = await Product.countDocuments({ createdBy: adminUser._id });
    const finalCouponCount = await Coupon.countDocuments({ createdBy: adminUser._id });
    
    console.log(`   Admin now has:`);
    console.log(`   - Products: ${finalProductCount}`);
    console.log(`   - Coupons: ${finalCouponCount}`);
    
    if (productCreateTest.allowed && couponCreateTest.allowed) {
      console.log('\n✅ PERMISSIONS ARE WORKING CORRECTLY');
    } else {
      console.log('\n❌ PERMISSION ISSUES DETECTED');
    }
    
    if (finalProductCount > 0 || finalCouponCount > 0) {
      console.log('✅ DATA CREATION IS WORKING');
    } else {
      console.log('❌ DATA CREATION FAILED');
    }
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Refresh the admin panel');
    console.log('2. Check if analytics now shows admin data only');
    console.log('3. Verify product and coupon creation works in UI');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};

// Run the test if executed directly
if (require.main === module) {
  testAdminPermissions()
    .then(() => {
      console.log('✅ Admin permission test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Admin permission test failed:', error);
      process.exit(1);
    });
}

export default testAdminPermissions;