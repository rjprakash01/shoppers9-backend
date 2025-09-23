import { Request, Response, NextFunction } from 'express';
import UserRole from '../models/UserRole';
import Permission from '../models/Permission';
import { AuthRequest } from '../types';

// Simplified permission checking middleware for binary module access
export const requirePermission = (module: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.admin?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Super admin has all permissions
      if (req.admin?.primaryRole === 'super_admin') {
        return next();
      }

      // Check user's module access
      const hasAccess = await checkUserModuleAccess(userId, module);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required: { module }
        });
      }

      // Add permission info to request for further processing
      req.permissions = {
        module
      };

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
};

// Simplified helper function to check user module access
export const checkUserModuleAccess = async (
  userId: string, 
  module: string
): Promise<boolean> => {
  try {
    const userRole = await UserRole.findOne({ userId, isActive: true })
      .populate('roleId');

    if (!userRole || !userRole.isAccessAllowed()) {
      return false;
    }

    // Check user-specific module access first
    const userModuleAccess = userRole.moduleAccess.find((m: any) => m.module === module);
    if (userModuleAccess) {
      return userModuleAccess.hasAccess;
    }

    // Check role-based module access
    const role = userRole.roleId as any;
    if (role && role.permissions && role.permissions.length > 0) {
      const rolePermission = await Permission.findOne({
        _id: { $in: role.permissions },
        module,
        isActive: true
      });

      return !!rolePermission;
    }

    return false;
  } catch (error) {
    console.error('Module access check error:', error);
    return false;
  }
};

// Simplified access check (no time restrictions in binary model)
const isAccessAllowed = (userRole: any): boolean => {
  return userRole.isActive && !userRole.isExpired;
};

// Middleware to filter response data based on partial view restrictions
export const applyPartialViewRestrictions = (req: AuthRequest, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    if (req.permissions?.restrictions?.partialView) {
      const allowedFields = req.permissions.restrictions.partialView;
      
      if (Array.isArray(data)) {
        data = data.map(item => filterFields(item, allowedFields));
      } else if (typeof data === 'object' && data !== null) {
        data = filterFields(data, allowedFields);
      }
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Helper function to filter object fields
const filterFields = (obj: any, allowedFields: string[]): any => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const filtered: any = {};
  
  for (const field of allowedFields) {
    if (field.includes('.')) {
      // Handle nested fields like 'user.email'
      const parts = field.split('.');
      const parent = parts[0];
      const child = parts[1];
      
      if (parent && child && obj[parent] && typeof obj[parent] === 'object') {
        if (!filtered[parent]) filtered[parent] = {};
        if (obj[parent][child] !== undefined) {
          filtered[parent][child] = obj[parent][child];
        }
      }
    } else {
      // Handle direct fields
      if (obj[field] !== undefined) {
        filtered[field] = obj[field];
      }
    }
  }
  
  return filtered;
};

// Simplified convenience functions for module access
export const requireModuleAccess = (module: string) => requirePermission(module);

// Legacy compatibility functions (all map to module access)
export const canRead = (module: string) => requirePermission(module);
export const canEdit = (module: string) => requirePermission(module);
export const canDelete = (module: string) => requirePermission(module);
export const canCreate = (module: string) => requirePermission(module);