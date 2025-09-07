import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin';
import { AuthenticatedRequest } from '../types';

// Generate JWT Token
const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  } as jwt.SignOptions);
};

// @desc    Admin login
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phoneNumber, password } = req.body;
    const loginField = email || phoneNumber;

    // If MongoDB is not connected, use mock authentication for testing
    if (Admin.db.readyState !== 1) {
      // Mock authentication for testing purposes
      if ((loginField === 'admin@shoppers9.com' || loginField === '9999999999') && password === 'admin123') {
        const mockToken = generateToken('mock-admin-id');
        res.status(200).json({
          success: true,
          data: {
            accessToken: mockToken,
            user: {
              id: 'mock-admin-id',
              name: 'Test Admin',
              email: 'admin@shoppers9.com',
              phone: '9999999999',
              role: 'admin',
              avatar: null
            }
          }
        });
        return;
      } else {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials (Test mode: use admin@shoppers9.com/9999999999 with password admin123)'
        });
        return;
      }
    }

    // Normal database authentication
    const query = email ? { email } : { phone: phoneNumber };
    const admin = await Admin.findOne(query).select('+password');
    
    if (!admin || !['admin', 'super_admin', 'moderator'].includes(admin.role)) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials or insufficient permissions'
      });
      return;
    }

    // Check if account is active
    if (!admin.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Generate token
    const token = generateToken(admin._id.toString());

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    res.status(200).json({
      success: true,
      data: {
        accessToken: token,
        user: {
          id: admin._id,
          name: `${admin.firstName} ${admin.lastName}`,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          avatar: null
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Admin logout
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No token provided'
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const admin = await Admin.findById(decoded.id);

    if (!admin || !admin.isActive || !['admin', 'super_admin', 'moderator'].includes(admin.role)) {
      res.status(401).json({
        success: false,
        message: 'Invalid token or insufficient permissions'
      });
      return;
    }

    // Generate new token
    const newToken = generateToken(admin._id.toString());

    res.status(200).json({
      success: true,
      token: newToken,
      user: {
        id: admin._id,
        name: `${admin.firstName} ${admin.lastName}`,
        email: admin.email,
        role: admin.role,
        avatar: null
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin || !['admin', 'super_admin', 'moderator'].includes(admin.role)) {
      res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
      return;
    }

    // Generate reset token (simplified - in production, use crypto)
    const resetToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET!, {
      expiresIn: '10m'
    });

    // In production, send email with reset link
    // For now, just return the token
    res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      resetToken // Remove this in production
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    const admin = await Admin.findById(userId).select('+password');
    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
      return;
    }

    // Check current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};