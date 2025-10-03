const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect('mongodb://admin:admin123@localhost:27017/shoppers9_admin?authSource=admin')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define schemas
const permissionSchema = new mongoose.Schema({
  module: { type: String, required: true },
  action: { type: String, required: true },
  resource: { type: String, default: '*' },
  description: String,
  isActive: { type: Boolean, default: true }
});

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayName: String,
  description: String,
  level: Number,
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
  isActive: { type: Boolean, default: true }
});

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  phone: String,
  role: { type: String, default: 'admin' },
  isActive: { type: Boolean, default: true }
});

const Permission = mongoose.model('Permission', permissionSchema);
const Role = mongoose.model('Role', roleSchema);
const Admin = mongoose.model('Admin', adminSchema);

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Create default permissions
    const modules = [
      'dashboard', 'users', 'products', 'inventory', 'orders', 'shipping',
      'coupons', 'support', 'categories', 'filters', 'banners', 'testimonials',
      'admin_management', 'settings', 'analytics'
    ];
    
    const actions = ['read', 'edit', 'delete', 'create_assets'];
    
    console.log('📝 Creating permissions...');
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
        
        const existingPermission = await Permission.findOne({ module, action, resource: '*' });
        if (!existingPermission) {
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
    }
    
    console.log(`✅ Created ${permissions.length} permissions`);
    
    // Create default roles
    console.log('👥 Creating roles...');
    const defaultRoles = [
      {
        name: 'super_admin',
        displayName: 'Super Administrator',
        description: 'Full system access with all permissions',
        level: 1
      },
      {
        name: 'admin',
        displayName: 'Admin',
        description: 'Administrative access with configurable permissions',
        level: 2
      },
      {
        name: 'sub_admin',
        displayName: 'Sub Administrator',
        description: 'Limited administrative access with specific module permissions',
        level: 3
      }
    ];
    
    const createdRoles = [];
    for (const roleData of defaultRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        const role = await Role.create(roleData);
        createdRoles.push(role);
      }
    }
    
    console.log(`✅ Created ${createdRoles.length} roles`);
    
    // Create super admin user
    console.log('👤 Creating super admin...');
    const existingSuperAdmin = await Admin.findOne({ email: 'superadmin@shoppers9.com' });
    
    if (!existingSuperAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('superadmin123', salt);
      
      await Admin.create({
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
    } else {
      console.log('✅ Super admin already exists');
    }
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('📊 Summary:');
    console.log(`- Permissions: ${await Permission.countDocuments()}`);
    console.log(`- Roles: ${await Role.countDocuments()}`);
    console.log(`- Admins: ${await Admin.countDocuments()}`);
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    mongoose.connection.close();
  }
}

initializeDatabase();