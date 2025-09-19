import mongoose from 'mongoose';
import User from '../models/User';
import Role from '../models/Role';
import UserRole from '../models/UserRole';
import connectDB from '../config/database';

// Create UserRole entries for existing admin users
export const createUserRolesForAdmins = async () => {
  try {
    await connectDB();
    console.log('🔄 Creating UserRole entries for existing admin users...');

    // Find all admin and sub_admin users
    const adminUsers = await User.find({
      primaryRole: { $in: ['admin', 'sub_admin'] },
      isActive: true
    });

    console.log(`Found ${adminUsers.length} admin users`);

    let createdCount = 0;
    let existingCount = 0;

    for (const user of adminUsers) {
      // Check if UserRole already exists
      const existingUserRole = await UserRole.findOne({ 
        userId: user._id, 
        isActive: true 
      });

      if (existingUserRole) {
        console.log(`✅ UserRole already exists for ${user.email}`);
        existingCount++;
        continue;
      }

      // Find the role for this user
      const role = await Role.findOne({ name: user.primaryRole });
      if (!role) {
        console.log(`❌ Role '${user.primaryRole}' not found for user ${user.email}`);
        continue;
      }

      // Create UserRole entry
      await UserRole.create({
        userId: user._id,
        roleId: role._id,
        permissions: [],
        isActive: true,
        assignedBy: user._id // Self-assigned
      });

      console.log(`✅ Created UserRole entry for ${user.email} (${user.primaryRole})`);
      createdCount++;
    }

    console.log('\n📊 UserRole Creation Summary:');
    console.log(`- Created: ${createdCount} new UserRole entries`);
    console.log(`- Existing: ${existingCount} UserRole entries`);
    console.log(`- Total Admin Users: ${adminUsers.length}`);
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Super admin can now grant permissions to admin users');
    console.log('2. Admin users will see modules based on granted permissions');
    console.log('3. Data isolation ensures each admin sees only their own data');

  } catch (error) {
    console.error('❌ Error creating UserRole entries:', error);
    throw error;
  }
};

// Run the script if executed directly
if (require.main === module) {
  createUserRolesForAdmins()
    .then(() => {
      console.log('✅ UserRole creation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ UserRole creation failed:', error);
      process.exit(1);
    });
}

export default createUserRolesForAdmins;