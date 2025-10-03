import { Response } from 'express';
import { AuthRequest } from '../types';
import Product from '../models/Product';
import Order from '../models/Order';
import { getUserModel } from '../models/User';
import AuditLog from '../models/AuditLog';
import mongoose from 'mongoose';

// Get role-specific dashboard analytics
export const getDashboardAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.admin.role;
    const userId = req.admin._id;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    let dashboardData: any = {};

    switch (userRole) {
      case 'super_admin':
        dashboardData = await getSuperAdminDashboard(startDate, endDate);
        break;
      case 'admin':
        dashboardData = await getAdminDashboard(userId, startDate, endDate);
        break;
      case 'sub_admin':
        dashboardData = await getSubAdminDashboard(startDate, endDate);
        break;
      case 'seller':
        dashboardData = await getSellerDashboard(userId, startDate, endDate);
        break;
      case 'customer':
        dashboardData = await getCustomerDashboard(userId, startDate, endDate);
        break;
      default:
        return res.status(403).json({
          success: false,
          message: 'Invalid user role'
        });
    }

    // Log dashboard access
    await AuditLog.logAction({
      userId: req.admin._id,
      action: 'read',
      module: 'dashboard',
      resource: 'analytics',
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      },
      status: 'success'
    });

    return res.status(200).json({
      success: true,
      data: {
        ...dashboardData,
        userRole,
        dateRange: { startDate, endDate },
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    
    // Log failed access
    if (req.admin) {
      await AuditLog.logAction({
        userId: req.admin._id,
        action: 'read',
        module: 'dashboard',
        resource: 'analytics',
        details: {
          method: req.method,
          endpoint: req.originalUrl,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        },
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Super Admin Dashboard - Global overview of all data
async function getSuperAdminDashboard(startDate: Date, endDate: Date) {
  const User = getUserModel();
  const [totalUsers, totalProducts, totalOrders, totalRevenue, recentOrders, topProducts, userGrowth, salesTrend] = await Promise.all([
    // Total users across all roles
    User.countDocuments({ isActive: true }),
    
    // Total products from all sellers/admins
    Product.countDocuments({ isActive: true }),
    
    // Total orders in date range
    Order.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    }),
    
    // Total revenue in date range
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' }
        }
      }
    ]),
    
    // Recent orders from all sellers
    Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .populate('userId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean(),
    
    // Top products across all sellers
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          orderStatus: { $in: ['delivered', 'shipped'] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      }
    ]),
    
    // User growth over time
    User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
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
    ]),
    
    // Sales trend over time
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalSales: { $sum: '$finalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ])
  ]);

  return {
    overview: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue[0]?.totalRevenue || 0,
      averageOrderValue: totalOrders > 0 ? (totalRevenue[0]?.totalRevenue || 0) / totalOrders : 0
    },
    recentOrders,
    topProducts,
    charts: {
      userGrowth,
      salesTrend
    },
    scope: 'global'
  };
}

// Admin Dashboard - Only admin's own data
async function getAdminDashboard(userId: string, startDate: Date, endDate: Date) {
  const User = getUserModel();
  const [totalUsers, totalProducts, totalOrders, totalRevenue, recentOrders, topProducts, userGrowth, salesTrend] = await Promise.all([
    // Total users (customers only)
    User.countDocuments({ isActive: true, primaryRole: 'customer' }),
    
    // Total products created by this admin
    Product.countDocuments({ isActive: true, createdBy: userId }),
    
    // Total orders containing admin's products in date range
    Order.countDocuments({
      'items.sellerId': userId,
      createdAt: { $gte: startDate, $lte: endDate }
    }),
    
    // Total revenue from admin's products in date range
    Order.aggregate([
      {
        $match: {
          'items.sellerId': userId,
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'completed'
        }
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.sellerId': userId
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      }
    ]),
    
    // Recent orders containing admin's products
    Order.find({
      'items.sellerId': userId,
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .populate('userId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean(),
    
    // Top products from this admin
    Order.aggregate([
      {
        $match: {
          'items.sellerId': userId,
          createdAt: { $gte: startDate, $lte: endDate },
          orderStatus: { $in: ['delivered', 'shipped'] }
        }
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.sellerId': userId
        }
      },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      }
    ]),
    
    // User growth over time (customers only)
    User.aggregate([
      {
        $match: {
          primaryRole: 'customer',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
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
    ]),
    
    // Sales trend over time for admin's products
    Order.aggregate([
      {
        $match: {
          'items.sellerId': userId,
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'completed'
        }
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.sellerId': userId
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalSales: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ])
  ]);

  return {
    overview: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue[0]?.totalRevenue || 0,
      averageOrderValue: totalOrders > 0 ? (totalRevenue[0]?.totalRevenue || 0) / totalOrders : 0
    },
    recentOrders,
    topProducts,
    charts: {
      userGrowth,
      salesTrend
    },
    scope: 'admin_own_data'
  };
}

// Sub-Admin Dashboard - Operational overview
async function getSubAdminDashboard(startDate: Date, endDate: Date) {
  const [totalOrders, pendingOrders, supportTickets, recentOrders] = await Promise.all([
    Order.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    }),
    
    Order.countDocuments({
      orderStatus: { $in: ['pending', 'confirmed'] },
      createdAt: { $gte: startDate, $lte: endDate }
    }),
    
    // Support tickets count (if support model exists)
    // Support.countDocuments({
    //   createdAt: { $gte: startDate, $lte: endDate }
    // }),
    0, // Placeholder
    
    Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .populate('userId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()
  ]);

  return {
    overview: {
      totalOrders,
      pendingOrders,
      supportTickets,
      processingRate: totalOrders > 0 ? ((totalOrders - pendingOrders) / totalOrders * 100).toFixed(1) : 0
    },
    recentOrders,
    scope: 'operational'
  };
}

// Seller Dashboard - Own products and sales
async function getSellerDashboard(userId: string, startDate: Date, endDate: Date) {
  return getAdminDashboard(userId, startDate, endDate); // Same logic as admin
}

// Customer Dashboard - Personal order history
async function getCustomerDashboard(userId: string, startDate: Date, endDate: Date) {
  const [myOrders, totalSpent, recentOrders] = await Promise.all([
    Order.countDocuments({
      userId: userId,
      createdAt: { $gte: startDate, $lte: endDate }
    }),
    
    Order.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$finalAmount' }
        }
      }
    ]),
    
    Order.find({
      userId: userId,
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()
  ]);

  return {
    overview: {
      myOrders,
      totalSpent: totalSpent[0]?.totalSpent || 0,
      averageOrderValue: myOrders > 0 ? (totalSpent[0]?.totalSpent || 0) / myOrders : 0
    },
    recentOrders,
    scope: 'personal'
  };
}

export default {
  getDashboardAnalytics
};