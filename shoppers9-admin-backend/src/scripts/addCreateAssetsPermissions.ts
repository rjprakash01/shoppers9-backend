import mongoose from 'mongoose';
import Permission from '../models/Permission';
import Role from '../models/Role';
import connectDB from '../config/database';

// Add create_assets permissions for products and coupons modules
export const addCreateAssetsPermissions = async () => {
  try {
    await connectDB();
    console.log('🔧 Adding Create Assets Permissions...');

    // Define the new permissions to be added
    const newPermissions = [
      {
        module: 'products',
        action: 'create_assets',
        resource: '*',
        description: 'Create and manage product assets (images, videos, documents)',
        isActive: true
      },
      {
        module: 'coupons',
        action: 'create_assets',
        resource: '*',
        description: 'Create and manage coupon assets (images, promotional materials)',
        isActive: true
      }
    ];

    console.log('\n📋 Creating new permissions:');
    const createdPermissions = [];

    for (const permissionData of newPermissions) {
      // Check if permission already exists
      const existingPermission = await Permission.findOne({
        module: permissionData.module,
        action: permissionData.action,
        resource: permissionData.resource
      });

      if (existingPermission) {
        console.log(`⚠️  Permission already exists: ${permissionData.module}:${permissionData.action}`);
        continue;
      }

      // Create new permission
      const permission = await Permission.create(permissionData);
      createdPermissions.push(permission);
      console.log(`✅ Created permission: ${permission.module}:${permission.action}`);
    }

    if (createdPermissions.length === 0) {
      console.log('\n🎯 All permissions already exist!');
      return;
    }

    // Get admin and sub_admin roles
    const adminRole = await Role.findOne({ name: 'admin' });
    const subAdminRole = await Role.findOne({ name: 'sub_admin' });
    const superAdminRole = await Role.findOne({ name: 'super_admin' });

    console.log('\n🔑 Adding permissions to roles:');

    // Add permissions to super_admin role (gets all permissions)
    if (superAdminRole) {
      const newPermissionIds = createdPermissions.map(p => p._id);
      await Role.updateOne(
        { _id: superAdminRole._id },
        { $addToSet: { permissions: { $each: newPermissionIds } } }
      );
      console.log(`✅ Added ${createdPermissions.length} permissions to super_admin role`);
    }

    // Add permissions to admin role
    if (adminRole) {
      const newPermissionIds = createdPermissions.map(p => p._id);
      await Role.updateOne(
        { _id: adminRole._id },
        { $addToSet: { permissions: { $each: newPermissionIds } } }
      );
      console.log(`✅ Added ${createdPermissions.length} permissions to admin role`);
    }

    // Add permissions to sub_admin role
    if (subAdminRole) {
      const newPermissionIds = createdPermissions.map(p => p._id);
      await Role.updateOne(
        { _id: subAdminRole._id },
        { $addToSet: { permissions: { $each: newPermissionIds } } }
      );
      console.log(`✅ Added ${createdPermissions.length} permissions to sub_admin role`);
    }

    // Verify the permissions were added
    console.log('\n🔍 Verifying permissions:');
    for (const permission of createdPermissions) {
      const roles = await Role.find({ permissions: permission._id }, 'name');
      console.log(`- ${permission.module}:${permission.action} → Assigned to: ${roles.map(r => r.name).join(', ')}`);
    }

    console.log('\n✅ Create Assets permissions added successfully!');
    console.log('\n🎯 Summary:');
    console.log(`- Created ${createdPermissions.length} new permissions`);
    console.log('- Products: create_assets (manage product images, videos, documents)');
    console.log('- Coupons: create_assets (manage coupon images, promotional materials)');
    console.log('- Assigned to: super_admin, admin, sub_admin roles');
    console.log('\n📝 Next Steps:');
    console.log('1. Super admin can now grant these permissions to users');
    console.log('2. Admin and sub_admin users will have access to create assets');
    console.log('3. Update frontend to show asset creation options for these roles');

  } catch (error) {
    console.error('❌ Error adding create assets permissions:', error);
    throw error;
  }
};

// Run the script if executed directly
if (require.main === module) {
  addCreateAssetsPermissions()
    .then(() => {
      console.log('✅ Create assets permissions setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Create assets permissions setup failed:', error);
      process.exit(1);
    });
}

export default addCreateAssetsPermissions;