import { Request, Response } from 'express';
import { getUserModel } from '../models/User';
import Order from '../models/Order';
import { AuthRequest, UserQueryParams } from '../types';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      verified,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query as { [key: string]: any };

    const query: any = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.isActive = status === 'active';
    }

    if (verified !== undefined) {
      query.isVerified = verified === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const User = getUserModel();
    const users = await User.find(query)
      .select('-password')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const User = getUserModel();
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's order statistics
    const orderStats = await Order.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' }
        }
      }
    ]);

    const recentOrders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber total status createdAt');

    return res.json({
      success: true,
      data: {
        user,
        stats: orderStats[0] || { totalOrders: 0, totalSpent: 0, averageOrderValue: 0 },
        recentOrders
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { password, ...updateData } = req.body;

    // Don't allow password updates through this endpoint
    if (password) {
      return res.status(400).json({
        success: false,
        message: 'Password cannot be updated through this endpoint'
      });
    }

    const User = getUserModel();
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error updating user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const User = getUserModel();
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has any orders
    const orderCount = await Order.countDocuments({ user: user._id });
    
    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with existing orders. Deactivate the user instead.'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const User = getUserModel();
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error toggling user status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getUserAnalytics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate as string);
    }

    const User = getUserModel();
    const totalUsers = await User.countDocuments(dateFilter);
    const activeUsers = await User.countDocuments({ ...dateFilter, isActive: true });
    const verifiedUsers = await User.countDocuments({ ...dateFilter, isVerified: true });
    const inactiveUsers = await User.countDocuments({ ...dateFilter, isActive: false });

    // User registration trend
    const registrationTrend = await User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Users by gender
    const genderStats = await User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);

    // Top users by order value
    const topUsers = await User.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders'
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          totalOrders: { $size: '$orders' },
          totalSpent: { $sum: '$orders.total' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          verifiedUsers,
          inactiveUsers
        },
        registrationTrend,
        genderStats,
        topUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const exportUsers = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, status, format = 'json' } = req.query;

    const query: any = {};

    if (status) {
      query.isActive = status === 'active';
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const User = getUserModel();
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = users.map(user => ({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      
      // Simple CSV conversion (in production, use a proper CSV library)
      const csvHeaders = Object.keys(csvData[0] || {}).join(',');
      const csvRows = csvData.map(row => Object.values(row).join(','));
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      res.send(csvContent);
    } else {
      res.json({
        success: true,
        data: users
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};