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

const router = express.Router();

// All routes are protected and require authentication only
router.use(auth);

router.route('/')
  .get(getAllAdmins)
  .post(createAdmin);

router.route('/:id')
  .get(getAdmin)
  .put(updateAdmin)
  .delete(deleteAdmin);

router.put('/:id/toggle-status', toggleAdminStatus);

export default router;