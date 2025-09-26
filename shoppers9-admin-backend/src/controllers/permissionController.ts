import { Request, Response } from 'express';
import Permission from '../models/Permission';
import Role from '../models/Role';
import UserRole from '../models/UserRole';
import User from '../models/User';
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
    const roles = await Role.find({ isActive: true })
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

    const role = await Role.findById(roleId);
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
          url: req.originalUrl,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          oldValues: { permissions: oldPermissions },
          newValues: { permissions: role.permissions },
          permissionId,
          granted
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

    const role = await Role.findById(roleId);
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
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        oldValues: { permissions: oldPermissions },
        newValues: { permissions: role.permissions },
        permissionsCount: permissions.length
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
    const role = await Role.findById(roleId).populate('permissions');
    if (!role) return;

    // Find all UserRole entries for this role
    const userRoles = await UserRole.find({ roleId, isActive: true });
    
    // Update each user's role-based permissions
    for (const userRole of userRoles) {
      // Keep individual permissions, update role-based permissions
      const individualPermissions = userRole.permissions.filter(p => p.source === 'individual');
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
    if (req.admin?.primaryRole === 'super_admin') {
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
    const userRole = await UserRole.findOne({ userId, isActive: true })
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
    
    const userRoles = await UserRole.find({ isActive: true })
      .populate({
        path: 'userId',
        select: 'firstName lastName email primaryRole'
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
        
        // Filter out super admin users - they don't need individual module permissions
        if (user && user.primaryRole === 'super_admin') {
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
    let userRole = await UserRole.findOne({ userId, isActive: true });
    if (!userRole) {
      // Get user to determine their role
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Find the role for this user
      const role = await Role.findOne({ name: user.primaryRole });
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found for user'
        });
      }

      // Create new UserRole entry
      userRole = await UserRole.create({
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
    let userRole = await UserRole.findOne({ userId, isActive: true });
    if (!userRole) {
      // Get user to determine their role
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Find the role for this user
      const role = await Role.findOne({ name: user.primaryRole });
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found for user'
        });
      }

      // Create new UserRole entry
      userRole = await UserRole.create({
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

    // Keep role-based permissions, update individual permissions
    const rolePermissions = userRole.permissions.filter(p => p.source === 'role');
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
      resourceId: userId,
      details: {
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        permissionsCount: permissions.length,
        targetUserId: userId
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

    const userRole = await UserRole.findOne({ userId, isActive: true });
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

    const Role = (await import('../models/Role')).default;
    const createdRoles = [];

    for (const roleData of defaultRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        const role = await Role.create(roleData);
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