import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  module: string;
  resource?: string;
  resourceId?: mongoose.Types.ObjectId;
  details: {
    method?: string;
    endpoint?: string;
    userAgent?: string;
    ipAddress?: string;
    oldValues?: any;
    newValues?: any;
    affectedUsers?: mongoose.Types.ObjectId[];
    reason?: string;
  };
  status: 'success' | 'failed' | 'unauthorized';
  errorMessage?: string;
  timestamp: Date;
  sessionId?: string;
}

const auditLogSchema = new Schema<IAuditLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication actions
      'login', 'logout', 'login_failed', 'password_change',
      // Role and permission actions
      'role_assigned', 'role_revoked', 'permission_granted', 'permission_revoked',
      'role_created', 'role_updated', 'role_deleted',
      // User management actions
      'user_created', 'user_updated', 'user_deleted', 'user_suspended', 'user_activated',
      // Seller management actions
      'seller_approved', 'seller_rejected', 'seller_suspended', 'seller_banned',
      // Product management actions
      'product_created', 'product_updated', 'product_deleted', 'product_approved', 'product_rejected',
      // Order management actions
      'order_viewed', 'order_updated', 'order_cancelled', 'order_refunded',
      // Category management actions
      'category_created', 'category_updated', 'category_deleted',
      // Analytics actions
      'analytics_viewed', 'report_exported', 'data_imported',
      // Support actions
      'ticket_created', 'ticket_updated', 'ticket_resolved',
      // System actions
      'settings_updated', 'emergency_override', 'bulk_operation',
      // General CRUD actions
      'create', 'read', 'update', 'delete', 'export', 'import'
    ]
  },
  module: {
    type: String,
    required: true,
    enum: [
      'authentication',
      'dashboard',
      'seller_management', 
      'product_management',
      'order_management',
      'analytics_reports',
      'category_management',
      'user_management',
      'payment_billing',
      'support_complaints',
      'audit_logs',
      'settings',
      'system'
    ]
  },
  resource: {
    type: String // e.g., 'user', 'product', 'order', 'role', etc.
  },
  resourceId: {
    type: Schema.Types.ObjectId // ID of the affected resource
  },
  details: {
    method: String, // HTTP method (GET, POST, PUT, DELETE)
    endpoint: String, // API endpoint
    userAgent: String,
    ipAddress: String,
    oldValues: Schema.Types.Mixed, // Previous state of the resource
    newValues: Schema.Types.Mixed, // New state of the resource
    affectedUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    reason: String // Reason for the action (especially for suspensions, bans, etc.)
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'unauthorized'],
    default: 'success'
  },
  errorMessage: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  sessionId: String
}, {
  timestamps: false // We're using custom timestamp field
});

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ module: 1, timestamp: -1 });
auditLogSchema.index({ resourceId: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ status: 1, timestamp: -1 });
auditLogSchema.index({ 'details.ipAddress': 1, timestamp: -1 });

// TTL index to automatically delete old logs (optional - keep logs for 2 years)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

// Static method to log an action
auditLogSchema.statics.logAction = async function(logData: Partial<IAuditLog>) {
  try {
    const log = new this({
      ...logData,
      timestamp: new Date()
    });
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking the main operation
  }
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = function(
  userId: mongoose.Types.ObjectId, 
  options: {
    startDate?: Date;
    endDate?: Date;
    actions?: string[];
    modules?: string[];
    limit?: number;
    skip?: number;
  } = {}
) {
  const query: any = { userId };
  
  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate) query.timestamp.$gte = options.startDate;
    if (options.endDate) query.timestamp.$lte = options.endDate;
  }
  
  if (options.actions && options.actions.length > 0) {
    query.action = { $in: options.actions };
  }
  
  if (options.modules && options.modules.length > 0) {
    query.module = { $in: options.modules };
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0)
    .populate('userId', 'name email role')
    .populate('details.affectedUsers', 'name email');
};

// Static method to get suspicious activities
auditLogSchema.statics.getSuspiciousActivities = function(options: {
  timeWindow?: number; // minutes
  failureThreshold?: number;
  ipAddress?: string;
} = {}) {
  const timeWindow = options.timeWindow || 60; // 1 hour
  const failureThreshold = options.failureThreshold || 5;
  const since = new Date(Date.now() - timeWindow * 60 * 1000);
  
  const pipeline = [
    {
      $match: {
        timestamp: { $gte: since },
        status: 'failed'
      }
    },
    {
      $group: {
        _id: {
          userId: '$userId',
          ipAddress: '$details.ipAddress'
        },
        failureCount: { $sum: 1 },
        lastFailure: { $max: '$timestamp' },
        actions: { $addToSet: '$action' }
      }
    },
    {
      $match: {
        failureCount: { $gte: failureThreshold }
      }
    },
    {
      $sort: { failureCount: -1 }
    }
  ];
  
  if (options.ipAddress) {
    pipeline[0].$match['details.ipAddress'] = options.ipAddress;
  }
  
  return this.aggregate(pipeline);
};

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;