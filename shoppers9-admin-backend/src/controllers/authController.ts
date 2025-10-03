import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin';
import Role from '../models/Role';
import UserRole from '../models/UserRole';
import { getUserModel } from '../models/User';
import { AuthenticatedRequest, AuthRequest } from '../types';

// OTP storage (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expiresAt: Date; attempts: number }>();

// Generate JWT Token
const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  } as jwt.SignOptions);
};

// Generate OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP (mock implementation - in production, integrate with SMS service)
const sendOTP = async (phone: string, otp: string): Promise<boolean> => {
  try {
    // Mock SMS sending - replace with actual SMS service (Twilio, AWS SNS, etc.)
    console.log(`📱 SMS to ${phone}: Your OTP is ${otp}. Valid for 5 minutes.`);
    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
};

// Create demo accounts
export const createDemoAccounts = async (): Promise<void> => {
  try {
    const demoAccounts = [
      {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@shoppers9.com',
        phone: '9999999999',
        password: 'SuperAdmin@123',
        role: 'super_admin'
      },
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin1@shoppers9.com',
        phone: '9876543210',
        password: 'admin123',
        role: 'admin'
      },
      {
        firstName: 'Sub',
        lastName: 'Admin',
        email: 'admin2@shoppers9.com',
        phone: '9876543211',
        password: 'admin123',
        role: 'sub_admin'
      }
    ];

    for (const accountData of demoAccounts) {
      const existingAdmin = await Admin.findOne({ 
        $or: [{ email: accountData.email }, { phone: accountData.phone }] 
      });
      
      if (!existingAdmin) {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(accountData.password, salt);
        
        await Admin.create({
          ...accountData,
          password: hashedPassword,
          isActive: true
        });
        
        console.log(`✅ Demo ${accountData.role} created: ${accountData.email}`);
      }
    }
  } catch (error) {
    console.error('Error creating demo accounts:', error);
  }
};

// @desc    Admin login with email/password
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
      return;
    }

    // Find admin by email
    const admin = await Admin.findOne({ 
      email: email.toLowerCase()
    }).select('+password');

    if (!admin) {
      console.log(`Failed login attempt for email: ${email}`);
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Check if account is active
    if (!admin.isActive) {
      console.log(`Login attempt on deactivated account: ${admin.email}`);
      res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    if (!isPasswordValid) {
      console.log(`Invalid password attempt for admin: ${admin.email}`);
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

    console.log(`Successful login for admin: ${admin.email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: token,
        user: {
          id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          primaryRole: admin.role,
          isActive: admin.isActive,
          lastLogin: admin.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Send OTP to phone number
// @route   POST /api/auth/send-otp
// @access  Public
export const sendOTPToPhone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
      return;
    }

    // Validate phone number format (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
      return;
    }

    // Find user by phone
    const User = getUserModel();
    const user = await User.findOne({ 
      phone,
      primaryRole: { $in: ['super_admin', 'admin', 'sub_admin'] }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'No admin account found with this phone number'
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
      return;
    }

    // Check rate limiting (max 3 OTP requests per 15 minutes)
    const existingOTP = otpStore.get(phone);
    if (existingOTP && existingOTP.attempts >= 3) {
      res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again after 15 minutes.'
      });
      return;
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    // Store OTP
    otpStore.set(phone, {
      otp,
      expiresAt,
      attempts: existingOTP ? existingOTP.attempts + 1 : 1
    });

    // Send OTP
    const otpSent = await sendOTP(phone, otp);
    
    if (!otpSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
      return;
    }

    console.log(`OTP requested for phone: ${phone}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone,
        expiresIn: 300 // 5 minutes in seconds
      }
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTPAndLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
      return;
    }

    // Get stored OTP
    const storedOTPData = otpStore.get(phone);
    
    if (!storedOTPData) {
      res.status(400).json({
        success: false,
        message: 'No OTP found for this phone number. Please request a new OTP.'
      });
      return;
    }

    // Check if OTP is expired
    if (new Date() > storedOTPData.expiresAt) {
      otpStore.delete(phone);
      res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
      return;
    }

    // Verify OTP
    if (storedOTPData.otp !== otp) {
      res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
      return;
    }

    // Find user
    const User = getUserModel();
    const user = await User.findOne({ 
      phone,
      primaryRole: { $in: ['super_admin', 'admin', 'sub_admin'] }
    });

    if (!user || !user.isActive) {
      otpStore.delete(phone);
      res.status(401).json({
        success: false,
        message: 'Account not found or deactivated'
      });
      return;
    }

    // Clear OTP from store
    otpStore.delete(phone);
    
    // Generate token
    const token = generateToken(user._id.toString());
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();

    console.log(`Successful OTP login for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          primaryRole: user.primaryRole,
          isActive: user.isActive,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      console.log(`User logged out: ${req.user.email}`);
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Use the admin data from the auth middleware
    const admin = req.admin;

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          phone: admin.phone,
          role: admin.primaryRole,
          isActive: admin.isActive,
          lastLogin: admin.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get demo credentials
// @route   GET /api/auth/demo-credentials
// @access  Public
export const getDemoCredentials = async (req: Request, res: Response): Promise<void> => {
  try {
    const demoCredentials = {
      superAdmin: {
        email: 'superadmin@shoppers9.com',
        phone: '9999999999',
        password: 'SuperAdmin@123',
        role: 'Super Administrator',
        description: 'Complete platform control with all permissions'
      },
      admin: {
        email: 'admin1@shoppers9.com',
        phone: '9876543210',
        password: 'admin123',
        role: 'Administrator',
        description: 'Administrative access with configurable permissions'
      },
      subAdmin: {
        email: 'admin2@shoppers9.com',
        phone: '9876543211',
        password: 'admin123',
        role: 'Sub Administrator',
        description: 'Limited administrative access with specific modules'
      }
    };

    res.status(200).json({
      success: true,
      message: 'Demo credentials retrieved successfully',
      data: demoCredentials
    });
  } catch (error) {
    console.error('Get demo credentials error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export default {
  login,
  sendOTPToPhone,
  verifyOTPAndLogin,
  logout,
  getMe,
  getDemoCredentials,
  createDemoAccounts
};