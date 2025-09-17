import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { analyticsService } from '../services/analyticsService';
import {
  SalesAnalytics,
  CustomerAnalytics,
  ConversionTracking,
  ProductAnalytics,
  MarketingAnalytics
} from '../models/Analytics';

/**
 * Get analytics dashboard
 */
export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      startDate,
      endDate,
      period = 'daily'
    } = req.query;

    const filters: any = { period };
    
    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }
    
    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    const dashboard = await analyticsService.getDashboard(filters);

    res.json({
      success: true,
      message: 'Analytics dashboard retrieved successfully',
      data: dashboard
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue report
 */
export const getRevenueReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      startDate,
      endDate,
      period = 'monthly',
      categoryId
    } = req.query;

    const filters: any = { period };
    
    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }
    
    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }
    
    if (categoryId) {
      filters.categoryId = categoryId as string;
    }

    const report = await analyticsService.getRevenueReport(filters);

    res.json({
      success: true,
      message: 'Revenue report generated successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer report
 */
export const getCustomerReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      startDate,
      endDate,
      segment
    } = req.query;

    const filters: any = {};
    
    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }
    
    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    const report = await analyticsService.getCustomerReport(filters);

    res.json({
      success: true,
      message: 'Customer report generated successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get conversion report
 */
export const getConversionReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      startDate,
      endDate,
      source,
      device
    } = req.query;

    const filters: any = {};
    
    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }
    
    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }
    
    if (source) {
      filters.source = source as string;
    }
    
    if (device) {
      filters.device = device as string;
    }

    const report = await analyticsService.getConversionReport(filters);

    res.json({
      success: true,
      message: 'Conversion report generated successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Track user event
 */
export const trackEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      sessionId,
      eventType,
      data,
      value,
      productId,
      categoryId,
      orderId,
      source,
      medium,
      campaign,
      device,
      browser,
      os,
      country,
      city
    } = req.body;

    if (!sessionId || !eventType) {
      return next(new AppError('Session ID and event type are required', 400));
    }

    const customerId = (req as AuthenticatedRequest).user?.userId || (req as AuthenticatedRequest).user?.id;

    await analyticsService.trackEvent({
      sessionId,
      customerId,
      eventType,
      data,
      value,
      productId,
      categoryId,
      orderId,
      source,
      medium,
      campaign,
      device,
      browser,
      os,
      country,
      city
    });

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sales analytics
 */
export const getSalesAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      startDate,
      endDate,
      period = 'daily',
      page = 1,
      limit = 30
    } = req.query;

    const query: any = {};
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }
    
    if (period) {
      query.period = period;
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const [analytics, total] = await Promise.all([
      SalesAnalytics.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      SalesAnalytics.countDocuments(query)
    ]);

    res.json({
      success: true,
      message: 'Sales analytics retrieved successfully',
      data: {
        analytics,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer analytics
 */
export const getCustomerAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      segment,
      page = 1,
      limit = 50,
      sortBy = 'customerLifetimeValue',
      sortOrder = 'desc'
    } = req.query;

    const query: any = {};
    
    if (segment) {
      query.customerSegment = segment;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
    
    const [analytics, total] = await Promise.all([
      CustomerAnalytics.find(query)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('customerId', 'name email phone'),
      CustomerAnalytics.countDocuments(query)
    ]);

    res.json({
      success: true,
      message: 'Customer analytics retrieved successfully',
      data: {
        analytics,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product analytics
 */
export const getProductAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      productId,
      startDate,
      endDate,
      period = 'daily',
      page = 1,
      limit = 50
    } = req.query;

    const query: any = {};
    
    if (productId) {
      query.productId = productId;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }
    
    if (period) {
      query.period = period;
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const [analytics, total] = await Promise.all([
      ProductAnalytics.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('productId', 'name category'),
      ProductAnalytics.countDocuments(query)
    ]);

    res.json({
      success: true,
      message: 'Product analytics retrieved successfully',
      data: {
        analytics,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get conversion tracking data
 */
export const getConversionTracking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      sessionId,
      customerId,
      source,
      device,
      converted,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const query: any = {};
    
    if (sessionId) {
      query.sessionId = sessionId;
    }
    
    if (customerId) {
      query.customerId = customerId;
    }
    
    if (source) {
      query.source = source;
    }
    
    if (device) {
      query.device = device;
    }
    
    if (converted !== undefined) {
      query.converted = converted === 'true';
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const [tracking, total] = await Promise.all([
      ConversionTracking.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ConversionTracking.countDocuments(query)
    ]);

    res.json({
      success: true,
      message: 'Conversion tracking data retrieved successfully',
      data: {
        tracking,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate analytics report
 */
export const generateReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      reportType,
      startDate,
      endDate,
      format = 'json'
    } = req.body;

    if (!reportType) {
      return next(new AppError('Report type is required', 400));
    }

    const filters: any = {};
    
    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    
    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    let report;
    
    switch (reportType) {
      case 'revenue':
        report = await analyticsService.getRevenueReport(filters);
        break;
      case 'customer':
        report = await analyticsService.getCustomerReport(filters);
        break;
      case 'conversion':
        report = await analyticsService.getConversionReport(filters);
        break;
      default:
        return next(new AppError('Invalid report type', 400));
    }

    if (format === 'csv') {
      // Convert to CSV format
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}_report.csv"`);
      // CSV conversion logic would go here
      res.send('CSV data would be here');
    } else {
      res.json({
        success: true,
        message: `${reportType} report generated successfully`,
        data: report
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update customer analytics
 */
export const updateCustomerAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return next(new AppError('Customer ID is required', 400));
    }

    await analyticsService.updateCustomerAnalytics(customerId);

    res.json({
      success: true,
      message: 'Customer analytics updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate daily analytics
 */
export const generateDailyAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.body;
    
    const targetDate = date ? new Date(date) : new Date();
    
    await analyticsService.generateDailySalesAnalytics(targetDate);

    res.json({
      success: true,
      message: 'Daily analytics generated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get real-time analytics
 */
export const getRealtimeAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const realtimeData = await analyticsService.getRealtimeAnalytics();

    res.json({
      success: true,
      message: 'Real-time analytics retrieved successfully',
      data: realtimeData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get geographic analytics
 */
export const getGeographicAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const geoData = await analyticsService.getGeographicAnalytics(start, end);

    res.json({
      success: true,
      message: 'Geographic analytics retrieved successfully',
      data: geoData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get device analytics
 */
export const getDeviceAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const deviceData = await analyticsService.getDeviceAnalytics(start, end);

    res.json({
      success: true,
      message: 'Device analytics retrieved successfully',
      data: deviceData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get hourly trends
 */
export const getHourlyTrends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const hourlyData = await analyticsService.getHourlyTrends(start, end);

    res.json({
      success: true,
      message: 'Hourly trends retrieved successfully',
      data: hourlyData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get cohort analysis
 */
export const getCohortAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const cohortData = await analyticsService.getCohortAnalysis(start, end);

    res.json({
      success: true,
      message: 'Cohort analysis retrieved successfully',
      data: cohortData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get predictive insights
 */
export const getPredictiveInsights = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const insights = await analyticsService.getPredictiveInsights(start, end);

    res.json({
      success: true,
      message: 'Predictive insights retrieved successfully',
      data: insights
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get analytics summary
 */
export const getAnalyticsSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      period = '30d'
    } = req.query;

    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;
    else if (period === '1y') days = 365;

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const [salesCount, customerCount, conversionCount, productCount] = await Promise.all([
      SalesAnalytics.countDocuments({
        date: { $gte: startDate, $lte: endDate }
      }),
      CustomerAnalytics.countDocuments(),
      ConversionTracking.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      ProductAnalytics.countDocuments({
        date: { $gte: startDate, $lte: endDate }
      })
    ]);

    res.json({
      success: true,
      message: 'Analytics summary retrieved successfully',
      data: {
        period,
        summary: {
          salesRecords: salesCount,
          customerProfiles: customerCount,
          conversionSessions: conversionCount,
          productAnalytics: productCount
        },
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      }
    });
  } catch (error) {
    next(error);
  }
};