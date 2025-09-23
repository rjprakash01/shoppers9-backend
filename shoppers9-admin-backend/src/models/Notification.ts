import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationType {
  NEW_ORDER = 'new_order',
  ORDER_CANCELLED = 'order_cancelled',
  RETURN_REQUESTED = 'return_requested',
  ORDER_DELIVERED = 'order_delivered',
  RETURN_PICKED = 'return_picked',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  PRODUCT_APPROVED = 'product_approved',
  PRODUCT_REJECTED = 'product_rejected',
  PRODUCT_NEEDS_CHANGES = 'product_needs_changes',
  REVIEW_SUBMITTED = 'review_submitted'
}

export interface INotification extends Document {
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    orderId?: string;
    productId?: string;
    productName?: string;
    stock?: number;
    customerId?: string;
    customerName?: string;
    [key: string]: any;
  };
  isRead: boolean;
  targetUserId?: string; // Specific admin/seller this notification is for
  isSellerSpecific?: boolean; // Whether this is a seller-specific notification
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  type: {
    type: String,
    enum: Object.values(NotificationType),
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  targetUserId: {
    type: String,
    trim: true,
    index: true
  },
  isSellerSpecific: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ type: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;