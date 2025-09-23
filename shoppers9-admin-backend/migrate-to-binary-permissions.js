const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define schemas
const PermissionSchema = new mongoose.Schema({
  module: { type: String, required: true },
  action: { type: String, required: true },
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
  moduleAccess: [{
    module: String,
    hasAccess: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  userName: String,
  email: String,
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  moduleAccess: [{
    module: String,
    hasAccess: { type: Boolean, default: false }
  }]
});

const Permission = mongoose.model('Permission', PermissionSchema);
const Role = mongoose.model('Role', RoleSchema);
const User = mongoose.model('User', UserSchema);

// Migration functions
const migratePermissionsToBinary = async () => {
  console.log('🔄 Starting migration to binary permission model...');
  
  try {
    // Step 1: Get all existing permissions and group by module
    const permissions = await Permission.find({});
    const moduleGroups = {};
    
    permissions.forEach(permission => {
      if (!moduleGroups[permission.module]) {
        moduleGroups[permission.module] = [];
      }
      moduleGroups[permission.module].push(permission);
    });
    
    console.log(`📊 Found ${permissions.length} permissions across ${Object.keys(moduleGroups).length} modules`);
    
    // Step 2: Update all roles to use binary module access
    const roles = await Role.find({}).populate('permissions');
    console.log(`👥 Processing ${roles.length} roles...`);
    
    for (const role of roles) {
      const moduleAccess = [];
      
      // For each module, check if role has any permissions
      Object.keys(moduleGroups).forEach(module => {
        const hasAnyPermission = role.permissions.some(perm => perm.module === module);
        moduleAccess.push({
          module: module,
          hasAccess: hasAnyPermission
        });
      });
      
      // Update role with binary module access
      await Role.findByIdAndUpdate(role._id, {
        $set: { moduleAccess: moduleAccess }
      });
      
      console.log(`✅ Updated role: ${role.name} with ${moduleAccess.filter(m => m.hasAccess).length}/${moduleAccess.length} module access`);
    }
    
    // Step 3: Update all users to inherit from their role or set default access
    const users = await User.find({}).populate('role');
    console.log(`👤 Processing ${users.length} users...`);
    
    for (const user of users) {
      let userModuleAccess = [];
      
      if (user.role && user.role.moduleAccess) {
        // Inherit from role
        userModuleAccess = user.role.moduleAccess.map(access => ({
          module: access.module,
          hasAccess: access.hasAccess
        }));
      } else {
        // Set default access (no access to any module)
        Object.keys(moduleGroups).forEach(module => {
          userModuleAccess.push({
            module: module,
            hasAccess: false
          });
        });
      }
      
      // Update user with binary module access
      await User.findByIdAndUpdate(user._id, {
        $set: { moduleAccess: userModuleAccess }
      });
      
      console.log(`✅ Updated user: ${user.userName || user.email} with ${userModuleAccess.filter(m => m.hasAccess).length}/${userModuleAccess.length} module access`);
    }
    
    // Step 4: Create backup of old permission structure
    console.log('💾 Creating backup of old permission structure...');
    
    const backupData = {
      permissions: permissions,
      roles: roles.map(role => ({
        _id: role._id,
        name: role.name,
        permissions: role.permissions
      })),
      timestamp: new Date(),
      migrationVersion: '1.0.0'
    };
    
    // Save backup to a collection
    const BackupSchema = new mongoose.Schema({}, { strict: false });
    const Backup = mongoose.model('PermissionMigrationBackup', BackupSchema);
    await Backup.create(backupData);
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Summary:');
    console.log(`   - Migrated ${roles.length} roles to binary module access`);
    console.log(`   - Migrated ${users.length} users to binary module access`);
    console.log(`   - Created backup of ${permissions.length} old permissions`);
    console.log(`   - Processed ${Object.keys(moduleGroups).length} modules`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Rollback function (in case migration needs to be reversed)
const rollbackMigration = async () => {
  console.log('🔄 Rolling back binary permission migration...');
  
  try {
    const BackupSchema = new mongoose.Schema({}, { strict: false });
    const Backup = mongoose.model('PermissionMigrationBackup', BackupSchema);
    
    const backup = await Backup.findOne().sort({ timestamp: -1 });
    if (!backup) {
      throw new Error('No backup found for rollback');
    }
    
    console.log(`📦 Found backup from ${backup.timestamp}`);
    
    // Restore roles
    for (const roleData of backup.roles) {
      await Role.findByIdAndUpdate(roleData._id, {
        $set: { permissions: roleData.permissions },
        $unset: { moduleAccess: 1 }
      });
    }
    
    // Remove moduleAccess from users
    await User.updateMany({}, {
      $unset: { moduleAccess: 1 }
    });
    
    console.log('✅ Rollback completed successfully!');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    if (command === 'rollback') {
      await rollbackMigration();
    } else {
      await migratePermissionsToBinary();
    }
  } catch (error) {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  migratePermissionsToBinary,
  rollbackMigration
};