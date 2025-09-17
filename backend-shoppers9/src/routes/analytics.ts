import express from 'express';
import {
  getDashboard,
  getRevenueReport,
  getCustomerReport,
  getConversionReport,
  trackEvent,
  getSalesAnalytics,
  getCustomerAnalytics,
  getProductAnalytics,
  getConversionTracking,
  generateReport,
  updateCustomerAnalytics,
  generateDailyAnalytics,
  getAnalyticsSummary,
  getRealtimeAnalytics,
  getGeographicAnalytics,
  getDeviceAnalytics,
  getHourlyTrends,
  getCohortAnalysis,
  getPredictiveInsights
} from '../controllers/analyticsController';
import { authenticateToken, requireVerification, authenticateUserOrAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const trackEventSchema = Joi.object({
  sessionId: Joi.string().required(),
  eventType: Joi.string().valid(
    'page_view',
    'product_view',
    'add_to_cart',
    'remove_from_cart',
    'add_to_wishlist',
    'checkout_start',
    'payment_info',
    'purchase',
    'search',
    'category_view',
    'coupon_apply',
    'signup',
    'login'
  ).required(),
  data: Joi.object().optional(),
  value: Joi.number().optional(),
  productId: Joi.string().optional(),
  categoryId: Joi.string().optional(),
  orderId: Joi.string().optional(),
  source: Joi.string().valid('direct', 'search', 'social', 'email', 'referral', 'paid').optional(),
  medium: Joi.string().optional(),
  campaign: Joi.string().optional(),
  device: Joi.string().valid('desktop', 'mobile', 'tablet').optional(),
  browser: Joi.string().optional(),
  os: Joi.string().optional(),
  country: Joi.string().optional(),
  city: Joi.string().optional()
});

const generateReportSchema = Joi.object({
  reportType: Joi.string().valid('revenue', 'customer', 'conversion').required(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  format: Joi.string().valid('json', 'csv').default('json')
});

const generateDailyAnalyticsSchema = Joi.object({
  date: Joi.date().optional()
});

// Public routes (for event tracking)

/**
 * @route POST /api/analytics/track
 * @desc Track user event
 * @access Public (can be used without authentication for anonymous tracking)
 */
router.post(
  '/track',
  validateRequest(trackEventSchema),
  trackEvent
);

/**
 * @route GET /api/analytics/realtime
 * @desc Get real-time analytics
 * @access Private (Admin)
 */
router.get(
  '/realtime',
  authenticateUserOrAdmin,
  getRealtimeAnalytics
);

/**
 * @route GET /api/analytics/geographic
 * @desc Get geographic analytics
 * @access Private (Admin)
 */
router.get(
  '/geographic',
  authenticateUserOrAdmin,
  getGeographicAnalytics
);

/**
 * @route GET /api/analytics/devices
 * @desc Get device analytics
 * @access Private (Admin)
 */
router.get(
  '/devices',
  authenticateUserOrAdmin,
  getDeviceAnalytics
);

/**
 * @route GET /api/analytics/hourly-trends
 * @desc Get hourly trends
 * @access Private (Admin)
 */
router.get(
  '/hourly-trends',
  authenticateUserOrAdmin,
  getHourlyTrends
);

/**
 * @route GET /api/analytics/cohort-analysis
 * @desc Get cohort analysis
 * @access Private (Admin)
 */
router.get(
  '/cohort-analysis',
  authenticateUserOrAdmin,
  getCohortAnalysis
);

/**
 * @route GET /api/analytics/predictive-insights
 * @desc Get predictive insights
 * @access Private (Admin)
 */
router.get(
  '/predictive-insights',
  authenticateUserOrAdmin,
  getPredictiveInsights
);

// Protected routes (require authentication)

/**
 * @route GET /api/analytics/dashboard
 * @desc Get analytics dashboard
 * @access Private (Admin)
 */
router.get(
  '/dashboard',
  authenticateUserOrAdmin,
  getDashboard
);

/**
 * @route GET /api/analytics/summary
 * @desc Get analytics summary
 * @access Private (Admin)
 */
router.get(
  '/summary',
  authenticateUserOrAdmin,
  getAnalyticsSummary
);

/**
 * @route GET /api/analytics/reports/revenue
 * @desc Get revenue report
 * @access Private (Admin)
 */
router.get(
  '/reports/revenue',
  authenticateUserOrAdmin,
  getRevenueReport
);

/**
 * @route GET /api/analytics/reports/customer
 * @desc Get customer report
 * @access Private (Admin)
 */
router.get(
  '/reports/customer',
  authenticateUserOrAdmin,
  getCustomerReport
);

/**
 * @route GET /api/analytics/reports/conversion
 * @desc Get conversion report
 * @access Private (Admin)
 */
router.get(
  '/reports/conversion',
  authenticateUserOrAdmin,
  getConversionReport
);

/**
 * @route POST /api/analytics/reports/generate
 * @desc Generate custom analytics report
 * @access Private (Admin)
 */
router.post(
  '/reports/generate',
  authenticateUserOrAdmin,
  validateRequest(generateReportSchema),
  generateReport
);

/**
 * @route GET /api/analytics/sales
 * @desc Get sales analytics data
 * @access Private (Admin)
 */
router.get(
  '/sales',
  authenticateUserOrAdmin,
  getSalesAnalytics
);

/**
 * @route GET /api/analytics/customers
 * @desc Get customer analytics data
 * @access Private (Admin)
 */
router.get(
  '/customers',
  authenticateUserOrAdmin,
  getCustomerAnalytics
);

/**
 * @route GET /api/analytics/products
 * @desc Get product analytics data
 * @access Private (Admin)
 */
router.get(
  '/products',
  authenticateUserOrAdmin,
  getProductAnalytics
);

/**
 * @route GET /api/analytics/conversions
 * @desc Get conversion tracking data
 * @access Private (Admin)
 */
router.get(
  '/conversions',
  authenticateUserOrAdmin,
  getConversionTracking
);

/**
 * @route PUT /api/analytics/customers/:customerId
 * @desc Update customer analytics
 * @access Private (Admin)
 */
router.put(
  '/customers/:customerId',
  authenticateUserOrAdmin,
  updateCustomerAnalytics
);

/**
 * @route POST /api/analytics/generate-daily
 * @desc Generate daily analytics
 * @access Private (Admin)
 */
router.post(
  '/generate-daily',
  authenticateUserOrAdmin,
  validateRequest(generateDailyAnalyticsSchema),
  generateDailyAnalytics
);

// User-specific analytics routes

/**
 * @route GET /api/analytics/my-activity
 * @desc Get user's own activity analytics
 * @access Private (User)
 */
router.get(
  '/my-activity',
  authenticateToken,
  requireVerification,
  async (req, res, next): Promise<void> => {
    try {
      const customerId = (req as any).user?.userId || (req as any).user?.id;
      
      if (!customerId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      // Get user's conversion tracking data
      const { ConversionTracking, CustomerAnalytics } = require('../models/Analytics');
      
      const userActivity = await ConversionTracking.find({
        customerId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }).sort({ createdAt: -1 }).limit(100);

      // Get user's analytics summary
      const userAnalytics = await CustomerAnalytics.findOne({
        customerId
      });

      res.json({
        success: true,
        message: 'User activity retrieved successfully',
        data: {
          recentActivity: userActivity,
          analytics: userAnalytics,
          summary: {
            totalSessions: userActivity.length,
            totalEvents: userActivity.reduce((sum: number, session: any) => sum + session.events.length, 0),
            conversionSessions: userActivity.filter((session: any) => session.converted).length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/analytics/my-insights
 * @desc Get personalized insights for user
 * @access Private (User)
 */
router.get(
  '/my-insights',
  authenticateToken,
  requireVerification,
  async (req, res, next): Promise<void> => {
    try {
      const customerId = (req as any).user?.userId || (req as any).user?.id;
      
      if (!customerId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { CustomerAnalytics } = require('../models/Analytics');
      
      const userAnalytics = await CustomerAnalytics.findOne({
        customerId
      });

      if (!userAnalytics) {
        res.json({
          success: true,
          message: 'No analytics data available yet',
          data: {
            insights: [],
            recommendations: [
              'Complete your first purchase to unlock personalized insights',
              'Add items to your wishlist to get better recommendations'
            ]
          }
        });
        return;
      }

      const insights = [];
      const recommendations = [];

      // Generate insights based on user data
      if (userAnalytics.totalOrders > 0) {
        insights.push(`You've made ${userAnalytics.totalOrders} orders with us`);
        insights.push(`Your average order value is ₹${userAnalytics.averageOrderValue.toFixed(2)}`);
        
        if (userAnalytics.customerSegment === 'vip') {
          insights.push('You are one of our VIP customers!');
          recommendations.push('Enjoy exclusive VIP discounts and early access to sales');
        }
        
        if (userAnalytics.daysSinceLastOrder > 30) {
          recommendations.push('We miss you! Check out our latest products');
        }
      }

      if (userAnalytics.favoriteCategories.length > 0) {
        const topCategory = userAnalytics.favoriteCategories[0];
        insights.push(`Your favorite category is ${topCategory.categoryName}`);
        recommendations.push(`Discover more products in ${topCategory.categoryName}`);
      }

      res.json({
        success: true,
        message: 'User insights retrieved successfully',
        data: {
          insights,
          recommendations,
          segment: userAnalytics.customerSegment,
          lifetimeValue: userAnalytics.customerLifetimeValue
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;