import mongoose, { Document, Schema } from 'mongoose';

export interface IUserRole extends Document {
  userId: mongoose.Types.ObjectId;
  roleId: mongoose.Types.ObjectId;
  moduleAccess: {
    module: string;
    hasAccess: boolean;
  }[];
  isActive: boolean;
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
  expiresAt?: Date;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userRoleSchema = new Schema<IUserRole>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roleId: {
    type: Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  moduleAccess: [{
    module: {
      type: String,
      required: true,
      enum: [
        'dashboard',
        'users',
        'products',
        'inventory',
        'orders',
        'shipping',
        'coupons',
        'support',
        'categories',
        'filters',
        'banners',
        'testimonials',
        'admin_management',
        'settings',
        'analytics'
      ]
    },
    hasAccess: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  lastAccessedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound indexes
userRoleSchema.index({ userId: 1, roleId: 1 }, { unique: true });
userRoleSchema.index({ userId: 1, isActive: 1 });
userRoleSchema.index({ roleId: 1 });
userRoleSchema.index({ assignedBy: 1 });
userRoleSchema.index({ expiresAt: 1 });

// Virtual to check if role assignment is expired
userRoleSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Method to check if user has access to a specific module
userRoleSchema.methods.hasModuleAccess = function(module: string): boolean {
  if (!this.isActive || this.isExpired) {
    return false;
  }
  
  const moduleAccess = this.moduleAccess.find((m: any) => m.module === module);
  return moduleAccess ? moduleAccess.hasAccess : false;
};

// Method to check if access is allowed (simplified - no time restrictions in binary model)
userRoleSchema.methods.isAccessAllowed = function(): boolean {
  return this.isActive && !this.isExpired;
};

// Method to update last accessed time
userRoleSchema.methods.updateLastAccess = function() {
  this.lastAccessedAt = new Date();
  return this.save();
};

// Static method to get user module access
userRoleSchema.statics.getUserModuleAccess = async function(userId: mongoose.Types.ObjectId) {
  return this.find({ 
    userId, 
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  })
  .populate('roleId');
};

// Method to grant module access
userRoleSchema.methods.grantModuleAccess = function(module: string) {
  const existingAccess = this.moduleAccess.find((m: any) => m.module === module);
  if (existingAccess) {
    existingAccess.hasAccess = true;
  } else {
    this.moduleAccess.push({ module, hasAccess: true });
  }
};

// Method to revoke module access
userRoleSchema.methods.revokeModuleAccess = function(module: string) {
  const existingAccess = this.moduleAccess.find((m: any) => m.module === module);
  if (existingAccess) {
    existingAccess.hasAccess = false;
  }
};

export const UserRole = mongoose.model<IUserRole>('UserRole', userRoleSchema);
export default UserRole;