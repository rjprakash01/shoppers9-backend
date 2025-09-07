import mongoose, { Schema } from 'mongoose';
import { ISupport, ISupportMessage, SupportCategory, SupportPriority, SupportStatus } from '../types';

const supportMessageSchema = new Schema<ISupportMessage>({
  senderId: {
    type: String,
    required: true
  },
  senderType: {
    type: String,
    enum: ['user', 'agent'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  attachments: [{
    type: String
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const supportSchema = new Schema<ISupport>({
  ticketId: {
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
  orderNumber: {
    type: String,
    ref: 'Order'
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    enum: Object.values(SupportCategory),
    required: true
  },
  priority: {
    type: String,
    enum: Object.values(SupportPriority),
    default: SupportPriority.MEDIUM
  },
  status: {
    type: String,
    enum: Object.values(SupportStatus),
    default: SupportStatus.OPEN
  },
  messages: [supportMessageSchema],
  assignedTo: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
supportSchema.index({ ticketId: 1 });
supportSchema.index({ userId: 1 });
supportSchema.index({ orderNumber: 1 });
supportSchema.index({ status: 1 });
supportSchema.index({ priority: 1 });
supportSchema.index({ category: 1 });
supportSchema.index({ createdAt: -1 });
supportSchema.index({ assignedTo: 1 });

// Pre-save middleware to generate ticketId
supportSchema.pre('save', function(next: any) {
  if (!this.ticketId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.ticketId = `TKT${timestamp.slice(-6)}${random}`;
  }
  next();
});

// Method to add message
supportSchema.methods.addMessage = function(senderId: string, senderType: 'user' | 'agent', message: string, attachments?: string[]) {
  this.messages.push({
    senderId,
    senderType,
    message,
    attachments: attachments || [],
    timestamp: new Date()
  });
  
  // Update status if agent responds
  if (senderType === 'agent' && this.status === SupportStatus.WAITING_FOR_CUSTOMER) {
    this.status = SupportStatus.IN_PROGRESS;
  } else if (senderType === 'user' && this.status === SupportStatus.IN_PROGRESS) {
    this.status = SupportStatus.WAITING_FOR_CUSTOMER;
  }
  
  return this.save();
};

// Method to assign ticket
supportSchema.methods.assignTo = function(agentId: string) {
  this.assignedTo = agentId;
  if (this.status === SupportStatus.OPEN) {
    this.status = SupportStatus.IN_PROGRESS;
  }
  return this.save();
};

// Method to update status
supportSchema.methods.updateStatus = function(status: SupportStatus) {
  this.status = status;
  return this.save();
};

// Method to update priority
supportSchema.methods.updatePriority = function(priority: SupportPriority) {
  this.priority = priority;
  return this.save();
};

// Method to close ticket
supportSchema.methods.closeTicket = function() {
  this.status = SupportStatus.CLOSED;
  return this.save();
};

// Method to reopen ticket
supportSchema.methods.reopenTicket = function() {
  this.status = SupportStatus.OPEN;
  return this.save();
};

export const Support = mongoose.model<ISupport>('Support', supportSchema);