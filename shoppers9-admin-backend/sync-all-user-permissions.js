const mongoose = require('mongoose');
require('dotenv').config();

async function syncAllUserPermissions() {
  try {
    console.log('=== SYNCING ALL USER PERMISSIONS ===');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin');
    console.log('✅ Connected to database');
    
    // Define schemas
    const userRoleSchema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
      permissions: [{
        permissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Permission' },
        granted: { type: Boolean, default: true }
      }],
      isActive: { type: Boolean, default: true }
    }, { timestamps: true });
    
    const userSchema = new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      primaryRole: String
    });
    
    const adminSchema = new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      primaryRole: String
    });
    
    const roleSchema = new mongoose.Schema({
      name: String,
      displayName: String,
      permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }]
    });
    
    const permissionSchema = new mongoose.Schema({
      module: String,
      action: String,
      description: String
    });
    
    const UserRole = mongoose.model('UserRole', userRoleSchema);
    const User = mongoose.model('User', userSchema);
    const Admin = mongoose.model('Admin', adminSchema);
    const Role = mongoose.model('Role', roleSchema);
    const Permission = mongoose.model('Permission', permissionSchema);
    
    // Get all roles with their permissions
    const roles = await Role.find().populate('permissions');
    console.log(`Found ${roles.length} roles`);
    
    // Get all users from both collections
    const users = await User.find();
    const admins = await Admin.find();
    console.log(`Found ${users.length} users and ${admins.length} admins`);
    
    // Get all permissions
    const permissions = await Permission.find();
    console.log(`Found ${permissions.length} permissions`);
    
    let updatedCount = 0;
    let createdCount = 0;
    
    // Process users from 'users' collection
    for (const user of users) {
      console.log(`\nProcessing user: ${user.firstName} ${user.lastName} (${user.email})`);
      
      // Find the role for this user
      const userRole = user.primaryRole || 'user';
      const role = roles.find(r => r.name === userRole);
      
      if (!role) {
        console.log(`  ⚠️  No role found for '${userRole}', skipping`);
        continue;
      }
      
      console.log(`  Found role: ${role.displayName} with ${role.permissions.length} permissions`);
      
      // Check if UserRole entry exists
      let existingUserRole = await UserRole.findOne({ 
        userId: user._id, 
        roleId: role._id 
      });
      
      if (existingUserRole) {
        // Update permissions
        existingUserRole.permissions = role.permissions.map(permId => ({
          permissionId: permId,
          granted: true
        }));
        await existingUserRole.save();
        console.log(`  ✅ Updated UserRole with ${role.permissions.length} permissions`);
        updatedCount++;
      } else {
        // Create new UserRole entry
        const newUserRole = new UserRole({
          userId: user._id,
          roleId: role._id,
          permissions: role.permissions.map(permId => ({
            permissionId: permId,
            granted: true
          })),
          isActive: true
        });
        await newUserRole.save();
        console.log(`  ✅ Created new UserRole with ${role.permissions.length} permissions`);
        createdCount++;
      }
    }
    
    // Process users from 'admins' collection
    for (const admin of admins) {
      console.log(`\nProcessing admin: ${admin.firstName} ${admin.lastName} (${admin.email})`);
      
      // Find the role for this admin
      const adminRole = admin.primaryRole || 'admin';
      const role = roles.find(r => r.name === adminRole);
      
      if (!role) {
        console.log(`  ⚠️  No role found for '${adminRole}', skipping`);
        continue;
      }
      
      console.log(`  Found role: ${role.displayName} with ${role.permissions.length} permissions`);
      
      // Check if UserRole entry exists
      let existingUserRole = await UserRole.findOne({ 
        userId: admin._id, 
        roleId: role._id 
      });
      
      if (existingUserRole) {
        // Update permissions
        existingUserRole.permissions = role.permissions.map(permId => ({
          permissionId: permId,
          granted: true
        }));
        await existingUserRole.save();
        console.log(`  ✅ Updated UserRole with ${role.permissions.length} permissions`);
        updatedCount++;
      } else {
        // Create new UserRole entry
        const newUserRole = new UserRole({
          userId: admin._id,
          roleId: role._id,
          permissions: role.permissions.map(permId => ({
            permissionId: permId,
            granted: true
          })),
          isActive: true
        });
        await newUserRole.save();
        console.log(`  ✅ Created new UserRole with ${role.permissions.length} permissions`);
        createdCount++;
      }
    }
    
    console.log(`\n=== SYNC COMPLETED ===`);
    console.log(`Updated: ${updatedCount} UserRole entries`);
    console.log(`Created: ${createdCount} UserRole entries`);
    console.log(`Total processed: ${updatedCount + createdCount}`);
    
    // Verify the sync
    console.log('\n=== VERIFICATION ===');
    const allUserRoles = await UserRole.find({ isActive: true })
      .populate('userId')
      .populate('roleId');
    
    console.log(`Total active UserRole entries: ${allUserRoles.length}`);
    
    let withPermissions = 0;
    let withoutPermissions = 0;
    
    allUserRoles.forEach(ur => {
      if (ur.permissions && ur.permissions.length > 0) {
        withPermissions++;
      } else {
        withoutPermissions++;
        console.log(`  ⚠️  UserRole without permissions: ${ur.userId?.firstName} ${ur.userId?.lastName} (${ur.roleId?.displayName})`);
      }
    });
    
    console.log(`UserRoles with permissions: ${withPermissions}`);
    console.log(`UserRoles without permissions: ${withoutPermissions}`);
    
  } catch (error) {
    console.error('❌ Sync error:', error.message);
    console.error('   Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Sync completed');
  }
}

syncAllUserPermissions();