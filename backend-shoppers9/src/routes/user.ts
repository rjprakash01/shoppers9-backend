import express from 'express';
import { userController } from '../controllers/userController';
import { validateRequest } from '../middleware/validation';
import { authenticateToken, requireVerification } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().optional(),
  email: Joi.string().email().optional()
});

const addAddressSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().required(),
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
  addressLine1: Joi.string().min(5).max(200).trim().required(),
  addressLine2: Joi.string().max(200).trim().allow('').optional(),
  city: Joi.string().min(2).max(50).trim().required(),
  state: Joi.string().min(2).max(50).trim().required(),
  pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/).required(),
  landmark: Joi.string().max(100).trim().allow('').optional(),
  isDefault: Joi.boolean().optional()
});

const updateAddressSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().optional(),
  phone: Joi.string()
    .custom((value, helpers) => {
      // Allow test phone number or valid Indian phone numbers
      if (value === '1234567890' || /^[6-9]\d{9}$/.test(value)) {
        return value;
      }
      return helpers.error('string.pattern.base');
    })
    .optional()
    .messages({
      'string.pattern.base': 'Phone number must be a valid 10-digit Indian mobile number or test number'
    }),
  addressLine1: Joi.string().min(5).max(200).trim().optional(),
  addressLine2: Joi.string().max(200).trim().allow('').optional(),
  city: Joi.string().min(2).max(50).trim().optional(),
  state: Joi.string().min(2).max(50).trim().optional(),
  pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/).optional(),
  landmark: Joi.string().max(100).trim().allow('').optional(),
  isDefault: Joi.boolean().optional()
});

const addressIdSchema = Joi.object({
  addressId: Joi.string().required()
});

// Apply authentication to all routes
router.use(authenticateToken);
router.use(requireVerification);

// Routes

/**
 * @route GET /users/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/profile',
  asyncHandler(userController.getProfile)
);

/**
 * @route PUT /users/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile',
  validateRequest(updateProfileSchema),
  asyncHandler(userController.updateProfile)
);

/**
 * @route GET /users/addresses
 * @desc Get user addresses
 * @access Private
 */
router.get('/addresses',
  asyncHandler(userController.getAddresses)
);

/**
 * @route POST /users/addresses
 * @desc Add new address
 * @access Private
 */
router.post('/addresses',
  validateRequest(addAddressSchema),
  asyncHandler(userController.addAddress)
);

/**
 * @route PUT /users/addresses/:addressId
 * @desc Update address
 * @access Private
 */
router.put('/addresses/:addressId',
  validateRequest(updateAddressSchema),
  asyncHandler(userController.updateAddress)
);

/**
 * @route DELETE /users/addresses/:addressId
 * @desc Delete address
 * @access Private
 */
router.delete('/addresses/:addressId',
  asyncHandler(userController.deleteAddress)
);

/**
 * @route PUT /users/addresses/:addressId/default
 * @desc Set address as default
 * @access Private
 */
router.put('/addresses/:addressId/default',
  asyncHandler(userController.setDefaultAddress)
);

/**
 * @route DELETE /users/account
 * @desc Delete user account
 * @access Private
 */
router.delete('/account',
  asyncHandler(userController.deleteAccount)
);

export default router;