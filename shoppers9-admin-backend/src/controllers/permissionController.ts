import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Permission from '../models/Permission';
import Role, { getRoleModel } from '../models/Role';
import UserRole, { getUserRoleModel } from '../models/UserRole';
import Admin from '../models/Admin';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../types';

// Get all permissions
export const getAllPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await Permission.find({ isActive: true })
      .sort({ module: 1, action: 1 });

    return res.status(200).json({
      success: true,
      data: permissions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all roles with their permissions
export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const RoleModel = getRoleModel();
    const roles = await RoleModel.find({ isActive: true })
      .sort({ level: 1 });

    return res.status(200).json({
      success: true,
      data: roles
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch roles',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update role permissions (single permission)
export const updateRolePermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { roleId } = req.params;
    const { permissionId, granted } = req.body;

    const RoleModel = getRoleModel();
    const role = await RoleModel.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    const oldPermissions = [...role.permissions];
    let changesMade = false;

    if (granted) {
      // Add permission if not already present
      if (!role.permissions.includes(permissionId)) {
        role.permissions.push(permissionId);
        changesMade = true;
      }
    } else {
      // Remove permission
      const initialLength = role.permissions.length;
      role.permissions = role.permissions.filter(
        (id) => id.toString() !== permissionId
      );
      changesMade = role.permissions.length !== initialLength;
    }

    if (changesMade) {
      // Ensure createdBy field is set for non-super_admin roles
      if (role.name !== 'super_admin' && !role.createdBy) {
        role.createdBy = req.admin!._id;
      }
      
      await role.save();

      // Log the permission change
      await AuditLog.logAction({
        userId: req.admin!._id,
        action: granted ? 'permission_granted' : 'permission_revoked',
        module: 'user_management',
        resource: 'role',
        resourceId: role._id,
        details: {
          method: req.method,
          endpoint: req.originalUrl,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          oldValues: { permissions: oldPermissions },
          newValues: { permissions: role.permissions },
          reason: `Updated permission ${permissionId} with granted: ${granted}`
        },
        status: 'success'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Role permissions updated successfully',
      data: role
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update role permissions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Bulk update role permissions
export const bulkUpdateRolePermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { roleId } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions must be an array'
      });
    }

    const RoleModel = getRoleModel();
    const role = await RoleModel.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Validate all permission IDs exist
    const validPermissions = await Permission.find({
      _id: { $in: permissions },
      isActive: true
    });

    if (validPermissions.length !== permissions.length) {
      return res.status(400).json({
        success: false,
        message: 'Some permissions are invalid or inactive'
      });
    }

    const oldPermissions = [...role.permissions];
    role.permissions = permissions;
    
    // Ensure createdBy field is set for non-super_admin roles
    if (role.name !== 'super_admin' && !role.createdBy) {
      role.createdBy = req.admin!._id;
    }
    
    await role.save();

    // Log the bulk permission change
    await AuditLog.logAction({
      userId: req.admin!._id,
      action: 'bulk_permissions_updated',
      module: 'user_management',
      resource: 'role',
      resourceId: role._id,
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        oldValues: { permissions: oldPermissions },
        newValues: { permissions: role.permissions },
        reason: `Bulk updated ${permissions.length} permissions`
      },
      status: 'success'
    });

    // Update all users with this role to reflect the new permissions
    await syncRolePermissionsToUsers(roleId);

    return res.status(200).json({
      success: true,
      message: 'Role permissions updated successfully',
      data: role
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update role permissions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Helper function to sync role permissions to all users with that role
const syncRolePermissionsToUsers = async (roleId: string) => {
  try {
    const RoleModel = getRoleModel();
    const role = await RoleModel.findById(roleId).populate('permissions');
    if (!role) return;

    // Find all UserRole entries for this role
    const UserRoleModel = getUserRoleModel();
    const userRoles = await UserRoleModel.find({ roleId, isActive: true });
    
    // Update each user's role-based permissions
    for (const userRole of userRoles) {
      // Keep existing permissions structure
      const individualPermissions = userRole.permissions || [];
      const rolePermissions = role.permissions.map((perm: any) => ({
        permissionId: perm._id,
        granted: true,
        restrictions: {},
        source: 'role'
      }));
      
      userRole.permissions = [...individualPermissions, ...rolePermissions];
      await userRole.save();
    }
  } catch (error) {
    console.error('Error syncing role permissions to users:', error);
  }
};

// Get user permissions (for current logged-in user)
export const getUserPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.admin?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Super admin has all permissions
    if (req.admin?.role === 'super_admin') {
      const allPermissions = await Permission.find({ isActive: true });
      const formattedPermissions = allPermissions.map(perm => ({
        key: perm.module,
        module: perm.module,
        granted: true
      }));
      
      return res.status(200).json({
        success: true,
        data: formattedPermissions
      });
    }

    // Get user's specific module access
    const UserRoleModel = getUserRoleModel();
    const userRole = await UserRoleModel.findOne({ userId, isActive: true })
      .populate({
        path: 'roleId',
        select: 'name permissions',
        populate: {
          path: 'permissions',
          select: 'module description'
        }
      });

    if (!userRole) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Unified User Assignment System - User assignments take priority over role permissions
    // Get all available modules from Permission model
    const allPermissions = await Permission.find({ isActive: true });
    
    // Create a map of user's individual module access
    const userModuleAccessMap = new Map();
    userRole.moduleAccess.forEach((m: any) => {
      userModuleAccessMap.set(m.module, m.hasAccess);
    });

    // Get role-based permissions as fallback
    const role = userRole.roleId as any;
    const rolePermissionModules = new Set();
    if (role && role.permissions) {
      role.permissions.forEach((perm: any) => {
        rolePermissionModules.add(perm.module);
      });
    }

    // Build unified permissions list prioritizing user assignments
    const formattedPermissions = allPermissions.map(perm => {
      const module = perm.module;
      let granted = false;
      let source = 'none';

      // Check user assignment first (highest priority)
      if (userModuleAccessMap.has(module)) {
        granted = userModuleAccessMap.get(module);
        source = 'user_assignment';
      }
      // Fallback to role permission only if no user assignment exists
      else if (rolePermissionModules.has(module)) {
        granted = true;
        source = 'role_fallback';
      }

      return {
        key: module,
        module: module,
        granted: granted,
        source: source
      };
    }).filter(p => p.granted); // Only return granted permissions

    return res.status(200).json({
      success: true,
      data: formattedPermissions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user permissions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all user permissions (for admin management)
export const getAllUserPermissions = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Starting getAllUserPermissions...');
    
    // Ensure all models are registered in admin connection
    const RoleModel = getRoleModel();
    const UserRoleModel = getUserRoleModel();
    const userRoles = await UserRoleModel.find({ isActive: true })
      .populate({
        path: 'userId',
        model: 'Admin', // Use Admin model since admins are created in Admin collection
        select: 'firstName lastName email role'
      })
      .populate({
        path: 'roleId',
        select: 'name displayName'
      });

    console.log(`📊 Found ${userRoles.length} user roles`);

    const formattedData = userRoles
      .filter(userRole => {
        // Filter out UserRoles with missing user or role references
        const user = userRole.userId as any;
        const role = userRole.roleId as any;
        
        // Only filter out super admin users - admin role users should be included for module access assignment
        if (user && user.role === 'super_admin') {
          return false;
        }
        
        return user && role && user._id && role._id;
      })
      .map(userRole => {
        const user = userRole.userId as any;
        const role = userRole.roleId as any;
        
        // Convert moduleAccess to the format expected by frontend
        const moduleAccess = userRole.moduleAccess?.map((access: any) => ({
          module: access.module,
          hasAccess: access.hasAccess
        })) || [];
        
        return {
          userId: user._id,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          userEmail: user.email || '',
          roleId: role._id,
          roleName: role.displayName || role.name || '',
          moduleAccess: moduleAccess
        };
      });

    console.log(`✅ Formatted ${formattedData.length} user permissions`);

    return res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('❌ Error in getAllUserPermissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user permissions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update user module access (single module)
export const updateUserPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { module, hasAccess } = req.body;

    // Find or create UserRole entry
    const UserRoleModel = getUserRoleModel();
    let userRole = await UserRoleModel.findOne({ userId, isActive: true });
    if (!userRole) {
      // Get user to determine their role
      const user = await Admin.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      // Find the role for this user
      const RoleModel = getRoleModel();
      const role = await RoleModel.findOne({ name: user.role });
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found for user'
        });
      }

      // Create new UserRole entry
      userRole = await UserRoleModel.create({
        userId,
        roleId: role._id,
        moduleAccess: [],
        isActive: true,
        assignedBy: req.admin?._id
      });
    }

    // Validate module exists in permissions
    const modulePermission = await Permission.findOne({ module, isActive: true });
    if (!modulePermission) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Find existing module access
    const existingModuleIndex = userRole.moduleAccess.findIndex(
      (m: any) => m.module === module
    );

    if (existingModuleIndex >= 0) {
      // Update existing module access
      userRole.moduleAccess[existingModuleIndex].hasAccess = hasAccess;
    } else {
      // Add new module access
      userRole.moduleAccess.push({
        module,
        hasAccess
      });
    }

    await userRole.save();

    return res.status(200).json({
      success: true,
      message: 'User module access updated successfully',
      data: userRole
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update user module access',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Bulk update user permissions
export const bulkUpdateUserPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions must be an array'
      });
    }

    // Find or create UserRole entry
    const UserRoleModel = getUserRoleModel();
    let userRole = await UserRoleModel.findOne({ userId, isActive: true });
    if (!userRole) {
      // Get user to determine their role
      const user = await Admin.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      // Find the role for this user
      const RoleModel = getRoleModel();
      const role = await RoleModel.findOne({ name: user.role });
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found for user'
        });
      }

      // Create new UserRole entry
      userRole = await UserRoleModel.create({
        userId,
        roleId: role._id,
        permissions: [],
        isActive: true,
        assignedBy: req.admin?._id
      });
    }

    // Validate all permission IDs exist
    const permissionIds = permissions.map(p => p.permissionId);
    const validPermissions = await Permission.find({
      _id: { $in: permissionIds },
      isActive: true
    });

    if (validPermissions.length !== permissionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some permissions are invalid or inactive'
      });
    }

    // Keep existing permissions structure
    const rolePermissions = userRole.permissions || [];
    const individualPermissions = permissions.map(p => ({
      permissionId: p.permissionId,
      granted: p.granted,
      restrictions: p.restrictions || {},
      source: 'individual'
    }));

    userRole.permissions = [...rolePermissions, ...individualPermissions];
    await userRole.save();

    // Log the bulk permission change
    await AuditLog.logAction({
      userId: req.admin!._id,
      action: 'bulk_user_permissions_updated',
      module: 'user_management',
      resource: 'user',
      resourceId: new mongoose.Types.ObjectId(userId),
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        reason: `Updated permissions for user ${userId}`,
        affectedUsers: [new mongoose.Types.ObjectId(userId)]
      },
      status: 'success'
    });

    return res.status(200).json({
      success: true,
      message: 'User permissions updated successfully',
      data: userRole
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update user permissions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update user permission restrictions
export const updateUserPermissionRestrictions = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { permissionId, restrictions } = req.body;

    const UserRoleModel = getUserRoleModel();
    const userRole = await UserRoleModel.findOne({ userId, isActive: true });
    if (!userRole) {
      return res.status(404).json({
        success: false,
        message: 'User role not found'
      });
    }

    // Find the permission in user's permissions array
    const permissionIndex = userRole.permissions.findIndex(
      (p) => p.permissionId.toString() === permissionId
    );

    if (permissionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found for this user'
      });
    }

    // Update restrictions
    if (userRole.permissions[permissionIndex]) {
      userRole.permissions[permissionIndex].restrictions = restrictions;
    }
    await userRole.save();

    return res.status(200).json({
      success: true,
      message: 'Permission restrictions updated successfully',
      data: userRole
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update permission restrictions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create new permission
export const createPermission = async (req: AuthRequest, res: Response) => {
  try {
    const { module, action, resource, description } = req.body;

    // Check if permission already exists
    const existingPermission = await Permission.findOne({ module, action, resource });
    if (existingPermission) {
      return res.status(400).json({
        success: false,
        message: 'Permission already exists'
      });
    }

    const permission = await Permission.create({
      module,
      action,
      resource: resource || '*',
      description,
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: 'Permission created successfully',
      data: permission
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create permission',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Initialize default permissions
export const initializePermissions = async (req: AuthRequest, res: Response) => {
  try {
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

        const existingPermission = await Permission.findOne({ module, action, resource: '*' });
        if (!existingPermission) {
          permissions.push({
            module,
            action,
            resource: '*',
            description: `${action.charAt(0).toUpperCase() + action.slice(1)} access to ${module.replace('_', ' ')}`,
            isActive: true
          });
        }
      }
    }

    if (permissions.length > 0) {
      await Permission.insertMany(permissions);
    }

    return res.status(200).json({
      success: true,
      message: `Initialized ${permissions.length} permissions`,
      data: { created: permissions.length }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize permissions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Initialize default roles
export const initializeRoles = async (req: AuthRequest, res: Response) => {
  try {
    const createdBy = req.admin?.id; // Get the current admin's ID
    
    const defaultRoles = [
      {
        name: 'super_admin',
        displayName: 'Super Admin',
        description: 'Full system access with all permissions',
        level: 1,
        isActive: true,
        permissions: [] // Super admin gets all permissions by default in middleware
      },
      {
        name: 'admin',
        displayName: 'Admin',
        description: 'Administrative access with configurable permissions',
        level: 2,
        isActive: true,
        permissions: [],
        createdBy
      },
      {
        name: 'sub_admin',
        displayName: 'Sub Admin',
        description: 'Limited administrative access with restricted permissions',
        level: 3,
        isActive: true,
        permissions: [],
        createdBy
      }
    ];

    const { getRoleModel } = await import('../models/Role');
    const RoleModel = getRoleModel();
    const createdRoles = [];

    for (const roleData of defaultRoles) {
      const existingRole = await RoleModel.findOne({ name: roleData.name });
      if (!existingRole) {
        const role = await RoleModel.create(roleData);
        createdRoles.push(role);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Initialized ${createdRoles.length} roles`,
      data: { created: createdRoles.length, roles: createdRoles }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize roles',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Check user permission
export const checkUserPermission = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, module, action, resource = '*' } = req.query;

    if (!userId || !module || !action) {
      return res.status(400).json({
        success: false,
        message: 'userId, module, and action are required'
      });
    }

    const userRole = await UserRole.findOne({ userId, isActive: true })
      .populate('roleId')
      .populate('permissions.permissionId');

    if (!userRole) {
      return res.status(200).json({
        success: true,
        hasPermission: false,
        message: 'User has no active role'
      });
    }

    // Check if permission exists in user's specific permissions
    const userPermission = userRole.permissions.find((p: any) => {
      const perm = p.permissionId;
      return perm.module === module && perm.action === action && 
             (perm.resource === resource || perm.resource === '*');
    });

    if (userPermission) {
      return res.status(200).json({
        success: true,
        hasPermission: userPermission.granted,
        restrictions: userPermission.restrictions,
        source: 'user_specific'
      });
    }

    // Check role-based permissions
    const role = userRole.roleId as any;
    const rolePermissions = await Permission.find({
      _id: { $in: role.permissions },
      module,
      action,
      $or: [{ resource }, { resource: '*' }],
      isActive: true
    });

    const hasRolePermission = rolePermissions.length > 0;

    return res.status(200).json({
      success: true,
      hasPermission: hasRolePermission,
      source: 'role_based'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to check user permission',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create UserRole entries for existing admin users
export const createUserRolesForAdmins = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔄 Creating UserRole entries for existing admin users...');

    // Find all admin and sub_admin users
    const adminUsers = await Admin.find({
      role: { $in: ['admin', 'sub_admin'] },
      isActive: true
    });

    console.log(`Found ${adminUsers.length} admin users`);

    let createdCount = 0;
    let existingCount = 0;

    for (const user of adminUsers) {
      // Check if UserRole already exists
      const UserRoleModel = getUserRoleModel();
      const existingUserRole = await UserRoleModel.findOne({ 
        userId: user._id, 
        isActive: true 
      });

      if (existingUserRole) {
        console.log(`✅ UserRole already exists for ${user.email}`);
        existingCount++;
        continue;
      }

      // Find the role for this user
      const RoleModel = getRoleModel();
      const role = await RoleModel.findOne({ name: user.role });
      if (!role) {
        console.log(`❌ Role '${user.role}' not found for user ${user.email}`);
        continue;
      }

      // Create UserRole entry
      await UserRoleModel.create({
        userId: user._id,
        roleId: role._id,
        moduleAccess: [],
        isActive: true,
        assignedBy: req.admin?._id || user._id
      });

      console.log(`✅ Created UserRole entry for ${user.email} (${user.role})`);
      createdCount++;
    }

    console.log('\n📊 UserRole Creation Summary:');
    console.log(`- Created: ${createdCount} new UserRole entries`);
    console.log(`- Existing: ${existingCount} UserRole entries`);
    console.log(`- Total Admin Users: ${adminUsers.length}`);
    
    return res.status(200).json({
      success: true,
      message: 'UserRole entries created successfully',
      data: {
        created: createdCount,
        existing: existingCount,
        total: adminUsers.length
      }
    });
  } catch (error) {
    console.error('❌ Error creating UserRole entries:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create UserRole entries',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};