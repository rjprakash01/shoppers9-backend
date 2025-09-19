import mongoose from 'mongoose';
import Role from '../models/Role';
import Permission from '../models/Permission';
import connectDB from '../config/database';

// Grant create_assets permissions to admin role
export const grantCreateAssetsToAdmin = async () => {
  try {
    await connectDB();
    console.log('🔧 Granting Create Assets Permissions to Admin Role...');

    // Find admin role
    const adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      console.log('❌ Admin role not found!');
      return;
    }

    console.log(`✅ Admin Role Found: ${adminRole.name}`);
    console.log(`   Current permissions: ${adminRole.permissions.length}`);

    // Find create_assets permissions
    const createAssetsPermissions = await Permission.find({
      action: 'create_assets',
      module: { $in: ['products', 'coupons'] },
      isActive: true
    });

    console.log(`\n📋 Found ${createAssetsPermissions.length} create_assets permissions:`);
    createAssetsPermissions.forEach(p => {
      console.log(`   - ${p.module}:${p.action}:${p.scope}`);
    });

    // Check which permissions are missing
    const missingPermissions = createAssetsPermissions.filter(p => 
      !adminRole.permissions.includes(p._id)
    );

    if (missingPermissions.length === 0) {
      console.log('\n✅ Admin role already has all create_assets permissions!');
      return;
    }

    console.log(`\n🔧 Adding ${missingPermissions.length} missing permissions to admin role:`);
    
    // Add missing permissions
    for (const permission of missingPermissions) {
      adminRole.permissions.push(permission._id);
      console.log(`   ✅ Added: ${permission.module}:${permission.action}:${permission.scope}`);
    }

    // Save the role
    await adminRole.save();
    console.log(`\n💾 Admin role updated successfully!`);
    console.log(`   Total permissions now: ${adminRole.permissions.length}`);

    // Verify the permissions were added
    const updatedRole = await Role.findById(adminRole._id).populate('permissions');
    const createAssetsPerms = (updatedRole.permissions as any[]).filter(p => 
      p.action === 'create_assets'
    );

    console.log(`\n🔍 Verification - Admin role now has ${createAssetsPerms.length} create_assets permissions:`);
    createAssetsPerms.forEach(p => {
      console.log(`   ✅ ${p.module}:${p.action}:${p.scope}`);
    });

    console.log('\n🎉 Create assets permissions granted successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Admin users can now create products and coupons');
    console.log('2. Refresh the admin panel to see the changes');
    console.log('3. Test product and coupon creation');

  } catch (error) {
    console.error('❌ Error granting create assets permissions:', error);
    throw error;
  }
};

// Run the script if executed directly
if (require.main === module) {
  grantCreateAssetsToAdmin()
    .then(() => {
      console.log('✅ Create assets permissions granted!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to grant create assets permissions:', error);
      process.exit(1);
    });
}

export default grantCreateAssetsToAdmin;