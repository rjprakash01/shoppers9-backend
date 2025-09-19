import express from 'express';
import {
  login,
  sendOTPToPhone,
  verifyOTPAndLogin,
  logout,
  getMe,
  getDemoCredentials
} from '../controllers/authController';
import { auth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const sendOTPSchema = Joi.object({
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required().messages({
    'string.pattern.base': 'Phone number must be a valid 10-digit Indian mobile number'
  })
});

const verifyOTPSchema = Joi.object({
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must contain only numbers'
  })
});

// Authentication routes
router.post('/login', validateRequest(loginSchema), login);
router.post('/send-otp', validateRequest(sendOTPSchema), sendOTPToPhone);
router.post('/verify-otp', validateRequest(verifyOTPSchema), verifyOTPAndLogin);
router.post('/logout', auth, logout);
router.get('/me', auth, getMe);

// Demo credentials (public endpoint for testing)
router.get('/demo-credentials', getDemoCredentials);

export default router;