import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import UserRole from '../models/UserRole';
import Permission from '../models/Permission';
import AuditLog from '../models/AuditLog';
import { AuthenticatedRequest } from '../types';

// Extend Request interface to include user and permissions
export interface RBACRequest extends AuthenticatedRequest {
  userPermissions?: string[];
  userRoles?: any[];
}

// Authentication middleware - verifies JWT token
export const authenticate = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      await AuditLog.logAction({
        userId: undefined as any,
        action: 'login_failed',
        module: 'authentication',
        details: {
          method: req.method,
          endpoint: req.path,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          reason: 'No token provided'
        },
        status: 'unauthorized'
      });
      
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findById(decoded.id)
      .populate('roles')
      .select('-password');

    if (!user) {
      await AuditLog.logAction({
        userId: decoded.id,
        action: 'login_failed',
        module: 'authentication',
        details: {
          method: req.method,
          endpoint: req.path,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          reason: 'User not found'
        },
        status: 'unauthorized'
      });
      
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token.' 
      });
    }

    if (!user.isActive) {
      await AuditLog.logAction({
        userId: user._id,
        action: 'login_failed',
        module: 'authentication',
        details: {
          method: req.method,
          endpoint: req.path,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          reason: 'Account deactivated'
        },
        status: 'unauthorized'
      });
      
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated.' 
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      await AuditLog.logAction({
        userId: user._id,
        action: 'login_failed',
        module: 'authentication',
        details: {
          method: req.method,
          endpoint: req.path,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          reason: 'Account locked'
        },
        status: 'unauthorized'
      });
      
      return res.status(401).json({ 
        success: false, 
        message: 'Account is temporarily locked due to multiple failed login attempts.' 
      });
    }

    // JWT token is valid, no need for session token verification

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    await AuditLog.logAction({
      userId: undefined as any,
      action: 'login_failed',
      module: 'authentication',
      details: {
        method: req.method,
        endpoint: req.path,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        reason: 'Token verification failed'
      },
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// Load user permissions middleware
export const loadPermissions = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated.' 
      });
    }

    // Get user roles and permissions
    const userRoles = await UserRole.getUserPermissions(req.user._id);
    
    const permissions: string[] = [];
    const roles: any[] = [];

    for (const userRole of userRoles) {
      if (!userRole.isAccessAllowed()) {
        continue; // Skip if time restrictions don't allow access
      }

      roles.push(userRole);
      
      for (const permission of userRole.permissions) {
        if (permission.granted && permission.permissionId) {
          const perm = permission.permissionId as any;
          if (perm.isActive) {
            permissions.push(perm.getKey());
          }
        }
      }
    }

    req.userPermissions = permissions;
    req.userRoles = roles;
    
    next();
  } catch (error) {
    console.error('Permission loading error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error loading user permissions.' 
    });
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      // Check for admin user (from auth middleware)
      const user = req.admin || req.user;
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not authenticated.' 
        });
      }

      const hasRole = allowedRoles.includes(user.primaryRole);
      
      if (!hasRole) {
        await AuditLog.logAction({
          userId: user._id,
          action: 'read',
          module: 'authentication',
          details: {
            method: req.method,
            endpoint: req.path,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            reason: `Insufficient role. Required: ${allowedRoles.join(', ')}, Has: ${user.primaryRole}`
          },
          status: 'unauthorized'
        });
        
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions.' 
        });
      }

      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error checking user role.' 
      });
    }
  };
};

// Permission-based authorization middleware
export const requirePermission = (module: string, action: string, resource: string = '*') => {
  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not authenticated.' 
        });
      }

      // Super admin has all permissions
      if (req.user.primaryRole === 'super_admin') {
        return next();
      }

      const requiredPermission = `${module}:${action}:${resource}`;
      const hasPermission = req.userPermissions?.includes(requiredPermission) || 
                           req.userPermissions?.includes(`${module}:${action}:*`);
      
      if (!hasPermission) {
        await AuditLog.logAction({
          userId: req.user._id,
          action,
          module,
          resource,
          details: {
            method: req.method,
            endpoint: req.path,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            reason: `Missing permission: ${requiredPermission}`
          },
          status: 'unauthorized'
        });
        
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions for this action.' 
        });
      }

      // Log successful access
      await AuditLog.logAction({
        userId: req.user._id,
        action,
        module,
        resource,
        details: {
          method: req.method,
          endpoint: req.path,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        status: 'success'
      });

      next();
    } catch (error) {
      console.error('Permission authorization error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error checking user permissions.' 
      });
    }
  };
};

// Middleware to check if user can manage another user
export const canManageUser = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated.' 
      });
    }

    const targetUserId = req.params.userId || req.body.userId;
    if (!targetUserId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Target user ID is required.' 
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Target user not found.' 
      });
    }

    if (!req.user.canManage(targetUser)) {
      await AuditLog.logAction({
        userId: req.user._id,
        action: 'read',
        module: 'user_management',
        resourceId: targetUser._id,
        details: {
          method: req.method,
          endpoint: req.path,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          reason: `Cannot manage user with role: ${targetUser.primaryRole}`
        },
        status: 'unauthorized'
      });
      
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot manage user with equal or higher privileges.' 
      });
    }

    req.targetUser = targetUser;
    next();
  } catch (error) {
    console.error('User management authorization error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error checking user management permissions.' 
    });
  }
};

// Middleware for seller-specific access (sellers can only access their own data)
export const sellerSelfAccess = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated.' 
      });
    }

    // Non-sellers and admins can access any data
    if (req.user.primaryRole !== 'seller' || req.user.isAdmin()) {
      return next();
    }

    // For sellers, check if they're accessing their own data
    const sellerId = req.params.sellerId || req.body.sellerId || req.query.sellerId;
    
    if (sellerId && sellerId !== req.user._id.toString()) {
      await AuditLog.logAction({
        userId: req.user._id,
        action: 'read',
        module: 'seller_management',
        details: {
          method: req.method,
          endpoint: req.path,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          reason: `Seller attempted to access another seller's data: ${sellerId}`
        },
        status: 'unauthorized'
      });
      
      return res.status(403).json({ 
        success: false, 
        message: 'Sellers can only access their own data.' 
      });
    }

    next();
  } catch (error) {
    console.error('Seller access control error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error checking seller access permissions.' 
    });
  }
};

// Emergency override middleware (for super admin only)
export const emergencyOverride = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated.' 
      });
    }

    if (req.user.primaryRole !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Emergency override is only available to Super Admins.' 
      });
    }

    // Log emergency override usage
    await AuditLog.logAction({
      userId: req.user._id,
      action: 'emergency_override',
      module: 'system',
      details: {
        method: req.method,
        endpoint: req.path,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        reason: req.body.reason || 'No reason provided'
      },
      status: 'success'
    });

    next();
  } catch (error) {
    console.error('Emergency override error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing emergency override.' 
    });
  }
};

export default {
  authenticate,
  loadPermissions,
  requireRole,
  requirePermission,
  canManageUser,
  sellerSelfAccess,
  emergencyOverride
};