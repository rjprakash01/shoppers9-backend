import mongoose, { Document, Schema } from 'mongoose';

export interface IUserRole extends Document {
  userId: mongoose.Types.ObjectId;
  roleId: mongoose.Types.ObjectId;
  permissions?: {
    permissionId: mongoose.Types.ObjectId;
    granted: boolean;
    restrictions?: any;
  }[];
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
  isAccessAllowed(): boolean;
  hasModuleAccess(module: string): boolean;
  updateLastAccess(): Promise<IUserRole>;
  grantModuleAccess(module: string): void;
  revokeModuleAccess(module: string): void;
}

export interface IUserRoleModel extends mongoose.Model<IUserRole> {
  getUserPermissions(userId: mongoose.Types.ObjectId): Promise<any[]>;
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
  permissions: [{
    permissionId: {
      type: Schema.Types.ObjectId,
      ref: 'Permission',
      required: true
    },
    granted: {
      type: Boolean,
      default: true
    },
    restrictions: Schema.Types.Mixed
  }],
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

// Static method to get user permissions
userRoleSchema.statics.getUserPermissions = async function(userId: mongoose.Types.ObjectId) {
  const userRoles = await this.find({ userId, isActive: true })
    .populate('roleId')
    .populate('permissions.permissionId');
  
  const permissions: any[] = [];
  userRoles.forEach((userRole: any) => {
    if (userRole.permissions) {
      userRole.permissions.forEach((perm: any) => {
        if (perm.granted) {
          permissions.push({
            permissionId: perm.permissionId,
            restrictions: perm.restrictions
          });
        }
      });
    }
  });
  
  return permissions;
};

// Lazy model creation
let _userRoleModel: any = null;

// Function to get UserRole model with proper connection
export const getUserRoleModel = () => {
  if (!_userRoleModel) {
    const { adminConnection } = require('../config/database');
    if (!adminConnection) {
      throw new Error('Admin connection not established');
    }
    _userRoleModel = adminConnection.model<IUserRole, IUserRoleModel>('UserRole', userRoleSchema);
  }
  return _userRoleModel;
};

// Export the model (for backward compatibility)
export const UserRole = new Proxy({}, {
  get(target, prop) {
    return getUserRoleModel()[prop];
  }
});
export default UserRole;