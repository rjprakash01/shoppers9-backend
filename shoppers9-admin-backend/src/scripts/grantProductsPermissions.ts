import mongoose from 'mongoose';
import Role from '../models/Role';
import Permission from '../models/Permission';
import connectDB from '../config/database';

// Grant all products permissions to admin and sub_admin roles
export const grantProductsPermissions = async () => {
  try {
    await connectDB();
    console.log('🔧 Granting Products Permissions to Admin and Sub-Admin Roles...');

    // Find admin and sub_admin roles
    const adminRole = await Role.findOne({ name: 'admin' });
    const subAdminRole = await Role.findOne({ name: 'sub_admin' });
    
    if (!adminRole) {
      console.log('❌ Admin role not found!');
      return;
    }
    
    if (!subAdminRole) {
      console.log('❌ Sub-admin role not found!');
      return;
    }

    console.log(`✅ Admin Role Found: ${adminRole.name}`);
    console.log(`   Current permissions: ${adminRole.permissions.length}`);
    console.log(`✅ Sub-Admin Role Found: ${subAdminRole.name}`);
    console.log(`   Current permissions: ${subAdminRole.permissions.length}`);

    // Find all products permissions
    const productsPermissions = await Permission.find({
      module: 'products',
      isActive: true
    });

    console.log(`\n📋 Found ${productsPermissions.length} products permissions:`);
    productsPermissions.forEach(p => {
      console.log(`   - ${p.module}:${p.action}:${p.scope}`);
    });

    // Check which permissions are missing for admin role
    const missingAdminPermissions = productsPermissions.filter(p => 
      !adminRole.permissions.includes(p._id)
    );

    if (missingAdminPermissions.length > 0) {
      console.log(`\n🔧 Adding ${missingAdminPermissions.length} missing permissions to admin role:`);
      
      // Add missing permissions
      for (const permission of missingAdminPermissions) {
        adminRole.permissions.push(permission._id);
        console.log(`   ✅ Added: ${permission.module}:${permission.action}:${permission.scope}`);
      }

      // Save the admin role
      await adminRole.save();
      console.log(`\n💾 Admin role updated successfully!`);
      console.log(`   Total permissions now: ${adminRole.permissions.length}`);
    } else {
      console.log('\n✅ Admin role already has all products permissions!');
    }

    // Check which permissions are missing for sub_admin role
    const missingSubAdminPermissions = productsPermissions.filter(p => 
      !subAdminRole.permissions.includes(p._id)
    );

    if (missingSubAdminPermissions.length > 0) {
      console.log(`\n🔧 Adding ${missingSubAdminPermissions.length} missing permissions to sub_admin role:`);
      
      // Add missing permissions
      for (const permission of missingSubAdminPermissions) {
        subAdminRole.permissions.push(permission._id);
        console.log(`   ✅ Added: ${permission.module}:${permission.action}:${permission.scope}`);
      }

      // Save the sub_admin role
      await subAdminRole.save();
      console.log(`\n💾 Sub-admin role updated successfully!`);
      console.log(`   Total permissions now: ${subAdminRole.permissions.length}`);
    } else {
      console.log('\n✅ Sub-admin role already has all products permissions!');
    }

    // Verify the permissions were added
    const updatedAdminRole = await Role.findById(adminRole._id).populate('permissions');
    const updatedSubAdminRole = await Role.findById(subAdminRole._id).populate('permissions');
    
    const adminProductsPerms = (updatedAdminRole.permissions as any[]).filter(p => 
      p.module === 'products'
    );
    const subAdminProductsPerms = (updatedSubAdminRole.permissions as any[]).filter(p => 
      p.module === 'products'
    );

    console.log(`\n🔍 Verification - Admin role now has ${adminProductsPerms.length} products permissions:`);
    adminProductsPerms.forEach(p => {
      console.log(`   ✅ ${p.module}:${p.action}:${p.scope}`);
    });

    console.log(`\n🔍 Verification - Sub-admin role now has ${subAdminProductsPerms.length} products permissions:`);
    subAdminProductsPerms.forEach(p => {
      console.log(`   ✅ ${p.module}:${p.action}:${p.scope}`);
    });

    console.log('\n🎉 Products permissions granted successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Admin and sub-admin users can now access product management');
    console.log('2. Refresh the admin panel to see the changes');
    console.log('3. Test product creation and management');

  } catch (error) {
    console.error('❌ Error granting products permissions:', error);
    throw error;
  }
};

// Run the script if called directly
if (require.main === module) {
  grantProductsPermissions()
    .then(() => {
      console.log('✅ Products permissions granted!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Products permission grant failed:', error);
      process.exit(1);
    });
}

export default grantProductsPermissions;