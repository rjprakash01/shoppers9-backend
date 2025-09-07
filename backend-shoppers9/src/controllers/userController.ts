import mongoose from 'mongoose';
import { User } from '../models/User';
import { Cart } from '../models/Cart';
import { Wishlist } from '../models/Wishlist';
import { Order } from '../models/Order';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, ApiResponse, IAddress } from '../types';

class UserController {
  // Get user profile
  async getProfile(req: AuthenticatedRequest, res: any): Promise<void> {
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
        message: 'Profile retrieved successfully',
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
      throw new AppError('Failed to get profile', 500);
    }
  }

  // Update user profile
  async updateProfile(req: AuthenticatedRequest, res: any): Promise<void> {
    try {
      const { name, email } = req.body;
      const userId = req.user?.id;

      let user: any;
      
      if (mongoose.connection.readyState !== 1) {
        // Development mode fallback - create mock updated user
        user = {
           _id: userId,
           id: userId,
           name: name || `User ${req.user?.phone || 'Test'}`,
           email: email || `test${req.user?.phone || '1234567890'}@example.com`,
           phone: req.user?.phone || '1234567890',
           isVerified: req.user?.isVerified || true,
           addresses: [],
           createdAt: new Date(),
           updatedAt: new Date()
         };
      } else {
        user = await User.findById(userId);
        if (!user) {
          throw new AppError('User not found', 404);
        }

        // Check if email is already taken by another user
        if (email && email !== user.email) {
          const existingUser = await User.findOne({ email, _id: { $ne: userId } });
          if (existingUser) {
            throw new AppError('Email already exists', 409);
          }
        }

        // Update user fields
        if (name) user.name = name;
        if (email) user.email = email;

        await user.save();
      }

      const response: ApiResponse = {
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: user._id || user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            isVerified: user.isVerified,
            updatedAt: user.updatedAt
          }
        }
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update profile', 500);
    }
  }

  // Get user addresses
  async getAddresses(req: AuthenticatedRequest, res: any): Promise<void> {
    try {
      const user = await User.findById(req.user?.id).select('addresses');
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const response: ApiResponse = {
        success: true,
        message: 'Addresses retrieved successfully',
        data: {
          addresses: user.addresses
        }
      };

      res.status(200).json(response);
    } catch (error) {
      throw new AppError('Failed to get addresses', 500);
    }
  }

  // Add new address
  async addAddress(req: AuthenticatedRequest, res: any): Promise<void> {
    try {
      const addressData: IAddress = req.body;
      const userId = req.user?.id;

      let user: any;
      let newAddress: any;
      
      if (mongoose.connection.readyState !== 1) {
        // Development mode fallback - create mock address
        addressData.isDefault = true; // First address is always default in dev mode
        newAddress = {
          ...addressData,
          _id: 'dev_address_' + Date.now(),
          id: 'dev_address_' + Date.now()
        };
      } else {
        user = await User.findById(userId);
        if (!user) {
          throw new AppError('User not found', 404);
        }

        // If this is the first address or marked as default, make it default
        if (user.addresses.length === 0 || addressData.isDefault) {
          // Remove default from other addresses
          user.addresses.forEach((addr: any) => {
            addr.isDefault = false;
          });
          addressData.isDefault = true;
        }

        user.addresses.push(addressData);
        await user.save();

        newAddress = user.addresses[user.addresses.length - 1];
      }

      const response: ApiResponse = {
        success: true,
        message: 'Address added successfully',
        data: {
          address: newAddress
        }
      };

      res.status(201).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to add address', 500);
    }
  }

  // Update address
  async updateAddress(req: AuthenticatedRequest, res: any): Promise<void> {
    try {
      const { addressId } = req.params;
      const updateData = req.body;
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const addressIndex = user.addresses.findIndex(
        addr => addr._id?.toString() === addressId
      );

      if (addressIndex === -1) {
        throw new AppError('Address not found', 404);
      }

      // If setting as default, remove default from other addresses
      if (updateData.isDefault) {
        user.addresses.forEach((addr, index) => {
          if (index !== addressIndex) {
            addr.isDefault = false;
          }
        });
      }

      // Update address fields
      Object.assign(user.addresses[addressIndex], updateData);
      await user.save();

      const response: ApiResponse = {
        success: true,
        message: 'Address updated successfully',
        data: {
          address: user.addresses[addressIndex]
        }
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update address', 500);
    }
  }

  // Delete address
  async deleteAddress(req: AuthenticatedRequest, res: any): Promise<void> {
    try {
      const { addressId } = req.params;
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const addressIndex = user.addresses.findIndex(
        addr => addr._id?.toString() === addressId
      );

      if (addressIndex === -1) {
        throw new AppError('Address not found', 404);
      }

      const wasDefault = user.addresses[addressIndex].isDefault;
      user.addresses.splice(addressIndex, 1);

      // If deleted address was default and there are other addresses, make the first one default
      if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
      }

      await user.save();

      const response: ApiResponse = {
        success: true,
        message: 'Address deleted successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete address', 500);
    }
  }

  // Set address as default
  async setDefaultAddress(req: AuthenticatedRequest, res: any): Promise<void> {
    try {
      const { addressId } = req.params;
      const userId = req.user?.id;

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const addressIndex = user.addresses.findIndex(
        addr => addr._id?.toString() === addressId
      );

      if (addressIndex === -1) {
        throw new AppError('Address not found', 404);
      }

      // Remove default from all addresses
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });

      // Set the specified address as default
      user.addresses[addressIndex].isDefault = true;
      await user.save();

      const response: ApiResponse = {
        success: true,
        message: 'Default address updated successfully',
        data: {
          address: user.addresses[addressIndex]
        }
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to set default address', 500);
    }
  }

  // Delete user account
  async deleteAccount(req: AuthenticatedRequest, res: any): Promise<void> {
    try {
      const userId = req.user?.id;

      // Check for pending orders
      const pendingOrders = await Order.find({
        userId,
        orderStatus: { $in: ['pending', 'confirmed', 'processing', 'shipped'] }
      });

      if (pendingOrders.length > 0) {
        throw new AppError('Cannot delete account with pending orders', 400);
      }

      // Delete user data
      await Promise.all([
        User.findByIdAndDelete(userId),
        Cart.findOneAndDelete({ userId }),
        Wishlist.findOneAndDelete({ userId })
      ]);

      const response: ApiResponse = {
        success: true,
        message: 'Account deleted successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete account', 500);
    }
  }
}

export const userController = new UserController();