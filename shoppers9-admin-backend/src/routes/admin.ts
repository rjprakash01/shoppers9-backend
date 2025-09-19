import express from 'express';
import {
  getAllAdmins,
  getAdmin,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus
} from '../controllers/adminController';
import { auth, superAdminOnly } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = express.Router();

// All routes require authentication
router.use(auth);

router.route('/')
  .get(requirePermission('admin_management', 'read'), getAllAdmins)
  .post(requirePermission('admin_management', 'create'), createAdmin);

router.route('/:id')
  .get(requirePermission('admin_management', 'read'), getAdmin)
  .put(requirePermission('admin_management', 'edit'), updateAdmin)
  .delete(requirePermission('admin_management', 'delete'), deleteAdmin);

router.put('/:id/toggle-status', requirePermission('admin_management', 'edit'), toggleAdminStatus);

export default router;