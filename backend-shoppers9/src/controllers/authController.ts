import jwt, { SignOptions } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { OTP } from '../models/OTP';
import { Cart } from '../models/Cart';
import { Wishlist } from '../models/Wishlist';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { smsService } from '../services/smsService';

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
    } catch (error) {
      
      throw new AppError('Failed to send OTP', 500);
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

  // Helper method to generate JWT tokens
  public generateTokens(user: any) {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

    if (!jwtSecret || !jwtRefreshSecret) {
      throw new AppError('JWT secrets not configured', 500);
    }

    const payload = {
      id: user._id,
      phone: user.phone,
      isVerified: user.isVerified
    };

    const accessToken = jwt.sign(payload, jwtSecret as string, { expiresIn: jwtExpiresIn } as any);
    const refreshToken = jwt.sign(payload, jwtRefreshSecret as string, { expiresIn: jwtRefreshExpiresIn } as any);

    return { accessToken, refreshToken };
  }
}

export const authController = new AuthController();