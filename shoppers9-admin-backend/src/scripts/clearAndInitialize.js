const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');

// Define schemas
const adminSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  password: String,
  role: String,
  isActive: Boolean
});

const roleSchema = new mongoose.Schema({
  name: String,
  displayName: String,
  description: String,
  level: Number,
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
  resource: String,
  description: String,
  isActive: Boolean
});

const Admin = mongoose.model('Admin', adminSchema);
const Role = mongoose.model('Role', roleSchema);
const UserRole = mongoose.model('UserRole', userRoleSchema);
const Permission = mongoose.model('Permission', permissionSchema);

const clearAndInitialize = async () => {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Clear existing data
    console.log('\n🧹 Clearing existing data...');
    await Admin.deleteMany({});
    await Role.deleteMany({});
    await UserRole.deleteMany({});
    await Permission.deleteMany({});
    console.log('✅ Cleared all collections');

    // Create permissions
    console.log('\n📝 Creating permissions...');
    const modules = [
      'dashboard', 'users', 'products', 'inventory', 'orders', 'shipping',
      'coupons', 'support', 'categories', 'filters', 'banners', 'testimonials',
      'admin_management', 'settings', 'analytics'
    ];
    
    const actions = ['read', 'edit', 'delete', 'create_assets'];
    const permissions = [];
    
    for (const module of modules) {
      for (const action of actions) {
        // Skip certain action-module combinations that don't make sense
        if (
          (module === 'dashboard' && ['edit', 'delete'].includes(action)) ||
          (module === 'analytics' && ['edit', 'delete'].includes(action))
        ) {
          continue;
        }
        
        const permission = await Permission.create({
          module,
          action,
          resource: '*',
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} access to ${module.replace('_', ' ')}`,
          isActive: true
        });
        permissions.push(permission);
      }
    }
    
    console.log(`✅ Created ${permissions.length} permissions`);

    // Create roles
    console.log('\n👥 Creating roles...');
    const allPermissionIds = permissions.map(p => p._id);
    
    const roles = [
      {
        name: 'super_admin',
        displayName: 'Super Administrator',
        description: 'Full system access with all permissions',
        level: 1,
        permissions: allPermissionIds,
        isActive: true
      },
      {
        name: 'admin',
        displayName: 'Administrator',
        description: 'Administrative access with configurable permissions',
        level: 2,
        permissions: allPermissionIds,
        isActive: true
      },
      {
        name: 'sub_admin',
        displayName: 'Sub Administrator',
        description: 'Limited administrative access with specific module permissions',
        level: 3,
        permissions: allPermissionIds.slice(0, Math.floor(allPermissionIds.length * 0.7)),
        isActive: true
      }
    ];
    
    const createdRoles = await Role.insertMany(roles);
    console.log(`✅ Created ${createdRoles.length} roles`);

    // Create super admin user
    console.log('\n👤 Creating super admin user...');
    const hashedPassword = await bcrypt.hash('superadmin123', 10);
    
    const superAdmin = await Admin.create({
      email: 'superadmin@shoppers9.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '9876543210',
      role: 'super_admin',
      isActive: true
    });
    
    console.log('✅ Super admin created successfully');
    console.log('📧 Email: superadmin@shoppers9.com');
    console.log('🔑 Password: superadmin123');

    // Create UserRole for super admin
    const superAdminRole = createdRoles.find(r => r.name === 'super_admin');
    if (superAdminRole) {
      const allModules = [
        'dashboard', 'users', 'products', 'inventory', 'orders', 
        'shipping', 'coupons', 'support', 'categories', 'filters', 
        'banners', 'testimonials', 'admin_management', 'settings', 'analytics'
      ];
      
      await UserRole.create({
        userId: superAdmin._id,
        roleId: superAdminRole._id,
        moduleAccess: allModules.map(module => ({
          module,
          hasAccess: true
        })),
        isActive: true,
        assignedBy: superAdmin._id
      });
      
      console.log('✅ Created UserRole for super admin with full module access');
    }

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('📊 Summary:');
    console.log(`- Permissions: ${await Permission.countDocuments()}`);
    console.log(`- Roles: ${await Role.countDocuments()}`);
    console.log(`- Admins: ${await Admin.countDocuments()}`);
    console.log(`- UserRoles: ${await UserRole.countDocuments()}`);

  } catch (error) {
    console.error('❌ Error during initialization:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
};

clearAndInitialize();