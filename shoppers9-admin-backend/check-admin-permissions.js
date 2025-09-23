const mongoose = require('mongoose');
require('dotenv').config();

// Define schemas directly since we can't import TypeScript files
const userSchema = new mongoose.Schema({
  email: String,
  primaryRole: String,
  isActive: Boolean
});

const userRoleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  moduleAccess: [{
    module: String,
    hasAccess: Boolean
  }],
  isActive: Boolean,
  assignedBy: mongoose.Schema.Types.ObjectId,
  assignedAt: Date,
  expiresAt: Date
}, { timestamps: true });

const roleSchema = new mongoose.Schema({
  name: String,
  description: String,
  isActive: Boolean,
  permissions: [mongoose.Schema.Types.ObjectId]
});

const permissionSchema = new mongoose.Schema({
  module: String,
  isActive: Boolean
});

const User = mongoose.model('User', userSchema);
const UserRole = mongoose.model('UserRole', userRoleSchema);
const Role = mongoose.model('Role', roleSchema);
const Permission = mongoose.model('Permission', permissionSchema);

async function checkAdminPermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin');
    console.log('Connected to MongoDB');

    // Find the admin user
    const admin = await User.findOne({ email: 'admin1@shoppers9.com' });
    if (!admin) {
      console.log('Admin user not found');
      return;
    }

    console.log('Admin found:', {
      id: admin._id,
      email: admin.email,
      primaryRole: admin.primaryRole,
      isActive: admin.isActive
    });

    // Check UserRole for this admin
    const userRoles = await UserRole.find({ userId: admin._id, isActive: true })
      .populate('roleId');
    
    console.log('\nUser Roles:', userRoles.length);
    
    for (const userRole of userRoles) {
      console.log('\nUserRole:', {
        roleId: userRole.roleId?._id,
        roleName: userRole.roleId?.name,
        isActive: userRole.isActive,
        isExpired: userRole.isExpired,
        moduleAccess: userRole.moduleAccess
      });

      // Check if categories module access exists
      const categoriesAccess = userRole.moduleAccess.find(m => m.module === 'categories');
      console.log('Categories access:', categoriesAccess);

      // Check role permissions
      if (userRole.roleId && userRole.roleId.permissions) {
        const permissions = await Permission.find({
          _id: { $in: userRole.roleId.permissions },
          module: 'categories',
          isActive: true
        });
        console.log('Role-based categories permissions:', permissions);
      }
    }

    // If no UserRole exists, create one with basic permissions
    if (userRoles.length === 0) {
      console.log('\nNo UserRole found. Creating basic permissions...');
      
      // Find or create a basic admin role
      let adminRole = await Role.findOne({ name: 'admin' });
      if (!adminRole) {
        adminRole = new Role({
          name: 'admin',
          description: 'Basic admin role',
          isActive: true,
          permissions: []
        });
        await adminRole.save();
        console.log('Created admin role');
      }

      // Create UserRole with module access
      const newUserRole = new UserRole({
        userId: admin._id,
        roleId: adminRole._id,
        moduleAccess: [
          { module: 'dashboard', hasAccess: true },
          { module: 'users', hasAccess: true },
          { module: 'products', hasAccess: true },
          { module: 'inventory', hasAccess: true },
          { module: 'orders', hasAccess: true },
          { module: 'categories', hasAccess: true },
          { module: 'filters', hasAccess: true },
          { module: 'banners', hasAccess: true },
          { module: 'testimonials', hasAccess: true },
          { module: 'admin_management', hasAccess: true },
          { module: 'settings', hasAccess: true },
          { module: 'analytics', hasAccess: true },
          { module: 'coupons', hasAccess: true },
          { module: 'shipping', hasAccess: true },
          { module: 'support', hasAccess: true }
        ],
        isActive: true,
        assignedBy: admin._id,
        assignedAt: new Date()
      });

      await newUserRole.save();
      console.log('Created UserRole with full module access');
    } else {
      // Update existing UserRole to ensure categories access
      for (const userRole of userRoles) {
        const categoriesAccess = userRole.moduleAccess.find(m => m.module === 'categories');
        if (!categoriesAccess) {
          userRole.moduleAccess.push({ module: 'categories', hasAccess: true });
          await userRole.save();
          console.log('Added categories access to existing UserRole');
        } else if (!categoriesAccess.hasAccess) {
          categoriesAccess.hasAccess = true;
          await userRole.save();
          console.log('Enabled categories access in existing UserRole');
        }
      }
    }

    console.log('\nPermission check completed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdminPermissions();