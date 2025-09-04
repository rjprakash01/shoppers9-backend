import express from 'express';
import {
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword
} from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.post('/login', login);
router.post('/admin/login', login); // Admin-specific login route
router.post('/logout', auth, logout);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', auth, changePassword);

export default router;