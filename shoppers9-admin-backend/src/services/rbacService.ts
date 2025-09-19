import Role from '../models/Role';
import Permission from '../models/Permission';
import UserRole from '../models/UserRole';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import mongoose from 'mongoose';

export class RBACService {
  // Initialize default roles and permissions
  static async initializeRBAC() {
    try {
      console.log('Initializing RBAC system...');
      
      // Create default permissions
      await Permission.createDefaults();
      console.log('Default permissions created');
      
      // Create default roles
      await this.createDefaultRoles();
      console.log('Default roles created');
      
      // Create super admin if doesn't exist
      await this.createSuperAdmin();
      console.log('Super admin ensured');
      
      console.log('RBAC system initialized successfully');
    } catch (error) {
      console.error('Error initializing RBAC system:', error);
      throw error;
    }
  }
  
  // Create default roles
  static async createDefaultRoles() {
    const defaultRoles = [
      {
        name: 'super_admin',
        displayName: 'Super Administrator',
        description: 'Full system access with all permissions',
        level: 1
      },
      {
        name: 'admin',
        displayName: 'Administrator',
        description: 'Administrative access with configurable permissions',
        level: 2
      },
      {
        name: 'sub_admin',
        displayName: 'Sub Administrator',
        description: 'Limited administrative access with specific module permissions',
        level: 3
      },
      {
        name: 'seller',
        displayName: 'Seller',
        description: 'Seller access to manage own products and orders',
        level: 4
      }
    ];
    
    for (const roleData of defaultRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        await Role.create(roleData);
      }
    }
  }
  
  // Create super admin user
  static async createSuperAdmin() {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@shoppers9.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';
    
    let superAdmin = await User.findOne({ 
      email: superAdminEmail,
      primaryRole: 'super_admin' 
    });
    
    if (!superAdmin) {
      // Create super admin user
      superAdmin = await User.create({
        firstName: 'Super',
        lastName: 'Admin',
        email: superAdminEmail,
        phone: '9999999999',
        password: superAdminPassword, // This should be hashed in pre-save middleware
        primaryRole: 'super_admin',
        isActive: true,
        isVerified: true,
        adminInfo: {
          employeeId: 'SA001',
          department: 'System Administration',
          accessLevel: 1
        }
      });
      
      console.log(`Super admin created with email: ${superAdminEmail}`);
    }
    
    // Assign super admin role with all permissions
    await this.assignSuperAdminPermissions(superAdmin._id);
  }
  
  // Assign all permissions to super admin
  static async assignSuperAdminPermissions(userId: mongoose.Types.ObjectId) {
    const superAdminRole = await Role.findOne({ name: 'super_admin' });
    if (!superAdminRole) {
      throw new Error('Super admin role not found');
    }
    
    // Check if user already has super admin role
    const existingUserRole = await UserRole.findOne({
      userId,
      roleId: superAdminRole._id
    });
    
    if (existingUserRole) {
      return; // Already assigned
    }
    
    // Get all permissions
    const allPermissions = await Permission.find({ isActive: true });
    
    const permissions = allPermissions.map(permission => ({
      permissionId: permission._id,
      granted: true
    }));
    
    // Create user role assignment
    await UserRole.create({
      userId,
      roleId: superAdminRole._id,
      permissions,
      isActive: true,
      assignedBy: userId // Self-assigned for super admin
    });
  }
  
  // Assign role to user with specific permissions
  static async assignRole(
    userId: mongoose.Types.ObjectId,
    roleName: string,
    permissionConfig: {
      permissionId: mongoose.Types.ObjectId;
      granted: boolean;
      restrictions?: any;
    }[],
    assignedBy: mongoose.Types.ObjectId,
    options: {
      expiresAt?: Date;
      sellerScope?: mongoose.Types.ObjectId[];
      regionScope?: string[];
    } = {}
  ) {
    try {
      const role = await Role.findOne({ name: roleName, isActive: true });
      if (!role) {
        throw new Error(`Role '${roleName}' not found`);
      }
      
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if assigner can assign this role
      const assigner = await User.findById(assignedBy);
      if (!assigner || !assigner.canManage(user)) {
        throw new Error('Insufficient privileges to assign this role');
      }
      
      // Remove existing role assignment for this role
      await UserRole.findOneAndDelete({
        userId,
        roleId: role._id
      });
      
      // Create new role assignment
      const userRole = await UserRole.create({
        userId,
        roleId: role._id,
        permissions: permissionConfig,
        isActive: true,
        assignedBy,
        expiresAt: options.expiresAt
      });
      
      // Update user's primary role if this is their first role or higher priority
      if (!user.primaryRole || role.level < (await Role.findOne({ name: user.primaryRole }))?.level!) {
        user.primaryRole = roleName as any;
        await user.save();
      }
      
      // Log the role assignment
      await AuditLog.logAction({
        userId: assignedBy,
        action: 'role_assigned',
        module: 'user_management',
        resourceId: userId,
        details: {
          newValues: {
            role: roleName,
            permissions: permissionConfig.length,
            expiresAt: options.expiresAt
          },
          affectedUsers: [userId]
        },
        status: 'success'
      });
      
      return userRole;
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  }
  
  // Revoke role from user
  static async revokeRole(
    userId: mongoose.Types.ObjectId,
    roleName: string,
    revokedBy: mongoose.Types.ObjectId,
    reason?: string
  ) {
    try {
      const role = await Role.findOne({ name: roleName });
      if (!role) {
        throw new Error(`Role '${roleName}' not found`);
      }
      
      const userRole = await UserRole.findOne({
        userId,
        roleId: role._id,
        isActive: true
      });
      
      if (!userRole) {
        throw new Error('User role assignment not found');
      }
      
      // Check if revoker can revoke this role
      const revoker = await User.findById(revokedBy);
      const user = await User.findById(userId);
      
      if (!revoker || !user || !revoker.canManage(user)) {
        throw new Error('Insufficient privileges to revoke this role');
      }
      
      // Deactivate the role assignment
      userRole.isActive = false;
      await userRole.save();
      
      // Update user's primary role if this was their primary role
      if (user.primaryRole === roleName) {
        const remainingRoles = await UserRole.find({
          userId,
          isActive: true
        }).populate('roleId');
        
        if (remainingRoles.length > 0) {
          // Set to the highest priority remaining role
          const highestRole = remainingRoles.reduce((prev, current) => 
            (prev.roleId as any).level < (current.roleId as any).level ? prev : current
          );
          user.primaryRole = (highestRole.roleId as any).name;
        } else {
          user.primaryRole = 'customer'; // Default role
        }
        await user.save();
      }
      
      // Log the role revocation
      await AuditLog.logAction({
        userId: revokedBy,
        action: 'role_revoked',
        module: 'user_management',
        resourceId: userId,
        details: {
          oldValues: { role: roleName },
          affectedUsers: [userId],
          reason
        },
        status: 'success'
      });
      
      return userRole;
    } catch (error) {
      console.error('Error revoking role:', error);
      throw error;
    }
  }
  
  // Get user permissions
  static async getUserPermissions(userId: mongoose.Types.ObjectId) {
    try {
      const userRoles = await UserRole.find({
        userId,
        isActive: true,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      })
      .populate('roleId')
      .populate('permissions.permissionId');
      
      const permissions = new Map<string, any>();
      
      for (const userRole of userRoles) {
        if (!userRole.isAccessAllowed()) {
          continue;
        }
        
        for (const permission of userRole.permissions) {
          if (permission.granted && permission.permissionId) {
            const perm = permission.permissionId as any;
            const key = perm.getKey();
            
            if (!permissions.has(key)) {
              permissions.set(key, {
                permission: perm,
                restrictions: permission.restrictions || {}
              });
            }
          }
        }
      }
      
      return Array.from(permissions.values());
    } catch (error) {
      console.error('Error getting user permissions:', error);
      throw error;
    }
  }
  
  // Check if user has specific permission
  static async hasPermission(
    userId: mongoose.Types.ObjectId,
    module: string,
    action: string,
    resource: string = '*'
  ): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return false;
      }
      
      // Super admin has all permissions
      if (user.primaryRole === 'super_admin') {
        return true;
      }
      
      const permissions = await this.getUserPermissions(userId);
      const requiredPermission = `${module}:${action}:${resource}`;
      const wildcardPermission = `${module}:${action}:*`;
      
      return permissions.some(p => 
        p.permission.getKey() === requiredPermission || 
        p.permission.getKey() === wildcardPermission
      );
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }
  
  // Create permission template
  static async createPermissionTemplate(
    name: string,
    description: string,
    permissions: {
      module: string;
      actions: string[];
      restrictions?: any;
    }[],
    createdBy: mongoose.Types.ObjectId
  ) {
    try {
      // This would be stored in a separate PermissionTemplate model
      // For now, we'll return the configuration
      const template = {
        name,
        description,
        permissions,
        createdBy,
        createdAt: new Date()
      };
      
      await AuditLog.logAction({
        userId: createdBy,
        action: 'create',
        module: 'user_management',
        resource: 'permission_template',
        details: {
          newValues: template
        },
        status: 'success'
      });
      
      return template;
    } catch (error) {
      console.error('Error creating permission template:', error);
      throw error;
    }
  }
  
  // Emergency revoke all permissions for a user
  static async emergencyRevokeAccess(
    userId: mongoose.Types.ObjectId,
    revokedBy: mongoose.Types.ObjectId,
    reason: string
  ) {
    try {
      // Deactivate all user roles
      await UserRole.updateMany(
        { userId, isActive: true },
        { 
          isActive: false,
          $push: {
            'restrictions.emergencyRevoke': {
              revokedBy,
              revokedAt: new Date(),
              reason
            }
          }
        }
      );
      
      // Update user status
      const user = await User.findById(userId);
      if (user) {
        user.isActive = false;
        user.suspendedBy = revokedBy;
        user.suspendedAt = new Date();
        user.suspensionReason = `Emergency access revocation: ${reason}`;
        await user.save();
      }
      
      // Log emergency action
      await AuditLog.logAction({
        userId: revokedBy,
        action: 'emergency_override',
        module: 'user_management',
        resourceId: userId,
        details: {
          affectedUsers: [userId],
          reason,
          action: 'revoke_all_access'
        },
        status: 'success'
      });
      
      return true;
    } catch (error) {
      console.error('Error in emergency revoke:', error);
      throw error;
    }
  }
}

export default RBACService;