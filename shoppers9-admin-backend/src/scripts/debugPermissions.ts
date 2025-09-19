import mongoose from 'mongoose';
import User from '../models/User';
import Role from '../models/Role';
import UserRole from '../models/UserRole';
import Permission from '../models/Permission';
import connectDB from '../config/database';

// Debug permission system
export const debugPermissions = async () => {
  try {
    await connectDB();
    console.log('🔍 Debugging Permission System...');

    // Check admin users
    const adminUsers = await User.find({ primaryRole: 'admin' }, 'email primaryRole');
    console.log('\n📋 Admin Users:');
    adminUsers.forEach(user => {
      console.log(`- ${user.email} (${user.primaryRole})`);
    });

    // Check UserRole entries
    const userRoles = await UserRole.find({})
      .populate('userId', 'email primaryRole')
      .populate('roleId', 'name')
      .populate('permissions.permissionId', 'module action scope');
    
    console.log('\n🔗 UserRole Entries:');
    userRoles.forEach(userRole => {
      const user = userRole.userId as any;
      const role = userRole.roleId as any;
      const grantedPermissions = userRole.permissions.filter(p => p.granted);
      console.log(`- ${user?.email} -> ${role?.name} (${grantedPermissions.length} granted permissions)`);
      grantedPermissions.forEach(p => {
        const perm = p.permissionId as any;
        console.log(`  ✓ ${perm?.module}:${perm?.action}:${perm?.scope}`);
      });
    });

    // Check Role permissions
    const roles = await Role.find({})
      .populate('permissions', 'module action scope');
    
    console.log('\n🎭 Role Permissions:');
    roles.forEach(role => {
      console.log(`- ${role.name} (${role.permissions.length} permissions)`);
      role.permissions.forEach((perm: any) => {
        console.log(`  ✓ ${perm.module}:${perm.action}:${perm.scope}`);
      });
    });

    // Check all permissions
    const allPermissions = await Permission.find({ isActive: true }, 'module action scope');
    console.log(`\n📜 Total Available Permissions: ${allPermissions.length}`);
    
    // Group by module
    const moduleGroups = allPermissions.reduce((acc: any, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(`${perm.action}:${perm.scope}`);
      return acc;
    }, {});
    
    Object.keys(moduleGroups).forEach(module => {
      console.log(`- ${module}: ${moduleGroups[module].join(', ')}`);
    });

    console.log('\n🎯 Recommendations:');
    console.log('1. Check if role permissions are being copied to UserRole entries');
    console.log('2. Verify permission granting creates individual UserRole permissions');
    console.log('3. Ensure getUserPermissions API returns correct data format');

  } catch (error) {
    console.error('❌ Error debugging permissions:', error);
    throw error;
  }
};

// Run the debug if executed directly
if (require.main === module) {
  debugPermissions()
    .then(() => {
      console.log('✅ Permission debugging completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Permission debugging failed:', error);
      process.exit(1);
    });
}

export default debugPermissions;