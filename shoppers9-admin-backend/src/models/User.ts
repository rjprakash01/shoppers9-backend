import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types';

const addressSchema = new Schema({
  type: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  },
  street: {
    type: String,
    required: true,
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
  zipCode: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true,
    default: 'India'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});

const userSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  addresses: [addressSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  // RBAC fields
  roles: [{
    type: Schema.Types.ObjectId,
    ref: 'UserRole'
  }],
  primaryRole: {
    type: String,
    enum: ['super_admin', 'admin', 'sub_admin', 'seller', 'customer'],
    default: 'customer'
  },
  // Seller specific fields
  sellerInfo: {
    businessName: String,
    gstNumber: String,
    panNumber: String,
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      accountHolderName: String
    },
    businessAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'India' }
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending'
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    commissionRate: {
      type: Number,
      default: 10 // percentage
    }
  },
  // Admin specific fields
  adminInfo: {
    employeeId: String,
    department: String,
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    accessLevel: {
      type: Number,
      min: 1,
      max: 4
    }
  },
  // Security fields
  security: {
    lastPasswordChange: Date,
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockedUntil: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: String,
    sessionTokens: [{
      token: String,
      createdAt: { type: Date, default: Date.now },
      expiresAt: Date,
      ipAddress: String,
      userAgent: String
    }]
  },
  // Metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  suspendedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  suspendedAt: Date,
  suspensionReason: String
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password; // Never send password in JSON response
      return ret;
    }
  }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });
// RBAC indexes
userSchema.index({ primaryRole: 1 });
userSchema.index({ 'sellerInfo.approvalStatus': 1 });
userSchema.index({ 'adminInfo.accessLevel': 1 });
userSchema.index({ createdBy: 1 });
userSchema.index({ suspendedBy: 1 });
userSchema.index({ 'security.failedLoginAttempts': 1 });
userSchema.index({ 'security.lockedUntil': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for default address
userSchema.virtual('defaultAddress').get(function() {
  return this.addresses.find((addr: any) => addr.isDefault) || this.addresses[0];
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return this.security?.lockedUntil && this.security.lockedUntil > new Date();
});

// Virtual for seller approval status
userSchema.virtual('isApprovedSeller').get(function() {
  return this.primaryRole === 'seller' && this.sellerInfo?.approvalStatus === 'approved';
});

// Method to check if user has specific role
userSchema.methods.hasRole = function(roleName: string): boolean {
  return this.primaryRole === roleName;
};

// Method to check if user is admin level (admin or super_admin)
userSchema.methods.isAdmin = function(): boolean {
  return ['super_admin', 'admin', 'sub_admin'].includes(this.primaryRole);
};

// Method to check if user can manage another user
userSchema.methods.canManage = function(targetUser: any): boolean {
  const roleHierarchy = {
    'super_admin': 1,
    'admin': 2,
    'sub_admin': 3,
    'seller': 4,
    'customer': 5
  };
  
  const myLevel = roleHierarchy[this.primaryRole as keyof typeof roleHierarchy] || 5;
  const targetLevel = roleHierarchy[targetUser.primaryRole as keyof typeof roleHierarchy] || 5;
  
  return myLevel < targetLevel;
};

// Method to increment failed login attempts
userSchema.methods.incrementFailedAttempts = function() {
  if (!this.security) {
    this.security = { failedLoginAttempts: 0 };
  }
  
  this.security.failedLoginAttempts = (this.security.failedLoginAttempts || 0) + 1;
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.security.failedLoginAttempts >= 5) {
    this.security.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
  
  return this.save();
};

// Method to reset failed login attempts
userSchema.methods.resetFailedAttempts = function() {
  if (this.security) {
    this.security.failedLoginAttempts = 0;
    this.security.lockedUntil = undefined;
  }
  return this.save();
};

// Method to add session token
userSchema.methods.addSessionToken = function(token: string, ipAddress: string, userAgent: string) {
  if (!this.security) {
    this.security = {};
  }
  if (!this.security.sessionTokens) {
    this.security.sessionTokens = [];
  }
  
  // Remove expired tokens
  this.security.sessionTokens = this.security.sessionTokens.filter(
    (t: any) => t.expiresAt > new Date()
  );
  
  // Add new token
  this.security.sessionTokens.push({
    token,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    ipAddress,
    userAgent
  });
  
  return this.save();
};

// Method to remove session token
userSchema.methods.removeSessionToken = function(token: string) {
  if (this.security?.sessionTokens) {
    this.security.sessionTokens = this.security.sessionTokens.filter(
      (t: any) => t.token !== token
    );
  }
  return this.save();
};

// Static method to find users by role
userSchema.statics.findByRole = function(role: string, options: any = {}) {
  return this.find({ 
    primaryRole: role, 
    isActive: true,
    ...options 
  });
};

// Static method to find pending sellers
userSchema.statics.findPendingSellers = function() {
  return this.find({
    primaryRole: 'seller',
    'sellerInfo.approvalStatus': 'pending',
    isActive: true
  });
};

// Lazy model creation
let _userModel: any = null;

// Function to get User model with proper connection
export const getUserModel = () => {
  if (!_userModel) {
    const { adminConnection } = require('../config/database');
    if (!adminConnection) {
      throw new Error('Admin connection not established');
    }
    // Check if model already exists on this connection to prevent re-registration
    try {
      _userModel = adminConnection.model<IUser>('User');
    } catch (error) {
      // Model doesn't exist, create it
      _userModel = adminConnection.model<IUser>('User', userSchema);
    }
  }
  return _userModel;
};

// Export the model getter function to prevent immediate registration
export { getUserModel };

// Export the model (for backward compatibility) - lazy loaded
export const User = new Proxy({}, {
  get(target, prop) {
    return getUserModel()[prop];
  }
});

export default getUserModel;