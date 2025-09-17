import {
  SalesAnalytics,
  CustomerAnalytics,
  ConversionTracking,
  ProductAnalytics,
  MarketingAnalytics
} from '../models/Analytics';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import {
  AnalyticsDashboard,
  RevenueReport,
  CustomerReport,
  ConversionReport,
  ISalesAnalytics,
  ICustomerAnalytics,
  IConversionTracking,
  IProductAnalytics
} from '../types';
import mongoose from 'mongoose';

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  categoryId?: string;
  productId?: string;
  customerId?: string;
  source?: string;
  device?: string;
}

export interface TrackingEvent {
  sessionId: string;
  customerId?: string;
  eventType: string;
  data?: any;
  value?: number;
  productId?: string;
  categoryId?: string;
  orderId?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  device?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
}

class AnalyticsService {
  /**
   * Get comprehensive analytics dashboard
   */
  async getDashboard(filters: AnalyticsFilters = {}): Promise<AnalyticsDashboard> {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      period = 'daily'
    } = filters;

    try {
      const [overview, salesTrends, topProducts, customerSegments, conversionFunnel, trafficSources] = await Promise.all([
        this.getOverviewMetrics(startDate, endDate),
        this.getSalesTrends(startDate, endDate, period),
        this.getTopProducts(startDate, endDate, 10),
        this.getCustomerSegments(),
        this.getConversionFunnel(startDate, endDate),
        this.getTrafficSources(startDate, endDate)
      ]);

      return {
        overview,
        salesTrends,
        topProducts,
        customerSegments,
        conversionFunnel,
        trafficSources
      };
    } catch (error) {
      console.error('Error getting analytics dashboard:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive dashboard analytics
   */
  async getDashboardAnalytics(startDate: Date, endDate: Date): Promise<any> {
    try {
      const [salesData, customerData, conversionData, trafficData, realtimeData] = await Promise.all([
        this.getSalesOverview(startDate, endDate),
        this.getCustomerOverview(startDate, endDate),
        this.getConversionOverview(startDate, endDate),
        this.getTrafficAnalytics(startDate, endDate),
        this.getRealtimeAnalytics()
      ]);

      return {
        overview: {
          totalRevenue: salesData.totalRevenue,
          totalOrders: salesData.totalOrders,
          totalCustomers: customerData.totalCustomers,
          totalVisitors: trafficData.totalVisitors,
          conversionRate: conversionData.conversionRate,
          averageOrderValue: salesData.averageOrderValue,
          growthRate: salesData.growthRate,
          bounceRate: trafficData.bounceRate,
          sessionDuration: trafficData.avgSessionDuration,
          pageViewsPerSession: trafficData.pageViewsPerSession,
          newVsReturning: customerData.newVsReturning,
          topTrafficSource: trafficData.topSource,
          mobileTrafficPercentage: trafficData.mobilePercentage
        },
        salesTrends: salesData.trends,
        topProducts: await this.getTopProducts(10),
        customerSegments: customerData.segments,
        conversionFunnel: conversionData.funnel,
        trafficSources: trafficData.sources,
        realtimeMetrics: realtimeData,
        geographicData: await this.getGeographicAnalytics(startDate, endDate),
        deviceAnalytics: await this.getDeviceAnalytics(startDate, endDate),
        hourlyTrends: await this.getHourlyTrends(startDate, endDate),
        cohortAnalysis: await this.getCohortAnalysis(startDate, endDate),
        predictiveInsights: await this.getPredictiveInsights(startDate, endDate)
      };
    } catch (error) {
      console.error('Error getting dashboard analytics:', error);
      throw error;
    }
  }

  /**
   * Get overview metrics
   */
  async getOverviewMetrics(startDate: Date, endDate: Date) {
    try {
      const [currentPeriod, previousPeriod] = await Promise.all([
        this.calculatePeriodMetrics(startDate, endDate),
        this.calculatePeriodMetrics(
          new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
          startDate
        )
      ]);

      const growthRate = previousPeriod.totalRevenue > 0 
        ? ((currentPeriod.totalRevenue - previousPeriod.totalRevenue) / previousPeriod.totalRevenue) * 100
        : 0;

      return {
        totalRevenue: currentPeriod.totalRevenue,
        totalOrders: currentPeriod.totalOrders,
        totalCustomers: currentPeriod.totalCustomers,
        conversionRate: currentPeriod.conversionRate,
        averageOrderValue: currentPeriod.averageOrderValue,
        growthRate: Math.round(growthRate * 100) / 100
      };
    } catch (error) {
      console.error('Error getting overview metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate metrics for a specific period
   */
  private async calculatePeriodMetrics(startDate: Date, endDate: Date) {
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      orderStatus: { $ne: 'CANCELLED' }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + (order.finalAmount || order.totalAmount), 0);
    const totalOrders = orders.length;
    const uniqueCustomers = new Set(orders.map(order => order.userId.toString())).size;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate conversion rate (simplified)
    const sessions = await ConversionTracking.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    const conversions = await ConversionTracking.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      converted: true
    });
    const conversionRate = sessions > 0 ? (conversions / sessions) * 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      totalCustomers: uniqueCustomers,
      averageOrderValue,
      conversionRate
    };
  }

  /**
   * Get sales trends over time
   */
  async getSalesTrends(startDate: Date, endDate: Date, period: string) {
    try {
      const groupBy = this.getGroupByPeriod(period);
      
      const trends = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            orderStatus: { $ne: 'CANCELLED' }
          }
        },
        {
          $group: {
            _id: groupBy,
            revenue: { $sum: { $ifNull: ['$finalAmount', '$totalAmount'] } },
            orders: { $sum: 1 },
            customers: { $addToSet: '$userId' }
          }
        },
        {
          $project: {
            date: '$_id',
            revenue: '$revenue',
            orders: '$orders',
            customers: { $size: '$customers' }
          }
        },
        {
          $sort: { date: 1 }
        }
      ]);

      return trends.map(trend => ({
        date: this.formatDate(trend.date, period),
        revenue: trend.revenue,
        orders: trend.orders,
        customers: trend.customers
      }));
    } catch (error) {
      console.error('Error getting sales trends:', error);
      throw error;
    }
  }

  /**
   * Get top performing products
   */
  async getTopProducts(startDate: Date, endDate: Date, limit: number = 10) {
    try {
      const topProducts = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            orderStatus: { $ne: 'CANCELLED' }
          }
        },
        {
          $unwind: '$items'
        },
        {
          $group: {
            _id: '$items.product',
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            orders: { $sum: 1 },
            quantity: { $sum: '$items.quantity' }
          }
        },
        {
          $sort: { revenue: -1 }
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $unwind: '$product'
        },
        {
          $project: {
            productId: '$_id',
            productName: '$product.name',
            revenue: '$revenue',
            orders: '$orders',
            conversionRate: { $literal: 0 } // Would need view data to calculate
          }
        } as any
      ]);

      return topProducts;
    } catch (error) {
      console.error('Error getting top products:', error);
      throw error;
    }
  }

  /**
   * Get customer segments
   */
  async getCustomerSegments() {
    try {
      const segments = await CustomerAnalytics.aggregate([
        {
          $group: {
            _id: '$customerSegment',
            count: { $sum: 1 },
            totalValue: { $sum: '$customerLifetimeValue' },
            avgValue: { $avg: '$customerLifetimeValue' }
          }
        },
        {
          $project: {
            segment: '$_id',
            count: '$count',
            percentage: { $literal: 0 }, // Will calculate after getting total
            averageValue: '$avgValue'
          }
        }
      ]);

      const totalCustomers = segments.reduce((sum, segment) => sum + segment.count, 0);
      
      return segments.map(segment => ({
        ...segment,
        percentage: totalCustomers > 0 ? Math.round((segment.count / totalCustomers) * 100) : 0
      }));
    } catch (error) {
      console.error('Error getting customer segments:', error);
      return [];
    }
  }

  /**
   * Get conversion funnel analysis
   */
  async getConversionFunnel(startDate: Date, endDate: Date) {
    try {
      const funnelData = await ConversionTracking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $unwind: '$events'
        },
        {
          $group: {
            _id: '$events.eventType',
            count: { $sum: 1 },
            uniqueSessions: { $addToSet: '$sessionId' }
          }
        },
        {
          $project: {
            stage: '$_id',
            count: { $size: '$uniqueSessions' }
          }
        }
      ]);

      // Define funnel order
      const funnelOrder = ['page_view', 'product_view', 'add_to_cart', 'checkout_start', 'purchase'];
      const orderedFunnel = funnelOrder.map(stage => {
        const data = funnelData.find(item => item.stage === stage);
        return {
          stage: this.formatStageName(stage),
          count: data ? data.count : 0,
          conversionRate: 0 // Will calculate below
        };
      });

      // Calculate conversion rates
      for (let i = 0; i < orderedFunnel.length; i++) {
        if (i === 0) {
          orderedFunnel[i].conversionRate = 100; // First stage is 100%
        } else {
          const previousCount = orderedFunnel[i - 1].count;
          orderedFunnel[i].conversionRate = previousCount > 0 
            ? Math.round((orderedFunnel[i].count / previousCount) * 100)
            : 0;
        }
      }

      return orderedFunnel;
    } catch (error) {
      console.error('Error getting conversion funnel:', error);
      return [];
    }
  }

  /**
   * Get traffic sources
   */
  async getTrafficSources(startDate: Date, endDate: Date) {
    try {
      const sources = await ConversionTracking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$source',
            visitors: { $sum: 1 },
            conversions: {
              $sum: { $cond: [{ $eq: ['$converted', true] }, 1, 0] }
            },
            revenue: { $sum: '$conversionValue' }
          }
        },
        {
          $project: {
            source: '$_id',
            visitors: '$visitors',
            conversions: '$conversions',
            revenue: '$revenue'
          }
        },
        {
          $sort: { visitors: -1 }
        }
      ]);

      return sources;
    } catch (error) {
      console.error('Error getting traffic sources:', error);
      return [];
    }
  }

  /**
   * Generate revenue report
   */
  async getRevenueReport(filters: AnalyticsFilters): Promise<RevenueReport> {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      period = 'monthly'
    } = filters;

    try {
      const [currentMetrics, previousMetrics, categoryBreakdown, paymentBreakdown, trends] = await Promise.all([
        this.calculatePeriodMetrics(startDate, endDate),
        this.calculatePeriodMetrics(
          new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
          startDate
        ),
        this.getRevenueByCategory(startDate, endDate),
        this.getRevenueByPaymentMethod(startDate, endDate),
        this.getSalesTrends(startDate, endDate, period)
      ]);

      const growthRate = previousMetrics.totalRevenue > 0 
        ? ((currentMetrics.totalRevenue - previousMetrics.totalRevenue) / previousMetrics.totalRevenue) * 100
        : 0;

      return {
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        totalRevenue: currentMetrics.totalRevenue,
        totalOrders: currentMetrics.totalOrders,
        averageOrderValue: currentMetrics.averageOrderValue,
        growthRate: Math.round(growthRate * 100) / 100,
        breakdown: {
          byCategory: categoryBreakdown,
          byPaymentMethod: paymentBreakdown,
          byRegion: [] // Would need address data
        },
        trends
      };
    } catch (error) {
      console.error('Error generating revenue report:', error);
      throw error;
    }
  }

  /**
   * Generate customer report
   */
  async getCustomerReport(filters: AnalyticsFilters): Promise<CustomerReport> {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date()
    } = filters;

    try {
      const [customerMetrics, segments, topCustomers] = await Promise.all([
        this.getCustomerMetrics(startDate, endDate),
        this.getDetailedCustomerSegments(),
        this.getTopCustomers(10)
      ]);

      return {
        ...customerMetrics,
        segments,
        cohortAnalysis: [], // Would need more complex analysis
        topCustomers
      };
    } catch (error) {
      console.error('Error generating customer report:', error);
      throw error;
    }
  }

  /**
   * Generate conversion report
   */
  async getConversionReport(filters: AnalyticsFilters): Promise<ConversionReport> {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date()
    } = filters;

    try {
      const [overallRate, funnelStages, trafficSources, deviceBreakdown] = await Promise.all([
        this.getOverallConversionRate(startDate, endDate),
        this.getDetailedConversionFunnel(startDate, endDate),
        this.getConversionBySource(startDate, endDate),
        this.getConversionByDevice(startDate, endDate)
      ]);

      return {
        overallConversionRate: overallRate,
        funnelStages,
        trafficSources,
        deviceBreakdown,
        pagePerformance: [] // Would need page-specific tracking
      };
    } catch (error) {
      console.error('Error generating conversion report:', error);
      throw error;
    }
  }

  /**
   * Track user event
   */
  async trackEvent(event: TrackingEvent): Promise<void> {
    try {
      let session = await ConversionTracking.findOne({ sessionId: event.sessionId });
      
      if (!session) {
        session = new ConversionTracking({
          sessionId: event.sessionId,
          customerId: event.customerId,
          events: [],
          source: event.source || 'direct',
          medium: event.medium,
          campaign: event.campaign,
          device: event.device || 'desktop',
          browser: event.browser,
          os: event.os,
          country: event.country,
          city: event.city,
          converted: false,
          conversionValue: 0,
          funnelStage: 'awareness',
          pageViews: 0,
          bounceRate: 0
        });
      }

      // Add event
      session.events.push({
        eventType: event.eventType as any,
        timestamp: new Date(),
        data: event.data,
        value: event.value,
        productId: event.productId ? new mongoose.Types.ObjectId(event.productId) : undefined,
        categoryId: event.categoryId ? new mongoose.Types.ObjectId(event.categoryId) : undefined,
        orderId: event.orderId ? new mongoose.Types.ObjectId(event.orderId) : undefined
      });

      // Update session metrics
      if (event.eventType === 'page_view') {
        session.pageViews += 1;
      }

      if (event.eventType === 'purchase') {
        session.converted = true;
        session.conversionValue += event.value || 0;
        session.funnelStage = 'purchase';
      }

      // Update funnel stage
      session.funnelStage = this.determineFunnelStage(session.events);

      await session.save();
    } catch (error) {
      console.error('Error tracking event:', error);
      throw error;
    }
  }

  /**
   * Update customer analytics
   */
  async updateCustomerAnalytics(customerId: string): Promise<void> {
    try {
      const orders = await Order.find({ 
        userId: customerId,
        orderStatus: { $ne: 'CANCELLED' }
      }).sort({ createdAt: 1 });

      if (orders.length === 0) return;

      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + (order.finalAmount || order.totalAmount), 0);
      const averageOrderValue = totalSpent / totalOrders;
      const firstOrderDate = orders[0].createdAt;
      const lastOrderDate = orders[orders.length - 1].createdAt;
      const daysSinceLastOrder = Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate customer segment
      let customerSegment: 'new' | 'regular' | 'vip' | 'at_risk' | 'churned' = 'new';
      if (daysSinceLastOrder > 180) {
        customerSegment = 'churned';
      } else if (daysSinceLastOrder > 90) {
        customerSegment = 'at_risk';
      } else if (totalSpent > 10000 || totalOrders > 10) {
        customerSegment = 'vip';
      } else if (totalOrders > 1) {
        customerSegment = 'regular';
      }

      // Calculate purchase frequency (orders per month)
      const daysSinceFirst = Math.floor((Date.now() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24));
      const monthsSinceFirst = Math.max(1, daysSinceFirst / 30);
      const purchaseFrequency = totalOrders / monthsSinceFirst;

      await CustomerAnalytics.findOneAndUpdate(
        { customerId },
        {
          customerId,
          totalOrders,
          totalSpent,
          averageOrderValue,
          firstOrderDate,
          lastOrderDate,
          daysSinceLastOrder,
          customerLifetimeValue: totalSpent, // Simplified CLV
          customerSegment,
          purchaseFrequency,
          returnRate: 0, // Would need return data
          refundRate: 0, // Would need refund data
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error updating customer analytics:', error);
      throw error;
    }
  }

  /**
   * Generate daily sales analytics
   */
  async generateDailySalesAnalytics(date: Date = new Date()): Promise<void> {
    try {
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const orders = await Order.find({
        createdAt: { $gte: startOfDay, $lt: endOfDay },
        orderStatus: { $ne: 'CANCELLED' }
      }).populate('items.product');

      const totalRevenue = orders.reduce((sum, order) => sum + (order.finalAmount || order.totalAmount), 0);
      const totalOrders = orders.length;
      const uniqueCustomers = new Set(orders.map(order => order.userId.toString())).size;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate category breakdown
      const categoryMap = new Map();
      orders.forEach(order => {
        order.items.forEach((item: any) => {
          if (item.product && item.product.category) {
            const categoryId = item.product.category.toString();
            const existing = categoryMap.get(categoryId) || { revenue: 0, orders: 0, products: 0 };
            existing.revenue += item.price * item.quantity;
            existing.orders += 1;
            existing.products += item.quantity;
            categoryMap.set(categoryId, existing);
          }
        });
      });

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([categoryId, data]) => ({
        categoryId,
        categoryName: '', // Would need to populate
        revenue: data.revenue,
        orders: data.orders,
        products: data.products
      }));

      await SalesAnalytics.findOneAndUpdate(
        { date: startOfDay, period: 'daily' },
        {
          date: startOfDay,
          period: 'daily',
          totalRevenue,
          totalOrders,
          totalCustomers: uniqueCustomers,
          newCustomers: 0, // Would need to calculate
          returningCustomers: 0, // Would need to calculate
          averageOrderValue,
          totalProducts: orders.reduce((sum, order) => sum + order.items.length, 0),
          conversionRate: 0, // Would need session data
          categoryBreakdown,
          topProducts: [],
          paymentMethodBreakdown: [],
          refunds: { count: 0, amount: 0 },
          cancellations: { count: 0, amount: 0 }
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error generating daily sales analytics:', error);
      throw error;
    }
  }

  // Helper methods
  private getGroupByPeriod(period: string) {
    switch (period) {
      case 'daily':
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
      case 'weekly':
        return {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
      case 'monthly':
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
      case 'yearly':
        return {
          year: { $year: '$createdAt' }
        };
      default:
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }
  }

  private formatDate(dateObj: any, period: string): string {
    if (period === 'daily') {
      return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
    } else if (period === 'weekly') {
      return `${dateObj.year}-W${String(dateObj.week).padStart(2, '0')}`;
    } else if (period === 'monthly') {
      return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}`;
    } else {
      return `${dateObj.year}`;
    }
  }

  private formatStageName(stage: string): string {
    return stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private determineFunnelStage(events: any[]): 'awareness' | 'interest' | 'consideration' | 'purchase' | 'retention' {
    const eventTypes = events.map(e => e.eventType);
    
    if (eventTypes.includes('purchase')) return 'purchase';
    if (eventTypes.includes('checkout_start')) return 'consideration';
    if (eventTypes.includes('add_to_cart')) return 'interest';
    return 'awareness';
  }

  /**
   * Get sales overview
   */
  async getSalesOverview(startDate: Date, endDate: Date): Promise<any> {
    try {
      const orders = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate },
        orderStatus: { $ne: 'CANCELLED' }
      });

      const totalRevenue = orders.reduce((sum, order) => sum + (order.finalAmount || order.totalAmount), 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate growth rate
      const previousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
      const previousOrders = await Order.find({
        createdAt: { $gte: previousPeriodStart, $lt: startDate },
        orderStatus: { $ne: 'CANCELLED' }
      });
      const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.finalAmount || order.totalAmount), 0);
      const growthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      const trends = await this.getSalesTrends(startDate, endDate, 'daily');

      return {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        growthRate,
        trends
      };
    } catch (error) {
      console.error('Error getting sales overview:', error);
      return {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        growthRate: 0,
        trends: []
      };
    }
  }

  /**
   * Get customer overview
   */
  async getCustomerOverview(startDate: Date, endDate: Date): Promise<any> {
    try {
      const customers = await CustomerAnalytics.find({
        lastUpdated: { $gte: startDate, $lte: endDate }
      });

      const totalCustomers = customers.length;
      const newCustomers = customers.filter(c => c.firstOrderDate >= startDate && c.firstOrderDate <= endDate).length;
      const returningCustomers = totalCustomers - newCustomers;

      const segments = await this.getCustomerSegments();
      const newVsReturning = {
        new: newCustomers,
        returning: returningCustomers,
        newPercentage: totalCustomers > 0 ? Math.round((newCustomers / totalCustomers) * 100) : 0
      };

      return {
        totalCustomers,
        newCustomers,
        returningCustomers,
        segments,
        newVsReturning
      };
    } catch (error) {
      console.error('Error getting customer overview:', error);
      return {
        totalCustomers: 0,
        newCustomers: 0,
        returningCustomers: 0,
        segments: [],
        newVsReturning: { new: 0, returning: 0, newPercentage: 0 }
      };
    }
  }

  /**
   * Get conversion overview
   */
  async getConversionOverview(startDate: Date, endDate: Date): Promise<any> {
    try {
      const sessions = await ConversionTracking.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      });
      const conversions = await ConversionTracking.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        converted: true
      });
      const conversionRate = sessions > 0 ? (conversions / sessions) * 100 : 0;
      const funnel = await this.getConversionFunnel(startDate, endDate);

      return {
        conversionRate,
        funnel
      };
    } catch (error) {
      console.error('Error getting conversion overview:', error);
      return {
        conversionRate: 0,
        funnel: []
      };
    }
  }

  /**
   * Get traffic analytics
   */
  async getTrafficAnalytics(startDate: Date, endDate: Date): Promise<any> {
    try {
      const sessions = await ConversionTracking.find({
        createdAt: { $gte: startDate, $lte: endDate }
      });

      const totalVisitors = sessions.length;
      const totalPageViews = sessions.reduce((sum, session) => sum + session.pageViews, 0);
      const bounceRate = sessions.filter(session => session.pageViews === 1).length / totalVisitors;
      const avgSessionDuration = sessions.reduce((sum, session) => {
        const duration = session.events.length > 1 ? 
          (new Date(session.events[session.events.length - 1].timestamp).getTime() - 
           new Date(session.events[0].timestamp).getTime()) / 1000 : 0;
        return sum + duration;
      }, 0) / totalVisitors;

      const sourceAnalysis = await ConversionTracking.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$source', count: { $sum: 1 }, conversions: { $sum: { $cond: ['$converted', 1, 0] } } } },
        { $sort: { count: -1 } }
      ]);

      const deviceAnalysis = await ConversionTracking.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$device', count: { $sum: 1 } } }
      ]);

      const mobileCount = deviceAnalysis.find(d => d._id === 'mobile')?.count || 0;
      const mobilePercentage = (mobileCount / totalVisitors) * 100;

      return {
        totalVisitors,
        bounceRate: Math.round(bounceRate * 100),
        avgSessionDuration: Math.round(avgSessionDuration),
        pageViewsPerSession: Math.round(totalPageViews / totalVisitors),
        topSource: sourceAnalysis[0]?._id || 'direct',
        mobilePercentage: Math.round(mobilePercentage),
        sources: sourceAnalysis.map(source => ({
          source: source._id,
          visitors: source.count,
          conversions: source.conversions,
          conversionRate: Math.round((source.conversions / source.count) * 100)
        }))
      };
    } catch (error) {
      console.error('Error getting traffic analytics:', error);
      return {
        totalVisitors: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
        pageViewsPerSession: 0,
        topSource: 'direct',
        mobilePercentage: 0,
        sources: []
      };
    }
  }

  /**
   * Get real-time analytics
   */
  async getRealtimeAnalytics(): Promise<any> {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

      const [activeUsers, recentOrders, liveEvents] = await Promise.all([
        ConversionTracking.countDocuments({
          createdAt: { $gte: lastHour }
        }),
        SalesAnalytics.aggregate([
          { $match: { date: { $gte: last24Hours } } },
          { $group: { _id: null, totalOrders: { $sum: '$totalOrders' }, totalRevenue: { $sum: '$totalRevenue' } } }
        ]),
        ConversionTracking.aggregate([
          { $match: { createdAt: { $gte: lastHour } } },
          { $unwind: '$events' },
          { $match: { 'events.timestamp': { $gte: lastHour } } },
          { $group: { _id: '$events.eventType', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
      ]);

      return {
        activeUsers,
        ordersLast24h: recentOrders[0]?.totalOrders || 0,
        revenueLast24h: recentOrders[0]?.totalRevenue || 0,
        topEvents: liveEvents,
        timestamp: now
      };
    } catch (error) {
      console.error('Error getting realtime analytics:', error);
      return {
        activeUsers: 0,
        ordersLast24h: 0,
        revenueLast24h: 0,
        topEvents: [],
        timestamp: new Date()
      };
    }
  }

  /**
   * Get geographic analytics
   */
  async getGeographicAnalytics(startDate: Date, endDate: Date): Promise<any> {
    try {
      const geoData = await ConversionTracking.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: {
          _id: { country: '$country', city: '$city' },
          visitors: { $sum: 1 },
          conversions: { $sum: { $cond: ['$converted', 1, 0] } },
          revenue: { $sum: '$conversionValue' }
        }},
        { $sort: { visitors: -1 } },
        { $limit: 20 }
      ]);

      return geoData.map(item => ({
        country: item._id.country || 'Unknown',
        city: item._id.city || 'Unknown',
        visitors: item.visitors,
        conversions: item.conversions,
        revenue: item.revenue,
        conversionRate: Math.round((item.conversions / item.visitors) * 100)
      }));
    } catch (error) {
      console.error('Error getting geographic analytics:', error);
      return [];
    }
  }

  /**
   * Get device analytics
   */
  async getDeviceAnalytics(startDate: Date, endDate: Date): Promise<any> {
    try {
      const deviceData = await ConversionTracking.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: {
          _id: { device: '$device', browser: '$browser', os: '$os' },
          visitors: { $sum: 1 },
          conversions: { $sum: { $cond: ['$converted', 1, 0] } },
          revenue: { $sum: '$conversionValue' }
        }},
        { $sort: { visitors: -1 } }
      ]);

      return {
        byDevice: deviceData.reduce((acc, item) => {
          const device = item._id.device || 'Unknown';
          if (!acc[device]) acc[device] = { visitors: 0, conversions: 0, revenue: 0 };
          acc[device].visitors += item.visitors;
          acc[device].conversions += item.conversions;
          acc[device].revenue += item.revenue;
          return acc;
        }, {}),
        byBrowser: deviceData.reduce((acc, item) => {
          const browser = item._id.browser || 'Unknown';
          if (!acc[browser]) acc[browser] = { visitors: 0, conversions: 0, revenue: 0 };
          acc[browser].visitors += item.visitors;
          acc[browser].conversions += item.conversions;
          acc[browser].revenue += item.revenue;
          return acc;
        }, {}),
        byOS: deviceData.reduce((acc, item) => {
          const os = item._id.os || 'Unknown';
          if (!acc[os]) acc[os] = { visitors: 0, conversions: 0, revenue: 0 };
          acc[os].visitors += item.visitors;
          acc[os].conversions += item.conversions;
          acc[os].revenue += item.revenue;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting device analytics:', error);
      return { byDevice: {}, byBrowser: {}, byOS: {} };
    }
  }

  /**
   * Get hourly trends
   */
  async getHourlyTrends(startDate: Date, endDate: Date): Promise<any> {
    try {
      const hourlyData = await ConversionTracking.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: {
          _id: { $hour: '$createdAt' },
          visitors: { $sum: 1 },
          conversions: { $sum: { $cond: ['$converted', 1, 0] } }
        }},
        { $sort: { '_id': 1 } }
      ]);

      const hours = Array.from({ length: 24 }, (_, i) => {
        const hourData = hourlyData.find(h => h._id === i);
        return {
          hour: i,
          visitors: hourData?.visitors || 0,
          conversions: hourData?.conversions || 0,
          conversionRate: hourData ? Math.round((hourData.conversions / hourData.visitors) * 100) : 0
        };
      });

      return hours;
    } catch (error) {
      console.error('Error getting hourly trends:', error);
      return [];
    }
  }

  /**
   * Get cohort analysis
   */
  async getCohortAnalysis(startDate: Date, endDate: Date): Promise<any> {
    try {
      const cohorts = await CustomerAnalytics.aggregate([
        { $match: { firstOrderDate: { $gte: startDate, $lte: endDate } } },
        { $group: {
          _id: {
            year: { $year: '$firstOrderDate' },
            month: { $month: '$firstOrderDate' }
          },
          customers: { $sum: 1 },
          totalRevenue: { $sum: '$totalSpent' },
          avgLifetimeValue: { $avg: '$customerLifetimeValue' }
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      return cohorts.map(cohort => ({
        cohort: `${cohort._id.year}-${String(cohort._id.month).padStart(2, '0')}`,
        customers: cohort.customers,
        totalRevenue: cohort.totalRevenue,
        avgLifetimeValue: cohort.avgLifetimeValue
      }));
    } catch (error) {
      console.error('Error getting cohort analysis:', error);
      return [];
    }
  }

  /**
   * Get predictive insights
   */
  async getPredictiveInsights(startDate: Date, endDate: Date): Promise<any> {
    try {
      const [salesTrend, customerTrend, seasonalData] = await Promise.all([
        SalesAnalytics.aggregate([
          { $match: { date: { $gte: startDate, $lte: endDate } } },
          { $group: {
            _id: { $dayOfYear: '$date' },
            avgRevenue: { $avg: '$totalRevenue' },
            avgOrders: { $avg: '$totalOrders' }
          }},
          { $sort: { '_id': 1 } }
        ]),
        CustomerAnalytics.aggregate([
          { $match: { lastUpdated: { $gte: startDate, $lte: endDate } } },
          { $group: {
            _id: '$customerSegment',
            count: { $sum: 1 },
            avgValue: { $avg: '$customerLifetimeValue' }
          }}
        ]),
        SalesAnalytics.aggregate([
          { $match: { date: { $gte: new Date(startDate.getFullYear() - 1, startDate.getMonth(), startDate.getDate()) } } },
          { $group: {
            _id: { month: { $month: '$date' } },
            avgRevenue: { $avg: '$totalRevenue' }
          }},
          { $sort: { '_id.month': 1 } }
        ])
      ]);

      // Simple trend analysis
      const revenueGrowth = salesTrend.length > 1 ? 
        ((salesTrend[salesTrend.length - 1]?.avgRevenue - salesTrend[0]?.avgRevenue) / salesTrend[0]?.avgRevenue) * 100 : 0;

      const insights = {
        revenueGrowthTrend: Math.round(revenueGrowth),
        predictedNextMonthRevenue: salesTrend.length > 0 ? 
          Math.round(salesTrend[salesTrend.length - 1]?.avgRevenue * (1 + revenueGrowth / 100)) : 0,
        customerSegmentInsights: customerTrend,
        seasonalTrends: seasonalData,
        recommendations: this.generateRecommendations(salesTrend, customerTrend)
      };

      return insights;
    } catch (error) {
      console.error('Error getting predictive insights:', error);
      return {
        revenueGrowthTrend: 0,
        predictedNextMonthRevenue: 0,
        customerSegmentInsights: [],
        seasonalTrends: [],
        recommendations: []
      };
    }
  }

  /**
   * Generate AI-powered recommendations
   */
  private generateRecommendations(salesTrend: any[], customerTrend: any[]): string[] {
    const recommendations = [];

    // Revenue trend analysis
    if (salesTrend.length > 1) {
      const recentRevenue = salesTrend.slice(-7).reduce((sum, day) => sum + day.avgRevenue, 0) / 7;
      const previousRevenue = salesTrend.slice(-14, -7).reduce((sum, day) => sum + day.avgRevenue, 0) / 7;
      
      if (recentRevenue < previousRevenue * 0.9) {
        recommendations.push('Revenue is declining. Consider launching promotional campaigns or reviewing pricing strategy.');
      } else if (recentRevenue > previousRevenue * 1.1) {
        recommendations.push('Revenue is growing strongly. Consider scaling marketing efforts to maintain momentum.');
      }
    }

    // Customer segment analysis
    const vipCustomers = customerTrend.find(c => c._id === 'vip');
    const atRiskCustomers = customerTrend.find(c => c._id === 'at_risk');
    
    if (atRiskCustomers && atRiskCustomers.count > 0) {
      recommendations.push(`You have ${atRiskCustomers.count} at-risk customers. Implement retention campaigns to prevent churn.`);
    }
    
    if (vipCustomers && vipCustomers.count > 0) {
      recommendations.push(`Leverage your ${vipCustomers.count} VIP customers with exclusive offers and referral programs.`);
    }

    return recommendations;
  }

  // Additional helper methods for detailed reports
  private async getRevenueByCategory(startDate: Date, endDate: Date) {
    // Implementation for category revenue breakdown
    return [];
  }

  private async getRevenueByPaymentMethod(startDate: Date, endDate: Date) {
    // Implementation for payment method breakdown
    return [];
  }

  private async getCustomerMetrics(startDate: Date, endDate: Date) {
    // Implementation for detailed customer metrics
    return {
      totalCustomers: 0,
      newCustomers: 0,
      returningCustomers: 0,
      customerLifetimeValue: 0,
      churnRate: 0,
      retentionRate: 0
    };
  }

  private async getDetailedCustomerSegments() {
    // Implementation for detailed customer segments
    return [];
  }

  private async getTopCustomers(limit: number) {
    return CustomerAnalytics.find()
      .sort({ totalSpent: -1 })
      .limit(limit)
      .populate('customerId', 'firstName lastName email');
  }

  private async getOverallConversionRate(startDate: Date, endDate: Date) {
    const sessions = await ConversionTracking.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    const conversions = await ConversionTracking.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      converted: true
    });
    return sessions > 0 ? (conversions / sessions) * 100 : 0;
  }

  private async getDetailedConversionFunnel(startDate: Date, endDate: Date) {
    return ConversionTracking.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $unwind: '$events' },
      { $group: {
        _id: '$events.eventType',
        count: { $sum: 1 },
        uniqueSessions: { $addToSet: '$sessionId' }
      }},
      { $project: {
        stage: '$_id',
        count: { $size: '$uniqueSessions' },
        totalEvents: '$count'
      }},
      { $sort: { count: -1 } }
    ]);
  }

  private async getConversionBySource(startDate: Date, endDate: Date) {
    return ConversionTracking.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: '$source',
        visitors: { $sum: 1 },
        conversions: { $sum: { $cond: ['$converted', 1, 0] } },
        revenue: { $sum: '$conversionValue' }
      }},
      { $project: {
        source: '$_id',
        visitors: 1,
        conversions: 1,
        revenue: 1,
        conversionRate: { $multiply: [{ $divide: ['$conversions', '$visitors'] }, 100] }
      }},
      { $sort: { visitors: -1 } }
    ]);
  }

  private async getConversionByDevice(startDate: Date, endDate: Date) {
    return ConversionTracking.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: '$device',
        visitors: { $sum: 1 },
        conversions: { $sum: { $cond: ['$converted', 1, 0] } }
      }},
      { $project: {
        device: '$_id',
        visitors: 1,
        conversions: 1,
        conversionRate: { $multiply: [{ $divide: ['$conversions', '$visitors'] }, 100] }
      }},
      { $sort: { visitors: -1 } }
    ]);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;