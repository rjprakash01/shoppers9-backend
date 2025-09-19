import mongoose, { Document, Schema } from 'mongoose';

export interface IUserRole extends Document {
  userId: mongoose.Types.ObjectId;
  roleId: mongoose.Types.ObjectId;
  permissions: {
    permissionId: mongoose.Types.ObjectId;
    granted: boolean;
    restrictions?: {
      partialView?: string[]; // Array of fields to show/hide
      sellerScope?: mongoose.Types.ObjectId[]; // Specific sellers this user can manage
      regionScope?: string[]; // Specific regions
      timeRestriction?: {
        startTime?: string;
        endTime?: string;
        days?: number[]; // 0-6 (Sunday-Saturday)
      };
    };
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
    restrictions: {
      partialView: [String],
      sellerScope: [{
        type: Schema.Types.ObjectId,
        ref: 'User' // Reference to seller users
      }],
      regionScope: [String],
      timeRestriction: {
        startTime: String, // Format: "HH:MM"
        endTime: String,   // Format: "HH:MM"
        days: [{
          type: Number,
          min: 0,
          max: 6
        }]
      }
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

// Method to check if user has specific permission
userRoleSchema.methods.hasPermission = function(permissionKey: string): boolean {
  if (!this.isActive || this.isExpired) {
    return false;
  }
  
  const permission = this.permissions.find((p: any) => {
    // This would need to be populated to check the actual permission key
    return p.granted;
  });
  
  return !!permission;
};

// Method to check time restrictions
userRoleSchema.methods.isAccessAllowed = function(): boolean {
  if (!this.isActive || this.isExpired) {
    return false;
  }
  
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const currentDay = now.getDay();
  
  // Check if any permission has time restrictions that block current access
  for (const permission of this.permissions) {
    if (permission.restrictions?.timeRestriction) {
      const { startTime, endTime, days } = permission.restrictions.timeRestriction;
      
      if (days && days.length > 0 && !days.includes(currentDay)) {
        continue; // This permission is not valid for today
      }
      
      if (startTime && endTime) {
        if (currentTime < startTime || currentTime > endTime) {
          continue; // This permission is not valid for current time
        }
      }
    }
  }
  
  return true;
};

// Method to update last accessed time
userRoleSchema.methods.updateLastAccess = function() {
  this.lastAccessedAt = new Date();
  return this.save();
};

// Static method to get user permissions
userRoleSchema.statics.getUserPermissions = async function(userId: mongoose.Types.ObjectId) {
  return this.find({ 
    userId, 
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  })
  .populate('roleId')
  .populate('permissions.permissionId');
};

export const UserRole = mongoose.model<IUserRole>('UserRole', userRoleSchema);
export default UserRole;