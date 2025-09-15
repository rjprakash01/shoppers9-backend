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
        }
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
        productId: event.productId,
        categoryId: event.categoryId,
        orderId: event.orderId
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
    // Implementation for top customers
    return [];
  }

  private async getOverallConversionRate(startDate: Date, endDate: Date) {
    // Implementation for overall conversion rate
    return 0;
  }

  private async getDetailedConversionFunnel(startDate: Date, endDate: Date) {
    // Implementation for detailed conversion funnel
    return [];
  }

  private async getConversionBySource(startDate: Date, endDate: Date) {
    // Implementation for conversion by traffic source
    return [];
  }

  private async getConversionByDevice(startDate: Date, endDate: Date) {
    // Implementation for conversion by device
    return [];
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;