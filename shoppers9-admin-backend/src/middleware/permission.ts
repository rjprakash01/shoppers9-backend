import { Request, Response, NextFunction } from 'express';
import UserRole from '../models/UserRole';
import Permission from '../models/Permission';
import { AuthRequest } from '../types';

// Permission checking middleware
export const requirePermission = (module: string, action: string, resource: string = '*', getResourceOwnerId?: (req: AuthRequest) => string | undefined) => {
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

      // Get resource owner ID if function provided
      const resourceOwnerId = getResourceOwnerId ? getResourceOwnerId(req) : undefined;

      // Check user's specific permissions and role-based permissions
      const hasPermission = await checkUserPermission(userId, module, action, resource, resourceOwnerId);
      
      if (!hasPermission.allowed) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required: { module, action, resource, scope: hasPermission.scope },
          restrictions: hasPermission.restrictions
        });
      }

      // Add permission info to request for further processing
      req.permissions = {
        module,
        action,
        resource,
        scope: hasPermission.scope as 'own' | 'all',
        restrictions: hasPermission.restrictions
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

// Helper function to check user permission
export const checkUserPermission = async (
  userId: string, 
  module: string, 
  action: string, 
  resource: string = '*',
  resourceOwnerId?: string
): Promise<{ allowed: boolean; restrictions?: any; source?: string; scope?: string }> => {
  try {
    const userRole = await UserRole.findOne({ userId, isActive: true })
      .populate('roleId')
      .populate('permissions.permissionId');

    if (!userRole) {
      return { allowed: false };
    }

    // Check time restrictions first
    if (!isAccessTimeAllowed(userRole)) {
      return { allowed: false, restrictions: { timeRestricted: true } };
    }

    // Check if permission exists in user's specific permissions
    const userPermission = userRole.permissions.find((p: any) => {
      const perm = p.permissionId;
      return perm.module === module && perm.action === action && 
             (perm.resource === resource || perm.resource === '*');
    });

    if (userPermission) {
      const perm = userPermission.permissionId as any;
      // Check scope-based access (only if perm is populated)
      if (perm && typeof perm === 'object' && perm.scope === 'own' && resourceOwnerId && resourceOwnerId !== userId) {
        return {
          allowed: false,
          restrictions: { scopeRestricted: true, requiredScope: 'own' },
          source: 'user_specific',
          scope: perm.scope
        };
      }
      
      // If user permission is explicitly denied, respect that
      if (!userPermission.granted) {
        return {
          allowed: false,
          restrictions: userPermission.restrictions,
          source: 'user_specific',
          scope: perm && typeof perm === 'object' ? perm.scope : undefined
        };
      }
      
      return {
        allowed: userPermission.granted,
        restrictions: userPermission.restrictions,
        source: 'user_specific',
        scope: perm && typeof perm === 'object' ? perm.scope : undefined
      };
    }

    // Check role-based permissions - prioritize 'all' scope over 'own'
    const role = userRole.roleId as any;
    if (role && role.permissions && role.permissions.length > 0) {
      const rolePermissions = await Permission.find({
        _id: { $in: role.permissions },
        module,
        action,
        $or: [{ resource }, { resource: '*' }],
        isActive: true
      }).sort({ scope: 1 }); // 'all' comes before 'own' alphabetically

      if (rolePermissions.length > 0) {
        // Find the best matching permission (prefer 'all' scope)
        const allScopePermission = rolePermissions.find(p => p.scope === 'all');
        const ownScopePermission = rolePermissions.find(p => p.scope === 'own');
        
        const selectedPermission = allScopePermission || ownScopePermission;
        
        if (selectedPermission) {
          // Check scope-based access for 'own' scope
          if (selectedPermission.scope === 'own' && resourceOwnerId && resourceOwnerId !== userId) {
            return {
              allowed: false,
              restrictions: { scopeRestricted: true, requiredScope: 'own' },
              source: 'role_based',
              scope: selectedPermission.scope
            };
          }

          return {
            allowed: true,
            source: 'role_based',
            scope: selectedPermission.scope
          };
        }
      }
    }

    return { allowed: false };
  } catch (error) {
    console.error('Permission check error:', error);
    return { allowed: false };
  }
};

// Check if current time is within allowed access time
const isAccessTimeAllowed = (userRole: any): boolean => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Check if any permission has time restrictions that block access
  for (const permission of userRole.permissions) {
    const timeRestriction = permission.restrictions?.timeRestriction;
    
    if (timeRestriction) {
      // Check day restriction
      if (timeRestriction.days && timeRestriction.days.length > 0) {
        if (!timeRestriction.days.includes(currentDay)) {
          return false;
        }
      }

      // Check time range restriction
      if (timeRestriction.startTime && timeRestriction.endTime) {
        const [startHour, startMin] = timeRestriction.startTime.split(':').map(Number);
        const [endHour, endMin] = timeRestriction.endTime.split(':').map(Number);
        
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        
        if (currentTime < startTime || currentTime > endTime) {
          return false;
        }
      }
    }
  }

  return true;
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

// Convenience functions for common permissions
export const canRead = (module: string, resource?: string, getResourceOwnerId?: (req: AuthRequest) => string | undefined) => 
  requirePermission(module, 'read', resource, getResourceOwnerId);

export const canCreate = (module: string, resource?: string) => 
  requirePermission(module, 'create', resource);

export const canEdit = (module: string, resource?: string, getResourceOwnerId?: (req: AuthRequest) => string | undefined) => 
  requirePermission(module, 'edit', resource, getResourceOwnerId);

export const canDelete = (module: string, resource?: string, getResourceOwnerId?: (req: AuthRequest) => string | undefined) => 
  requirePermission(module, 'delete', resource, getResourceOwnerId);

export const canExport = (module: string, resource?: string) => 
  requirePermission(module, 'export', resource);

export const canImport = (module: string, resource?: string) => 
  requirePermission(module, 'import', resource);

export const canApprove = (module: string, resource?: string, getResourceOwnerId?: (req: AuthRequest) => string | undefined) => 
  requirePermission(module, 'approve', resource, getResourceOwnerId);

export const canReject = (module: string, resource?: string, getResourceOwnerId?: (req: AuthRequest) => string | undefined) => 
  requirePermission(module, 'reject', resource, getResourceOwnerId);

// Legacy support - deprecated, use canCreate instead
export const canWrite = (module: string, resource?: string) => 
  requirePermission(module, 'create', resource);