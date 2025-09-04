import express from 'express';
import { authController } from '../controllers/authController';
import { validateRequest } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const sendOTPSchema = Joi.object({
  phone: Joi.string()
    .custom((value, helpers) => {
      // Allow test phone number or valid Indian phone numbers
      if (value === '1234567890' || /^[6-9]\d{9}$/.test(value)) {
        return value;
      }
      return helpers.error('string.pattern.base');
    })
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be a valid 10-digit Indian mobile number or test number'
    })
});

const verifyOTPSchema = Joi.object({
  phone: Joi.string()
    .custom((value, helpers) => {
      // Allow test phone number or valid Indian phone numbers
      if (value === '1234567890' || /^[6-9]\d{9}$/.test(value)) {
        return value;
      }
      return helpers.error('string.pattern.base');
    })
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be a valid 10-digit Indian mobile number or test number'
    }),
  otp: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'OTP must be a 4-digit number'
    }),
  name: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .optional(),
  email: Joi.string()
    .email()
    .optional()
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const adminLoginSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  password: Joi.string().required()
}).or('email', 'phone');

// Routes

/**
 * @route POST /auth/send-otp
 * @desc Send OTP to phone number
 * @access Public
 */
router.post('/send-otp', 
  validateRequest(sendOTPSchema),
  asyncHandler(authController.sendOTP)
);

/**
 * @route POST /auth/verify-otp
 * @desc Verify OTP and login/register user
 * @access Public
 */
router.post('/verify-otp',
  validateRequest(verifyOTPSchema),
  asyncHandler(authController.verifyOTP)
);

/**
 * @route POST /auth/refresh-token
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh-token',
  validateRequest(refreshTokenSchema),
  asyncHandler(authController.refreshToken)
);

/**
 * @route POST /auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout',
  authenticateToken,
  asyncHandler(authController.logout)
);

/**
 * @route GET /auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me',
  authenticateToken,
  asyncHandler(authController.getCurrentUser)
);

/**
 * @route POST /auth/resend-otp
 * @desc Resend OTP to phone number
 * @access Public
 */
router.post('/resend-otp',
  validateRequest(sendOTPSchema),
  asyncHandler(authController.resendOTP)
);

// Admin login endpoint
router.post('/admin/login',
  validateRequest(adminLoginSchema),
  asyncHandler((req: any, res: any) => authController.adminLogin(req, res))
);

export default router;