const mongoose = require('mongoose');
require('dotenv').config();

// Define schemas
const adminSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  role: String,
  isActive: Boolean
});

const roleSchema = new mongoose.Schema({
  name: String,
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
  isActive: Boolean
});

const userRoleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  moduleAccess: [{
    module: String,
    hasAccess: { type: Boolean, default: false }
  }],
  isActive: { type: Boolean, default: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

const permissionSchema = new mongoose.Schema({
  module: String,
  action: String,
  scope: String,
  isActive: Boolean
});

const Admin = mongoose.model('Admin', adminSchema);
const Role = mongoose.model('Role', roleSchema);
const UserRole = mongoose.model('UserRole', userRoleSchema);
const Permission = mongoose.model('Permission', permissionSchema);

const grantAdminModuleAccess = async () => {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find all admin users
    const adminUsers = await Admin.find({ role: 'admin', isActive: true });
    console.log(`\n📋 Found ${adminUsers.length} admin users`);

    // Find admin role
    const adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      console.log('❌ Admin role not found!');
      return;
    }

    console.log(`✅ Found admin role: ${adminRole.name}`);

    // Get all available modules
    const allModules = [
      'dashboard', 'users', 'products', 'inventory', 'orders', 
      'shipping', 'coupons', 'support', 'categories', 'filters', 
      'banners', 'testimonials', 'admin_management', 'settings', 'analytics'
    ];

    let updatedCount = 0;
    let createdCount = 0;

    for (const admin of adminUsers) {
      console.log(`\n👤 Processing admin: ${admin.firstName} ${admin.lastName} (${admin.email})`);
      
      // Check if UserRole exists
      let userRole = await UserRole.findOne({ userId: admin._id, isActive: true });
      
      if (!userRole) {
        console.log('   ➕ Creating new UserRole entry...');
        userRole = new UserRole({
          userId: admin._id,
          roleId: adminRole._id,
          moduleAccess: [],
          isActive: true,
          assignedBy: admin._id
        });
        createdCount++;
      } else {
        console.log('   ✏️  Updating existing UserRole entry...');
        updatedCount++;
      }
      
      // Grant access to all modules for admin users
      const moduleAccess = allModules.map(module => ({
        module,
        hasAccess: true // Grant access to all modules for admin
      }));
      
      userRole.moduleAccess = moduleAccess;
      await userRole.save();
      
      console.log(`   ✅ Granted access to ${moduleAccess.length} modules`);
    }

    console.log('\n📊 Summary:');
    console.log(`- Created: ${createdCount} new UserRole entries`);
    console.log(`- Updated: ${updatedCount} existing UserRole entries`);
    console.log(`- Total processed: ${adminUsers.length} admin users`);
    console.log('\n🎯 All admin users now have full module access!');

  } catch (error) {
    console.error('❌ Error granting admin module access:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
};

grantAdminModuleAccess();