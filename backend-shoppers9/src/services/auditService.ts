import { AuditLog, IAuditLog } from '../models/AuditLog';
import mongoose from 'mongoose';

interface AuditLogData {
  entityType: 'product' | 'order' | 'user' | 'category';
  entityId: string;
  action: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  performedBy: string | mongoose.Types.ObjectId;
  performedByType?: 'admin' | 'user' | 'system';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

class AuditService {
  /**
   * Log an audit event
   */
  static async log(data: AuditLogData): Promise<IAuditLog> {
    try {
      const auditLog = new AuditLog({
        ...data,
        performedBy: new mongoose.Types.ObjectId(data.performedBy.toString()),
        performedByType: data.performedByType || 'user',
        timestamp: new Date()
      });

      return await auditLog.save();
    } catch (error) {
      console.error('Failed to create audit log:', error);
      throw error;
    }
  }

  /**
   * Log product approval action
   */
  static async logProductApproval(
    productId: string,
    adminId: string,
    comments?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IAuditLog> {
    return this.log({
      entityType: 'product',
      entityId: productId,
      action: 'product_approved',
      newValues: { approvalStatus: 'approved', comments },
      performedBy: adminId,
      performedByType: 'admin',
      ipAddress,
      userAgent,
      metadata: { comments }
    });
  }

  /**
   * Log product rejection action
   */
  static async logProductRejection(
    productId: string,
    adminId: string,
    reason: string,
    comments?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IAuditLog> {
    return this.log({
      entityType: 'product',
      entityId: productId,
      action: 'product_rejected',
      newValues: { approvalStatus: 'rejected', reason, comments },
      performedBy: adminId,
      performedByType: 'admin',
      ipAddress,
      userAgent,
      metadata: { reason, comments }
    });
  }

  /**
   * Log product changes request
   */
  static async logProductChangesRequest(
    productId: string,
    adminId: string,
    reason: string,
    comments?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IAuditLog> {
    return this.log({
      entityType: 'product',
      entityId: productId,
      action: 'product_changes_requested',
      newValues: { approvalStatus: 'changes_requested', reason, comments },
      performedBy: adminId,
      performedByType: 'admin',
      ipAddress,
      userAgent,
      metadata: { reason, comments }
    });
  }

  /**
   * Log product submission
   */
  static async logProductSubmission(
    productId: string,
    userId: string,
    productData: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IAuditLog> {
    return this.log({
      entityType: 'product',
      entityId: productId,
      action: 'product_submitted',
      newValues: { approvalStatus: 'pending', ...productData },
      performedBy: userId,
      performedByType: 'user',
      ipAddress,
      userAgent,
      metadata: { submissionNotes: productData.submissionNotes }
    });
  }

  /**
   * Log product status change
   */
  static async logProductStatusChange(
    productId: string,
    adminId: string,
    oldStatus: string,
    newStatus: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IAuditLog> {
    return this.log({
      entityType: 'product',
      entityId: productId,
      action: 'product_status_changed',
      oldValues: { isActive: oldStatus },
      newValues: { isActive: newStatus },
      performedBy: adminId,
      performedByType: 'admin',
      ipAddress,
      userAgent
    });
  }

  /**
   * Log bulk review action
   */
  static async logBulkReviewAction(
    productIds: string[],
    adminId: string,
    action: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IAuditLog[]> {
    const logs = await Promise.all(
      productIds.map(productId =>
        this.log({
          entityType: 'product',
          entityId: productId,
          action: `bulk_${action}`,
          newValues: { approvalStatus: action },
          performedBy: adminId,
          performedByType: 'admin',
          ipAddress,
          userAgent,
          metadata: { bulkAction: true, totalProducts: productIds.length }
        })
      )
    );
    return logs;
  }

  /**
   * Get audit logs for an entity
   */
  static async getEntityLogs(
    entityType: string,
    entityId: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<IAuditLog[]> {
    return AuditLog.find({ entityType, entityId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .populate('performedBy', 'name email')
      .exec();
  }

  /**
   * Get audit logs by admin
   */
  static async getAdminLogs(
    adminId: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<IAuditLog[]> {
    return AuditLog.find({ performedBy: adminId, performedByType: 'admin' })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  /**
   * Get recent audit logs
   */
  static async getRecentLogs(
    limit: number = 100,
    skip: number = 0
  ): Promise<IAuditLog[]> {
    return AuditLog.find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .populate('performedBy', 'name email')
      .exec();
  }
}

export default AuditService;