import mongoose, { Schema } from 'mongoose';

// Sales Analytics Schema
const salesAnalyticsSchema = new Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true,
    index: true
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalCustomers: {
    type: Number,
    default: 0
  },
  newCustomers: {
    type: Number,
    default: 0
  },
  returningCustomers: {
    type: Number,
    default: 0
  },
  averageOrderValue: {
    type: Number,
    default: 0
  },
  totalProducts: {
    type: Number,
    default: 0
  },
  conversionRate: {
    type: Number,
    default: 0
  },
  categoryBreakdown: [{
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    categoryName: String,
    revenue: Number,
    orders: Number,
    products: Number
  }],
  topProducts: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,
    revenue: Number,
    orders: Number,
    quantity: Number
  }],
  paymentMethodBreakdown: [{
    method: String,
    count: Number,
    revenue: Number,
    percentage: Number
  }],
  refunds: {
    count: Number,
    amount: Number
  },
  cancellations: {
    count: Number,
    amount: Number
  }
}, {
  timestamps: true
});

// Customer Analytics Schema
const customerAnalyticsSchema = new Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  averageOrderValue: {
    type: Number,
    default: 0
  },
  firstOrderDate: Date,
  lastOrderDate: Date,
  daysSinceLastOrder: Number,
  customerLifetimeValue: {
    type: Number,
    default: 0
  },
  customerSegment: {
    type: String,
    enum: ['new', 'regular', 'vip', 'at_risk', 'churned'],
    default: 'new'
  },
  favoriteCategories: [{
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    categoryName: String,
    orderCount: Number,
    totalSpent: Number
  }],
  purchaseFrequency: {
    type: Number,
    default: 0 // orders per month
  },
  returnRate: {
    type: Number,
    default: 0
  },
  refundRate: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Conversion Tracking Schema
const conversionTrackingSchema = new Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  events: [{
    eventType: {
      type: String,
      enum: [
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
      ],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    data: {
      type: mongoose.Schema.Types.Mixed
    },
    value: Number, // monetary value if applicable
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }
  }],
  source: {
    type: String,
    enum: ['direct', 'search', 'social', 'email', 'referral', 'paid'],
    default: 'direct'
  },
  medium: String,
  campaign: String,
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet'],
    default: 'desktop'
  },
  browser: String,
  os: String,
  country: String,
  city: String,
  converted: {
    type: Boolean,
    default: false
  },
  conversionValue: {
    type: Number,
    default: 0
  },
  funnelStage: {
    type: String,
    enum: ['awareness', 'interest', 'consideration', 'purchase', 'retention'],
    default: 'awareness'
  },
  sessionDuration: Number, // in seconds
  pageViews: {
    type: Number,
    default: 0
  },
  bounceRate: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Product Analytics Schema
const productAnalyticsSchema = new Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  uniqueViews: {
    type: Number,
    default: 0
  },
  addToCart: {
    type: Number,
    default: 0
  },
  addToWishlist: {
    type: Number,
    default: 0
  },
  purchases: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  },
  conversionRate: {
    type: Number,
    default: 0
  },
  cartAbandonmentRate: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  returnRate: {
    type: Number,
    default: 0
  },
  stockLevel: Number,
  priceChanges: [{
    oldPrice: Number,
    newPrice: Number,
    changeDate: Date,
    reason: String
  }]
}, {
  timestamps: true
});

// Marketing Analytics Schema
const marketingAnalyticsSchema = new Schema({
  campaignId: {
    type: String,
    required: true,
    index: true
  },
  campaignName: {
    type: String,
    required: true
  },
  campaignType: {
    type: String,
    enum: ['email', 'social', 'search', 'display', 'affiliate', 'coupon'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  budget: Number,
  spent: {
    type: Number,
    default: 0
  },
  impressions: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  conversions: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  },
  ctr: {
    type: Number,
    default: 0 // click-through rate
  },
  cpc: {
    type: Number,
    default: 0 // cost per click
  },
  cpa: {
    type: Number,
    default: 0 // cost per acquisition
  },
  roas: {
    type: Number,
    default: 0 // return on ad spend
  },
  roi: {
    type: Number,
    default: 0 // return on investment
  },
  targetAudience: {
    ageRange: String,
    gender: String,
    location: [String],
    interests: [String]
  },
  performance: [{
    date: Date,
    impressions: Number,
    clicks: Number,
    conversions: Number,
    revenue: Number,
    spent: Number
  }]
}, {
  timestamps: true
});

// Indexes
salesAnalyticsSchema.index({ date: 1, period: 1 });
salesAnalyticsSchema.index({ period: 1, date: -1 });

customerAnalyticsSchema.index({ customerId: 1 });
customerAnalyticsSchema.index({ customerSegment: 1 });
customerAnalyticsSchema.index({ lastOrderDate: -1 });

conversionTrackingSchema.index({ sessionId: 1 });
conversionTrackingSchema.index({ customerId: 1, createdAt: -1 });
conversionTrackingSchema.index({ 'events.eventType': 1, 'events.timestamp': -1 });
conversionTrackingSchema.index({ converted: 1, createdAt: -1 });

productAnalyticsSchema.index({ productId: 1, date: -1 });
productAnalyticsSchema.index({ date: 1, period: 1 });

marketingAnalyticsSchema.index({ campaignId: 1 });
marketingAnalyticsSchema.index({ campaignType: 1, startDate: -1 });

// Virtual fields
salesAnalyticsSchema.virtual('growthRate').get(function(this: any) {
  // This would be calculated by comparing with previous period
  return 0;
});

customerAnalyticsSchema.virtual('churnRisk').get(function(this: any) {
  if (this.daysSinceLastOrder > 90) return 'high';
  if (this.daysSinceLastOrder > 60) return 'medium';
  return 'low';
});

productAnalyticsSchema.virtual('popularityScore').get(function(this: any) {
  return (this.views * 0.1) + (this.addToCart * 0.3) + (this.purchases * 0.6);
});

// Static methods
salesAnalyticsSchema.statics.getRevenueByPeriod = function(startDate: Date, endDate: Date, period: string) {
  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        period: period
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalRevenue' },
        totalOrders: { $sum: '$totalOrders' },
        avgOrderValue: { $avg: '$averageOrderValue' }
      }
    }
  ]);
};

customerAnalyticsSchema.statics.getCustomerSegments = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$customerSegment',
        count: { $sum: 1 },
        totalValue: { $sum: '$customerLifetimeValue' },
        avgOrderValue: { $avg: '$averageOrderValue' }
      }
    }
  ]);
};

conversionTrackingSchema.statics.getFunnelAnalysis = function(startDate: Date, endDate: Date) {
  return this.aggregate([
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
        eventType: '$_id',
        count: 1,
        uniqueCount: { $size: '$uniqueSessions' }
      }
    }
  ]);
};

productAnalyticsSchema.statics.getTopProducts = function(period: string, limit: number = 10) {
  return this.aggregate([
    {
      $match: {
        period: period,
        date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: '$productId',
        totalRevenue: { $sum: '$revenue' },
        totalPurchases: { $sum: '$purchases' },
        totalViews: { $sum: '$views' },
        avgConversionRate: { $avg: '$conversionRate' }
      }
    },
    {
      $sort: { totalRevenue: -1 }
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
    }
  ]);
};

export const SalesAnalytics = mongoose.model('SalesAnalytics', salesAnalyticsSchema);
export const CustomerAnalytics = mongoose.model('CustomerAnalytics', customerAnalyticsSchema);
export const ConversionTracking = mongoose.model('ConversionTracking', conversionTrackingSchema);
export const ProductAnalytics = mongoose.model('ProductAnalytics', productAnalyticsSchema);
export const MarketingAnalytics = mongoose.model('MarketingAnalytics', marketingAnalyticsSchema);