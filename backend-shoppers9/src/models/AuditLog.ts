import mongoose, { Document, Schema } from 'mongoose';

interface IAuditLog extends Document {
  entityType: 'product' | 'order' | 'user' | 'category';
  entityId: string;
  action: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  performedBy: mongoose.Types.ObjectId;
  performedByType: 'admin' | 'user' | 'system';
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const auditLogSchema = new Schema<IAuditLog>({
  entityType: {
    type: String,
    required: true,
    enum: ['product', 'order', 'user', 'category']
  },
  entityId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  oldValues: {
    type: Schema.Types.Mixed,
    default: null
  },
  newValues: {
    type: Schema.Types.Mixed,
    default: null
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  performedByType: {
    type: String,
    required: true,
    enum: ['admin', 'user', 'system'],
    default: 'user'
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
export type { IAuditLog };