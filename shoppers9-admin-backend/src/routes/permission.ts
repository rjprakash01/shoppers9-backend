import express from 'express';
import {
  getAllPermissions,
  getAllRoles,
  updateRolePermissions,
  bulkUpdateRolePermissions,
  getUserPermissions,
  getAllUserPermissions,
  updateUserPermissions,
  bulkUpdateUserPermissions,
  updateUserPermissionRestrictions,
  createPermission,
  initializePermissions,
  initializeRoles,
  checkUserPermission,
  createUserRolesForAdmins
} from '../controllers/permissionController';
import { auth, superAdminOnly } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all permissions
router.get('/permissions', getAllPermissions);

// Get all roles with permissions
router.get('/roles', getAllRoles);

// Get current user permissions
router.get('/user-permissions', getUserPermissions);

// Get all user permissions (for admin management)
router.get('/all-user-permissions', getAllUserPermissions);

// Check specific user permission
router.get('/check-permission', checkUserPermission);

// Super admin only routes
router.use(superAdminOnly);

// Update role permissions (single permission)
router.put('/roles/:roleId/permissions', updateRolePermissions);

// Bulk update role permissions
router.put('/roles/:roleId/permissions/bulk', bulkUpdateRolePermissions);

// Update user permissions (single permission)
router.put('/user-permissions/:userId', updateUserPermissions);

// Bulk update user permissions
router.put('/user-permissions/:userId/bulk', bulkUpdateUserPermissions);

// Update user permission restrictions
router.put('/user-permissions/:userId/restrictions', updateUserPermissionRestrictions);

// Create new permission
router.post('/permissions', createPermission);

// Initialize default permissions
router.post('/permissions/initialize', initializePermissions);

// Initialize default roles
router.post('/roles/initialize', initializeRoles);

// Create UserRole entries for existing admin users
router.post('/user-roles/create-for-admins', createUserRolesForAdmins);

export default router;