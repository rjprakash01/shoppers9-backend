import jwt, { SignOptions } from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { User } from '../models/User';
import { OTP } from '../models/OTP';
import { Cart } from '../models/Cart';
import { Wishlist } from '../models/Wishlist';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { smsService } from '../services/smsService';
import { emailService } from '../services/emailService';

class AuthController {
  // Send OTP to phone number
  async sendOTP(req: any, res: any): Promise<void> {
    const { phone } = req.body;

    try {

      // BYPASS OTP GENERATION AND SENDING - Just return success
      const mockExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      const response: ApiResponse = {
        success: true,
        message: 'OTP sent successfully (NO AUTH)',
        data: {
          phone,
          expiresAt: mockExpiresAt,
          message: `Mock OTP sent to ${phone.replace(/^(\d{2})(\d{4})(\d{4})$/, '$1****$3')} - Use any OTP`
        }
      };

      res.status(200).json(response);
    } catch (error: any) {
      console.error('SendOTP Error:', error);
      throw new AppError(`Failed to send OTP: ${error.message}`, 500);
    }
  }

  // Verify OTP and login/register user
  async verifyOTP(req: any, res: any): Promise<void> {
    const { phone, otp, name, email } = req.body;

    try {
      // For test phone number, use hardcoded OTP
      if (phone === '1234567890') {
        if (otp !== '1234') {
          throw new AppError('Invalid OTP', 400);
        }
        
      } else {
        // For production, verify actual OTP from database
        const otpRecord = await OTP.findOne({
          phone,
          otp,
          isUsed: false,
          expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
          throw new AppError('Invalid or expired OTP', 400);
        }

        // Mark OTP as used
        otpRecord.isUsed = true;
        await otpRecord.save();
        
      }

      // Find or create user
      let user: any;
       if (mongoose.connection.readyState !== 1) {
         // Create mock user for development mode
         user = {
           _id: 'dev_user_' + phone,
           id: 'dev_user_' + phone,
           name: name || `User ${phone}`,
           phone,
           email: email || `test${phone}@example.com`,
           isVerified: true,
           addresses: [],
           createdAt: new Date(),
           updatedAt: new Date()
         };
       } else {
         user = await User.findOne({ phone });
       }
      let isNewUser = false;

      if (!user) {
        if (mongoose.connection.readyState !== 1) {
          // Create mock user for development mode
          // For test phone number, create default test user without requiring name
          if (phone === '1234567890') {
            user = {
              _id: 'dev_user_' + phone,
              id: 'dev_user_' + phone,
              name: name || 'Test User',
              phone,
              email: email || `test${phone}@example.com`,
              isVerified: true,
              addresses: [],
              createdAt: new Date(),
              updatedAt: new Date()
            };
          } else {
            // For other phone numbers, require name
            if (!name) {
              throw new AppError('Name is required for new users', 400);
            }

            user = {
              _id: 'dev_user_' + phone,
              id: 'dev_user_' + phone,
              name,
              phone,
              email: email || `test${phone}@example.com`,
              isVerified: true,
              addresses: [],
              createdAt: new Date(),
              updatedAt: new Date()
            };
          }
          isNewUser = true;
        } else {
          // Create new user in database
          // For test phone number, create default test user without requiring name
          if (phone === '1234567890') {
            user = new User({
              name: name || 'Test User',
              email: email || `test${phone}@example.com`,
              phone,
              isVerified: true
            });
            await user.save();
            isNewUser = true;

            // Create empty cart and wishlist for new user
            await Promise.all([
              new Cart({ userId: user._id, items: [] }).save(),
              new Wishlist({ userId: user._id, items: [] }).save()
            ]);
          } else {
            // For other phone numbers, require name
            if (!name) {
              throw new AppError('Name is required for new users', 400);
            }

            user = new User({
              name,
              email,
              phone,
              isVerified: true
            });
            await user.save();
            isNewUser = true;

            // Create empty cart and wishlist for new user
            await Promise.all([
              new Cart({ userId: user._id, items: [] }).save(),
              new Wishlist({ userId: user._id, items: [] }).save()
            ]);
          }
        }
      } else {
         if (mongoose.connection.readyState === 1) {
           // Update existing user verification status
           user.isVerified = true;
           if (name && name !== user.name) {
             user.name = name;
           }
           if (email && email !== user.email) {
             user.email = email;
           }
           // Only save if user is a Mongoose document
           if (typeof (user as any).save === 'function') {
             await (user as any).save();
           }
         }
       }

      // Generate tokens
      const { accessToken, refreshToken } = authController.generateTokens(user);

      const response: ApiResponse = {
        success: true,
        message: isNewUser ? 'Registration successful' : 'Login successful',
        data: {
          user: {
            id: user.id || user._id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            isVerified: user.isVerified
          },
          accessToken,
          refreshToken,
          isNewUser
        }
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Authentication failed', 500);
    }
  }

  // Refresh access token
  async refreshToken(req: any, res: any): Promise<void> {
    const { refreshToken } = req.body;

    try {
      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
      if (!jwtRefreshSecret) {
        throw new AppError('JWT refresh secret not configured', 500);
      }

      const decoded = jwt.verify(refreshToken, jwtRefreshSecret as string) as any;
      const user = await User.findById(decoded.id);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);

      const response: ApiResponse = {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken,
          refreshToken: newRefreshToken
        }
      };

      res.status(200).json(response);
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  // Logout user
  async logout(req: AuthenticatedRequest, res: any): Promise<void> {
    // In a production app, you might want to blacklist the token
    // For now, we'll just send a success response
    const response: ApiResponse = {
      success: true,
      message: 'Logged out successfully'
    };

    res.status(200).json(response);
  }

  // Get current user profile
  async getCurrentUser(req: AuthenticatedRequest, res: any): Promise<void> {
    try {
      let user: any;
      
      if (mongoose.connection.readyState !== 1) {
        // Development mode fallback - create mock user from token data
        user = {
          _id: req.user?.id || 'dev_user',
          id: req.user?.id || 'dev_user',
          name: `User ${req.user?.phone || 'Test'}`,
          phone: req.user?.phone || '1234567890',
          email: `test${req.user?.phone || '1234567890'}@example.com`,
          isVerified: req.user?.isVerified || true,
          addresses: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
      } else {
        user = await User.findById(req.user?.id).select('-__v');
        
        if (!user) {
          throw new AppError('User not found', 404);
        }
      }

      const response: ApiResponse = {
        success: true,
        message: 'User profile retrieved successfully',
        data: {
          user: {
            id: user._id || user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            isVerified: user.isVerified,
            addresses: user.addresses,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      };

      res.status(200).json(response);
    } catch (error) {
      throw new AppError('Failed to get user profile', 500);
    }
  }

  // Resend OTP
  async resendOTP(req: any, res: any): Promise<void> {
    const { phone } = req.body;

    try {
      // Check if user has exceeded resend attempts (implement rate limiting)
      const recentOTPs = await OTP.find({
        phone,
        createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 minutes
      });

      if (recentOTPs.length >= 3) {
        throw new AppError('Too many OTP requests. Please try again after 15 minutes.', 429);
      }

      // Generate and send new OTP
      const { otp, expiresAt } = await OTP.createOTP(phone);
      await smsService.sendOTP(phone, otp);

      const response: ApiResponse = {
        success: true,
        message: 'OTP resent successfully',
        data: {
          phone,
          expiresAt,
          message: `OTP resent to ${phone.replace(/^(\d{2})(\d{4})(\d{4})$/, '$1****$3')}`
        }
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to resend OTP', 500);
    }
  }

  // Admin login
  async adminLogin(req: any, res: any): Promise<void> {
    const { email, phone, password } = req.body;
    const loginField = email || phone;

    try {
      // BYPASS AUTHENTICATION - Allow any credentials
      const mockAdminUser = {
        id: 'admin-mock-id',
        email: email || 'admin@shoppers9.com',
        phone: phone || '9999999999',
        name: 'Admin User',
        role: 'admin'
      };

      // Generate tokens directly without relying on this context
      const jwtSecret = process.env.JWT_SECRET;
      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
      const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
      const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

      // Debug logging

      if (!jwtSecret || !jwtRefreshSecret) {
        throw new AppError('JWT secrets not configured', 500);
      }

      const payload = {
        id: mockAdminUser.id,
        phone: mockAdminUser.phone,
        isVerified: true
      };

      const accessToken = jwt.sign(payload, jwtSecret as string, { expiresIn: jwtExpiresIn } as any);
      const refreshToken = jwt.sign(payload, jwtRefreshSecret as string, { expiresIn: jwtRefreshExpiresIn } as any);

      const response: ApiResponse = {
        success: true,
        message: 'Admin login successful (NO AUTH)',
        data: {
          user: mockAdminUser,
          accessToken,
          refreshToken
        }
      };

      res.status(200).json(response);
    } catch (error) {
      
      throw new AppError('Admin login failed', 500);
    }
  }

  // Register with email and password
  async registerWithEmail(req: any, res: any): Promise<void> {
    const { name, email, password } = req.body;

    try {
      // Validate input
      if (!name || !email || !password) {
        throw new AppError('Name, email, and password are required', 400);
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new AppError('User with this email already exists', 409);
      }

      // Create new user
      const user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        authMethod: 'email',
        isVerified: false,
        isEmailVerified: false
      });

      await user.save();

      // Create cart and wishlist for new user
      await Promise.all([
        Cart.create({ userId: user._id, items: [], totalAmount: 0, totalDiscount: 0, subtotal: 0 }),
        Wishlist.create({ userId: user._id, items: [] })
      ]);

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(user);

      // Send welcome email (non-blocking) - don't let email failures break registration
      try {
        emailService.sendWelcomeEmail(user.email!, user.name).catch(err => {
          console.log('Welcome email failed (non-critical):', err.message);
        });
      } catch (err) {
        console.log('Email service error (non-critical):', err);
      }

      const response: ApiResponse = {
        success: true,
        message: 'Account created successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            authMethod: user.authMethod,
            isVerified: user.isVerified,
            isEmailVerified: user.isEmailVerified
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      };

      res.status(201).json(response);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new AppError('User with this email already exists', 409);
      }
      throw error;
    }
  }

  // Login with email and password
  async loginWithEmail(req: any, res: any): Promise<void> {
    const { email, password } = req.body;

    try {
      // Validate input
      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      // Check if account is locked
      if (user.isLocked && user.isLocked()) {
        throw new AppError('Account temporarily locked due to too many failed login attempts', 423);
      }

      // Verify password
      const isPasswordValid = await user.comparePassword!(password);
      if (!isPasswordValid) {
        // Increment login attempts
        await user.incLoginAttempts!();
        throw new AppError('Invalid email or password', 401);
      }

      // Reset login attempts on successful login
      if (user.loginAttempts && user.loginAttempts > 0) {
        await user.updateOne({
          $unset: { loginAttempts: 1, lockUntil: 1 }
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(user);

      const response: ApiResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            authMethod: user.authMethod,
            isVerified: user.isVerified,
            isEmailVerified: user.isEmailVerified,
            lastLogin: user.lastLogin
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      };

      res.status(200).json(response);
    } catch (error) {
      throw error;
    }
  }

  // Request password reset
  async requestPasswordReset(req: any, res: any): Promise<void> {
    const { email } = req.body;

    try {
      if (!email) {
        throw new AppError('Email is required', 400);
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        // Don't reveal if email exists or not
        const response: ApiResponse = {
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent'
        };
        return res.status(200).json(response);
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await user.save();

      // Send password reset email (non-blocking) - don't let email failures break the flow
      emailService.sendPasswordResetEmail(user.email!, user.name, resetToken).catch(emailError => {
        console.log('Password reset email failed (non-critical):', emailError.message);
      });
      // Continue immediately without waiting for email

      const response: ApiResponse = {
        success: true,
        message: 'Password reset link sent to your email'
      };

      res.status(200).json(response);
    } catch (error) {
      throw error;
    }
  }

  // Reset password
  async resetPassword(req: any, res: any): Promise<void> {
    const { token, password } = req.body;

    try {
      if (!token || !password) {
        throw new AppError('Token and new password are required', 400);
      }

      // Hash the token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with valid reset token
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() }
      });

      if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      // Update password and clear reset token
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.loginAttempts = 0;
      user.lockUntil = undefined;

      await user.save();

      const response: ApiResponse = {
        success: true,
        message: 'Password reset successful'
      };

      res.status(200).json(response);
    } catch (error) {
      throw error;
    }
  }

  // Helper method to generate JWT tokens
  public generateTokens(user: any) {
    const payload = {
      userId: user._id,
      id: user._id,
      phone: user.phone,
      email: user.email,
      authMethod: user.authMethod,
      isVerified: user.isVerified
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '15m'
    } as SignOptions);

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: '7d'
    } as SignOptions);

    return { accessToken, refreshToken };
  }
}

export const authController = new AuthController();