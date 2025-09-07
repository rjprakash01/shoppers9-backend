import mongoose, { Schema } from 'mongoose';
import { IOrder, IOrderItem, IAddress, OrderStatus, OrderItemStatus, PaymentStatus, RefundStatus } from '../types';

const orderItemSchema = new Schema<IOrderItem>({
  product: {
    type: String,
    required: true,
    ref: 'Product'
  },
  variantId: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: Object.values(OrderItemStatus),
    default: OrderItemStatus.PENDING
  }
});

const addressSchema = new Schema<IAddress>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    match: /^[6-9]\d{9}$/
  },
  addressLine1: {
    type: String,
    required: true,
    trim: true
  },
  addressLine2: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    required: true,
    match: /^[1-9][0-9]{5}$/
  },
  landmark: {
    type: String,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});

const orderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  items: [orderItemSchema],
  shippingAddress: {
    type: addressSchema,
    required: true
  },
  billingAddress: addressSchema,
  paymentMethod: {
    type: String,
    required: true,
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING
  },
  orderStatus: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  platformFee: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryCharge: {
    type: Number,
    default: 0,
    min: 0
  },
  finalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  couponCode: {
    type: String,
    trim: true
  },
  couponDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  estimatedDelivery: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  returnRequestedAt: Date,
  returnedAt: Date,
  cancellationReason: {
    type: String,
    trim: true
  },
  returnReason: {
    type: String,
    trim: true
  },
  trackingId: {
    type: String,
    trim: true
  },
  paymentId: {
    type: String,
    trim: true
  },
  paymentIntentId: {
    type: String,
    trim: true
  },
  paidAt: Date,
  refundId: {
    type: String,
    trim: true
  },
  refundAmount: {
    type: Number,
    min: 0
  },
  refundStatus: {
    type: String,
    enum: Object.values(RefundStatus)
  },
  refundReason: {
    type: String,
    trim: true
  },
  refundInitiatedAt: Date,
  refundedAt: Date
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      ret.orderId = ret.orderNumber;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
// orderNumber already has unique index from schema definition
orderSchema.index({ userId: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentId: 1 });

// Pre-save middleware to generate orderNumber
orderSchema.pre('save', function(this: IOrder, next: any) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `SP9${timestamp.slice(-6)}${random}`;
  }
  next();
});

// Method to calculate estimated delivery
orderSchema.methods.calculateEstimatedDelivery = function() {
  const deliveryDays = 5; // Default 5 days
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + deliveryDays);
  this.estimatedDelivery = estimatedDate;
  return this.save();
};

// Method to update order status
orderSchema.methods.updateStatus = function(status: OrderStatus) {
  this.orderStatus = status;
  
  switch (status) {
    case OrderStatus.DELIVERED:
      this.deliveredAt = new Date();
      break;
    case OrderStatus.CANCELLED:
      this.cancelledAt = new Date();
      break;
    case OrderStatus.RETURN_REQUESTED:
      this.returnRequestedAt = new Date();
      break;
    case OrderStatus.RETURNED:
      this.returnedAt = new Date();
      break;
  }
  
  return this.save();
};

// Method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING];
  return cancellableStatuses.includes(this.orderStatus);
};

// Method to check if order can be returned
orderSchema.methods.canBeReturned = function() {
  if (this.orderStatus !== OrderStatus.DELIVERED || !this.deliveredAt) {
    return false;
  }
  
  const returnWindowDays = parseInt(process.env.RETURN_WINDOW_DAYS || '7');
  const returnDeadline = new Date(this.deliveredAt);
  returnDeadline.setDate(returnDeadline.getDate() + returnWindowDays);
  
  return new Date() <= returnDeadline;
};

export const Order = mongoose.model<IOrder>('Order', orderSchema);