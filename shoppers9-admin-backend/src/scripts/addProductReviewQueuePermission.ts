import mongoose from 'mongoose';
import Permission from '../models/Permission';
import Role from '../models/Role';
import UserRole from '../models/UserRole';
import connectDB from '../config/database';

// Add product_review_queue permission and assign it to roles
export const addProductReviewQueuePermission = async () => {
  try {
    await connectDB();
    console.log('🔧 Adding Product Review Queue Permission...');

    // Check if permission already exists
    const existingPermission = await Permission.findOne({
      module: 'product_review_queue'
    });

    let permission;
    if (existingPermission) {
      console.log('⚠️  Product review queue permission already exists');
      permission = existingPermission;
    } else {
      // Create new permission
      permission = await Permission.create({
        name: 'Product Review Queue Access',
        module: 'product_review_queue',
        action: 'manage',
        description: 'Full access to product review queue module'
      });
      console.log('✅ Created product_review_queue permission');
    }

    // Find super admin and admin roles
    const superAdminRole = await Role.findOne({ name: 'super_admin' });
    const adminRole = await Role.findOne({ name: 'admin' });
    
    if (!superAdminRole) {
      console.log('❌ Super admin role not found!');
      return;
    }

    // Add permission to super admin role if not already present
    if (!superAdminRole.permissions.includes(permission._id)) {
      superAdminRole.permissions.push(permission._id);
      await superAdminRole.save();
      console.log('✅ Added product_review_queue permission to super_admin role');
    } else {
      console.log('⚠️  Super admin already has product_review_queue permission');
    }

    // Add permission to admin role if it exists and doesn't have it
    if (adminRole && !adminRole.permissions.includes(permission._id)) {
      adminRole.permissions.push(permission._id);
      await adminRole.save();
      console.log('✅ Added product_review_queue permission to admin role');
    } else if (adminRole) {
      console.log('⚠️  Admin already has product_review_queue permission');
    }

    // Update existing UserRole assignments for super admins to include this permission
    const superAdminUserRoles = await UserRole.find({
      roleId: superAdminRole._id
    });

    for (const userRole of superAdminUserRoles) {
      const hasPermission = userRole.permissions.some(
        p => p.permissionId && p.permissionId.toString() === permission._id.toString()
      );

      if (!hasPermission) {
        userRole.permissions.push({
          permissionId: permission._id,
          granted: true
        });
        userRole.assignedBy = userRole.userId; // Self-assigned for existing users
        await userRole.save();
        console.log(`✅ Added product_review_queue permission to user role assignment`);
      }
    }

    console.log('\n🎉 Product review queue permission setup completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Super admin can now access product approval functions');
    console.log('2. Restart the admin backend server');
    console.log('3. Test product approval workflow');

  } catch (error) {
    console.error('❌ Error adding product review queue permission:', error);
    throw error;
  }
};

// Run the script if called directly
if (require.main === module) {
  addProductReviewQueuePermission()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default addProductReviewQueuePermission;