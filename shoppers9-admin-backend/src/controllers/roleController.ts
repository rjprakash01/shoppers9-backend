import { Request, Response, NextFunction } from 'express';
import { RBACRequest } from '../middleware/rbac';
import Role from '../models/Role';
import Permission from '../models/Permission';
import UserRole from '../models/UserRole';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import RBACService from '../services/rbacService';
import mongoose from 'mongoose';

// Get all roles
export const getRoles = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    const roles = await Role.find({ isActive: true })
      .populate('permissions')
      .populate('createdBy', 'firstName lastName email')
      .sort({ level: 1 });

    res.json({
      success: true,
      message: 'Roles retrieved successfully',
      data: roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching roles'
    });
  }
};

// Get all permissions
export const getPermissions = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    const permissions = await Permission.find({ isActive: true })
      .sort({ module: 1, action: 1 });

    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc: any, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {});

    res.json({
      success: true,
      message: 'Permissions retrieved successfully',
      data: {
        permissions,
        groupedPermissions,
        modules: Permission.getModules(),
        actions: Permission.getActions()
      }
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permissions'
    });
  }
};

// Get user roles and permissions
export const getUserRoles = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(userId)
      .select('-password')
      .populate('createdBy', 'firstName lastName email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userRoles = await UserRole.find({ 
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true 
    })
    .populate('roleId')
    .populate('permissions.permissionId')
    .populate('assignedBy', 'firstName lastName email');

    const permissions = await RBACService.getUserPermissions(new mongoose.Types.ObjectId(userId));

    res.json({
      success: true,
      message: 'User roles retrieved successfully',
      data: {
        user,
        roles: userRoles,
        permissions,
        effectivePermissions: permissions.map(p => p.permission.getKey())
      }
    });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user roles'
    });
  }
};

// Assign role to user
export const assignRole = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, roleName, permissions, expiresAt, sellerScope, regionScope } = req.body;
    
    if (!userId || !roleName || !permissions) {
      return res.status(400).json({
        success: false,
        message: 'User ID, role name, and permissions are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Validate permissions format
    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions must be an array'
      });
    }

    const userRole = await RBACService.assignRole(
      new mongoose.Types.ObjectId(userId),
      roleName,
      permissions,
      req.user!._id,
      {
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        sellerScope: sellerScope?.map((id: string) => new mongoose.Types.ObjectId(id)),
        regionScope
      }
    );

    res.json({
      success: true,
      message: 'Role assigned successfully',
      data: userRole
    });
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error assigning role'
    });
  }
};

// Revoke role from user
export const revokeRole = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, roleName } = req.params;
    const { reason } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const result = await RBACService.revokeRole(
      new mongoose.Types.ObjectId(userId),
      roleName,
      req.user!._id,
      reason
    );

    res.json({
      success: true,
      message: 'Role revoked successfully',
      data: result
    });
  } catch (error) {
    console.error('Error revoking role:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error revoking role'
    });
  }
};

// Update user permissions
export const updatePermissions = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, roleId } = req.params;
    const { permissions } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID or role ID'
      });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions must be an array'
      });
    }

    const userRole = await UserRole.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      roleId: new mongoose.Types.ObjectId(roleId),
      isActive: true
    });

    if (!userRole) {
      return res.status(404).json({
        success: false,
        message: 'User role assignment not found'
      });
    }

    // Check if current user can manage the target user
    const targetUser = await User.findById(userId);
    if (!targetUser || !req.user!.canManage(targetUser)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges to modify this user\'s permissions'
      });
    }

    const oldPermissions = userRole.permissions;
    userRole.permissions = permissions;
    await userRole.save();

    // Log permission update
    await AuditLog.logAction({
      userId: req.user!._id,
      action: 'permission_granted',
      module: 'user_management',
      resourceId: new mongoose.Types.ObjectId(userId),
      details: {
        oldValues: { permissions: oldPermissions },
        newValues: { permissions },
        affectedUsers: [new mongoose.Types.ObjectId(userId)]
      },
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      data: userRole
    });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating permissions'
    });
  }
};

// Get all users with their roles (for Super Admin)
export const getUsersWithRoles = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      status, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query: any = {};
    
    if (role) {
      query.primaryRole = role;
    }
    
    if (status) {
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      } else if (status === 'suspended') {
        query.suspendedAt = { $exists: true };
      }
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-password -security.sessionTokens -security.twoFactorSecret')
      .populate('createdBy', 'firstName lastName email')
      .populate('suspendedBy', 'firstName lastName email')
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(query);

    // Get roles for each user
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const userRoles = await UserRole.find({
          userId: user._id,
          isActive: true
        })
        .populate('roleId', 'name displayName level')
        .populate('assignedBy', 'firstName lastName email');

        return {
          ...user.toObject(),
          roles: userRoles
        };
      })
    );

    res.json({
      success: true,
      message: 'Users with roles retrieved successfully',
      data: {
        users: usersWithRoles,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users with roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users with roles'
    });
  }
};

// Emergency revoke access
export const emergencyRevokeAccess = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required for emergency access revocation'
      });
    }

    await RBACService.emergencyRevokeAccess(
      new mongoose.Types.ObjectId(userId),
      req.user!._id,
      reason
    );

    res.json({
      success: true,
      message: 'Emergency access revocation completed successfully'
    });
  } catch (error) {
    console.error('Error in emergency revoke:', error);
    res.status(500).json({
      success: false,
      message: 'Error in emergency access revocation'
    });
  }
};

// Get role hierarchy
export const getRoleHierarchy = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    const hierarchy = Role.getHierarchy();
    const roles = await Role.find({ isActive: true }).sort({ level: 1 });
    
    res.json({
      success: true,
      message: 'Role hierarchy retrieved successfully',
      data: {
        hierarchy,
        roles: roles.map(role => ({
          id: role._id,
          name: role.name,
          displayName: role.displayName,
          level: role.level,
          canManageRoles: role.canManageRoles
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching role hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching role hierarchy'
    });
  }
};

// Check user permission
export const checkPermission = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, module, action, resource = '*' } = req.query;
    
    if (!userId || !module || !action) {
      return res.status(400).json({
        success: false,
        message: 'User ID, module, and action are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const hasPermission = await RBACService.hasPermission(
      new mongoose.Types.ObjectId(userId as string),
      module as string,
      action as string,
      resource as string
    );

    res.json({
      success: true,
      message: 'Permission check completed',
      data: {
        hasPermission,
        permission: `${module}:${action}:${resource}`
      }
    });
  } catch (error) {
    console.error('Error checking permission:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking permission'
    });
  }
};

export default {
  getRoles,
  getPermissions,
  getUserRoles,
  assignRole,
  revokeRole,
  updatePermissions,
  getUsersWithRoles,
  emergencyRevokeAccess,
  getRoleHierarchy,
  checkPermission
};