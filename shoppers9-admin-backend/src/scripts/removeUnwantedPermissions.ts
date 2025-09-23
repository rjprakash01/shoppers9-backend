import mongoose from 'mongoose';
import Permission from '../models/Permission';
import Role from '../models/Role';
import UserRole from '../models/UserRole';
import connectDB from '../config/database';

const removeUnwantedPermissions = async () => {
  try {
    console.log('🚀 Starting removal of unwanted permissions...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');
    
    // Actions to remove
    const actionsToRemove = ['create', 'export', 'import', 'approve', 'reject'];
    
    console.log(`\n🎯 Removing permissions with actions: ${actionsToRemove.join(', ')}`);
    
    // Find permissions to remove
    const permissionsToRemove = await Permission.find({
      action: { $in: actionsToRemove }
    });
    
    console.log(`📊 Found ${permissionsToRemove.length} permissions to remove`);
    
    if (permissionsToRemove.length === 0) {
      console.log('✅ No permissions found with unwanted actions');
      return;
    }
    
    // Get permission IDs
    const permissionIds = permissionsToRemove.map(p => p._id);
    
    // Remove these permissions from all roles
    console.log('\n🔧 Removing permissions from roles...');
    const roleUpdateResult = await Role.updateMany(
      { permissions: { $in: permissionIds } },
      { $pull: { permissions: { $in: permissionIds } } }
    );
    console.log(`✅ Updated ${roleUpdateResult.modifiedCount} roles`);
    
    // Remove these permissions from all user roles
    console.log('\n👥 Removing permissions from user roles...');
    const userRoleUpdateResult = await UserRole.updateMany(
      { 'permissions.permissionId': { $in: permissionIds } },
      { $pull: { permissions: { permissionId: { $in: permissionIds } } } }
    );
    console.log(`✅ Updated ${userRoleUpdateResult.modifiedCount} user roles`);
    
    // Delete the permissions
    console.log('\n🗑️ Deleting permissions from database...');
    const deleteResult = await Permission.deleteMany({
      action: { $in: actionsToRemove }
    });
    console.log(`✅ Deleted ${deleteResult.deletedCount} permissions`);
    
    // Show summary
    console.log('\n📋 Summary:');
    console.log(`- Permissions deleted: ${deleteResult.deletedCount}`);
    console.log(`- Roles updated: ${roleUpdateResult.modifiedCount}`);
    console.log(`- User roles updated: ${userRoleUpdateResult.modifiedCount}`);
    
    console.log('\n🎉 Successfully removed unwanted permissions!');
    
  } catch (error) {
    console.error('❌ Error removing permissions:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
if (require.main === module) {
  removeUnwantedPermissions()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default removeUnwantedPermissions;