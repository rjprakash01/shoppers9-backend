import { Request, Response } from 'express';
import User from '../models/User';
import Order from '../models/Order';
import Product from '../models/Product';
import Admin from '../models/Admin';
import { AuthRequest, DashboardStats, SalesAnalytics, UserAnalytics } from '../types';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Apply data filtering for role-based access
    // Only super_admin should see all data, admin should see only their own data
    const userRole = req.admin?.primaryRole;
    const userId = req.admin?._id;
    
    const productFilter = userRole === 'super_admin' ? {} : (userRole === 'admin' ? { createdBy: userId } : (req.dataFilter?.getFilter('Product') || {}));
    const orderFilter = userRole === 'super_admin' ? {} : (userRole === 'admin' ? { 'items.sellerId': userId } : (req.dataFilter?.getFilter('Order') || {}));
    const userFilter = userRole === 'super_admin' ? {} : (userRole === 'admin' ? { primaryRole: 'customer' } : (req.dataFilter?.getFilter('User') || {}));

    // Basic counts with filtering
    const totalUsers = await User.countDocuments(userFilter);
    const totalProducts = await Product.countDocuments(productFilter);
    const totalOrders = await Order.countDocuments(orderFilter);
    const totalAdmins = await Admin.countDocuments(); // Admin count remains global for super admin

    // Revenue calculation with filtering
    const revenueResult = await Order.aggregate([
      { $match: { ...orderFilter, orderStatus: { $ne: 'cancelled' }, paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Recent period stats with filtering
    const recentUsers = await User.countDocuments({ ...userFilter, createdAt: { $gte: startDate } });
    const recentOrders = await Order.countDocuments({ ...orderFilter, createdAt: { $gte: startDate } });
    const recentRevenueResult = await Order.aggregate([
      { 
        $match: { 
          ...orderFilter,
          createdAt: { $gte: startDate },
          orderStatus: { $ne: 'cancelled' },
          paymentStatus: 'completed'
        }
      },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);
    const recentRevenue = recentRevenueResult.length > 0 ? recentRevenueResult[0].total : 0;

    // Recent orders for display with filtering
    const latestOrders = await Order.find(orderFilter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber totalAmount orderStatus createdAt userId');

    // Top selling products with filtering
    const topProducts = await Order.aggregate([
      { $match: { ...orderFilter, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.total' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $project: {
          name: { $arrayElemAt: ['$productInfo.name', 0] },
          totalSold: 1,
          revenue: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    // Sales trend for the period
    const salesTrend = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const dashboardData: DashboardStats = {
      totalUsers,
      totalOrders,
      totalRevenue,
      totalProducts,
      recentOrders: latestOrders,
      topProducts,
      salesTrend
    };

    const responseData = {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        totalAdmins
      },
      recentStats: {
        newUsers: recentUsers,
        newOrders: recentOrders,
        recentRevenue
      },
      charts: {
        salesTrend: [],
        topProducts
      },
      recentActivity: {
        latestOrders
      }
    };
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

export const getSalesAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;

    // Apply data filtering for role-based access
    const orderFilter = req.dataFilter?.getFilter('Order') || {};

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate as string);
    }

    // Overall sales metrics with filtering
    const salesMetrics = await Order.aggregate([
      { $match: { ...orderFilter, ...dateFilter, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      }
    ]);

    // Sales by period
    let groupBy: any;
    switch (period) {
      case 'hourly':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
        break;
      case 'weekly':
        groupBy = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'monthly':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default: // daily
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }

    const salesByPeriod = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: groupBy,
          sales: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]);

    // Top selling products
    const topSellingProducts = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $project: {
          name: { $arrayElemAt: ['$productInfo.name', 0] },
          totalQuantity: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    // Sales by category
    const salesByCategory = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'productInfo.category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $group: {
          _id: { $arrayElemAt: ['$categoryInfo.name', 0] },
          totalSales: { $sum: '$items.total' },
          totalQuantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    const analytics: SalesAnalytics = {
      totalSales: salesMetrics[0]?.totalSales || 0,
      totalOrders: salesMetrics[0]?.totalOrders || 0,
      averageOrderValue: salesMetrics[0]?.averageOrderValue || 0,
      salesByPeriod,
      topSellingProducts,
      salesByCategory
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sales analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getUserAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate as string);
    }

    const totalUsers = await User.countDocuments(dateFilter);
    const activeUsers = await User.countDocuments({ ...dateFilter, isActive: true });
    const newUsers = await User.countDocuments({
      createdAt: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    });

    // User growth trend
    const userGrowth = await User.aggregate([
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

    // Users by location (based on addresses)
    const usersByLocation = await User.aggregate([
      { $match: dateFilter },
      { $unwind: '$addresses' },
      {
        $group: {
          _id: '$addresses.state',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // User activity (users with orders)
    const userActivity = await User.aggregate([
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
          orderCount: { $size: '$orders' },
          totalSpent: { $sum: '$orders.total' },
          lastOrderDate: { $max: '$orders.createdAt' }
        }
      },
      { $match: { orderCount: { $gt: 0 } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    const analytics: UserAnalytics = {
      totalUsers,
      activeUsers,
      newUsers,
      userGrowth,
      usersByLocation,
      userActivity
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getProductAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    // Apply data filtering for role-based access
    const productFilter = req.dataFilter?.getFilter('Product') || {};
    const orderFilter = req.dataFilter?.getFilter('Order') || {};

    const totalProducts = await Product.countDocuments(productFilter);
    const activeProducts = await Product.countDocuments({ ...productFilter, isActive: true });
    const featuredProducts = await Product.countDocuments({ ...productFilter, isFeatured: true });
    const outOfStock = await Product.countDocuments({ ...productFilter, stock: 0 });
    const lowStock = await Product.countDocuments({ ...productFilter, stock: { $lte: 10, $gt: 0 } });

    // Product performance with filtering
    const productPerformance = await Order.aggregate([
      { $match: { ...orderFilter, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $project: {
          name: { $arrayElemAt: ['$productInfo.name', 0] },
          price: { $arrayElemAt: ['$productInfo.price', 0] },
          stock: { $arrayElemAt: ['$productInfo.stock', 0] },
          totalSold: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 20 }
    ]);

    // Category distribution
    const categoryDistribution = await Product.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $group: {
          _id: { $arrayElemAt: ['$categoryInfo.name', 0] },
          count: { $sum: 1 },
          averagePrice: { $avg: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalProducts,
          activeProducts,
          featuredProducts,
          outOfStock,
          lowStock
        },
        productPerformance,
        categoryDistribution
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getRevenueAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { period = 'monthly' } = req.query;

    let groupBy: any;
    switch (period) {
      case 'daily':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'weekly':
        groupBy = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'yearly':
        groupBy = {
          year: { $year: '$createdAt' }
        };
        break;
      default: // monthly
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
    }

    const revenueData = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, paymentStatus: 'paid' } },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Revenue by payment method
    const revenueByPaymentMethod = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, paymentStatus: 'paid' } },
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        revenueData,
        revenueByPaymentMethod
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getTrafficAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    // This would typically integrate with analytics services like Google Analytics
    // For now, we'll provide basic user activity data
    
    const dailyActiveUsers = await User.aggregate([
      {
        $match: {
          lastLogin: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$lastLogin' },
            month: { $month: '$lastLogin' },
            day: { $dayOfMonth: '$lastLogin' }
          },
          activeUsers: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Page views simulation (would come from actual analytics)
    const pageViews = {
      totalViews: 125000,
      uniqueVisitors: 45000,
      bounceRate: 35.5,
      averageSessionDuration: '2m 45s'
    };

    res.json({
      success: true,
      data: {
        dailyActiveUsers,
        pageViews
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching traffic analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};