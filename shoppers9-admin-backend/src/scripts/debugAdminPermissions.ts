import mongoose from 'mongoose';
import User from '../models/User';
import UserRole from '../models/UserRole';
import Role from '../models/Role';
import Permission from '../models/Permission';
import connectDB from '../config/database';

const debugAdminPermissions = async () => {
  try {
    await connectDB();
    console.log('🔍 Debugging Admin Permissions...');

    // Find admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`\n📋 Found ${adminUsers.length} admin users:`);
    
    for (const admin of adminUsers) {
      console.log(`\n👤 Admin: ${admin.firstName} ${admin.lastName} (${admin.email})`);
      console.log(`   ID: ${admin._id}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Active: ${admin.isActive}`);
      
      // Check UserRole assignment
      const userRole = await UserRole.findOne({ userId: admin._id, isActive: true })
        .populate('roleId');
      
      if (!userRole) {
        console.log('   ❌ No UserRole assignment found!');
        continue;
      }
      
      console.log(`   ✅ UserRole found:`);
      console.log(`      Role ID: ${userRole.roleId}`);
      console.log(`      Active: ${userRole.isActive}`);
      console.log(`      Expired: ${userRole.isExpired}`);
      console.log(`      Access Allowed: ${userRole.isAccessAllowed()}`);
      
      // Check module access
      console.log(`   📋 Module Access (${userRole.moduleAccess.length} modules):`);
      userRole.moduleAccess.forEach((m: any) => {
        console.log(`      ${m.module}: ${m.hasAccess ? '✅' : '❌'}`);
      });
      
      // Check specific products module access
      const productsAccess = userRole.moduleAccess.find((m: any) => m.module === 'products');
      console.log(`   🛍️  Products Module Access: ${productsAccess ? (productsAccess.hasAccess ? '✅ GRANTED' : '❌ DENIED') : '❓ NOT FOUND'}`);
      
      // Check role permissions
      const role = userRole.roleId as any;
      if (role && role.permissions) {
        console.log(`   🔑 Role Permissions (${role.permissions.length} permissions):`);
        
        const permissions = await Permission.find({ _id: { $in: role.permissions } });
        const productsPermissions = permissions.filter(p => p.module === 'products');
        
        console.log(`   🛍️  Products Permissions (${productsPermissions.length} found):`);
        productsPermissions.forEach(p => {
          console.log(`      ${p.module}:${p.action}:${p.scope} - Active: ${p.isActive}`);
        });
      }
    }
    
    console.log('\n🎯 Summary:');
    console.log('- Check if admin users have UserRole assignments');
    console.log('- Check if products module access is granted in UserRole.moduleAccess');
    console.log('- Check if role has products permissions');
    
  } catch (error) {
    console.error('❌ Error debugging admin permissions:', error);
  } finally {
    await mongoose.disconnect();
  }
};

debugAdminPermissions();