import express from 'express';
import {
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
} from '../controllers/roleController';
import { authenticate, emergencyOverride } from '../middleware/rbac';
import { requirePermission } from '../middleware/permission';
import { superAdminOnly, managerOrAbove } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const assignRoleSchema = Joi.object({
  userId: Joi.string().required(),
  roleName: Joi.string().valid('admin', 'sub_admin', 'seller').required(),
  permissions: Joi.array().items(
    Joi.object({
      permissionId: Joi.string().required(),
      granted: Joi.boolean().default(true),
      restrictions: Joi.object({
        partialView: Joi.array().items(Joi.string()),
        sellerScope: Joi.array().items(Joi.string()),
        regionScope: Joi.array().items(Joi.string()),
        timeRestriction: Joi.object({
          startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          days: Joi.array().items(Joi.number().min(0).max(6))
        })
      })
    })
  ).required(),
  expiresAt: Joi.date().optional(),
  sellerScope: Joi.array().items(Joi.string()).optional(),
  regionScope: Joi.array().items(Joi.string()).optional()
});

const updatePermissionsSchema = Joi.object({
  permissions: Joi.array().items(
    Joi.object({
      permissionId: Joi.string().required(),
      granted: Joi.boolean().default(true),
      restrictions: Joi.object({
        partialView: Joi.array().items(Joi.string()),
        sellerScope: Joi.array().items(Joi.string()),
        regionScope: Joi.array().items(Joi.string()),
        timeRestriction: Joi.object({
          startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          days: Joi.array().items(Joi.number().min(0).max(6))
        })
      })
    })
  ).required()
});

const revokeRoleSchema = Joi.object({
  reason: Joi.string().optional()
});

const emergencyRevokeSchema = Joi.object({
  reason: Joi.string().required().min(10).max(500)
});

// Apply authentication and permission loading to all routes
router.use(authenticate);

// Get all roles (Admin+ can view)
router.get(
  '/',
  managerOrAbove,
  requirePermission('user_management', 'read'),
  getRoles
);

// Get all permissions (Admin+ can view)
router.get(
  '/permissions',
  managerOrAbove,
  requirePermission('user_management', 'read'),
  getPermissions
);

// Get role hierarchy (Admin+ can view)
router.get(
  '/hierarchy',
  managerOrAbove,
  requirePermission('user_management', 'read'),
  getRoleHierarchy
);

// Get all users with their roles (Super Admin only)
router.get(
  '/users',
  superAdminOnly,
  requirePermission('user_management', 'read'),
  getUsersWithRoles
);

// Get specific user's roles and permissions
router.get(
  '/users/:userId',
  managerOrAbove,
  requirePermission('user_management', 'read'),
  getUserRoles
);

// Assign role to user (Super Admin and Admin can assign lower roles)
router.post(
  '/assign',
  managerOrAbove,
  requirePermission('user_management', 'create'),
  validateRequest(assignRoleSchema),
  assignRole
);

// Update user permissions for a specific role
router.put(
  '/users/:userId/roles/:roleId/permissions',
  managerOrAbove,
  requirePermission('user_management', 'edit'),
  validateRequest(updatePermissionsSchema),
  updatePermissions
);

// Revoke role from user
router.delete(
  '/users/:userId/roles/:roleName',
  managerOrAbove,
  requirePermission('user_management', 'delete'),
  validateRequest(revokeRoleSchema),
  revokeRole
);

// Emergency revoke all access (Super Admin only)
router.post(
  '/emergency-revoke/:userId',
  superAdminOnly,
  emergencyOverride,
  validateRequest(emergencyRevokeSchema),
  emergencyRevokeAccess
);

// Check if user has specific permission
router.get(
  '/check-permission',
  managerOrAbove,
  requirePermission('user_management', 'read'),
  checkPermission
);

// Get current user's roles
router.get(
  '/my-roles',
  async (req: any, res, next) => {
    req.params.userId = req.admin._id.toString();
    next();
  },
  getUserRoles
);

// Get current user's permissions
router.get(
  '/my-permissions',
  async (req: any, res, next) => {
    req.params.userId = req.admin._id.toString();
    next();
  },
  getUserRoles
);

export default router;