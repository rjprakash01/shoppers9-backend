import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  name: string;
  displayName: string;
  description: string;
  level: number; // 1=SuperAdmin, 2=Admin, 3=SubAdmin, 4=Seller
  isActive: boolean;
  permissions: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['super_admin', 'admin', 'sub_admin', 'seller'],
    lowercase: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: [{
    type: Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.name !== 'super_admin'; // Super admin role doesn't need creator
    }
  }
}, {
  timestamps: true
});

// Indexes
roleSchema.index({ name: 1 });
roleSchema.index({ level: 1 });
roleSchema.index({ isActive: 1 });

// Virtual for checking if role can manage other roles
roleSchema.virtual('canManageRoles').get(function() {
  return this.level <= 2; // Super Admin and Admin can manage roles
});

// Method to check if this role can manage another role
roleSchema.methods.canManage = function(targetRole: IRole): boolean {
  return this.level < targetRole.level;
};

// Static method to get role hierarchy
roleSchema.statics.getHierarchy = function() {
  return {
    1: 'super_admin',
    2: 'admin', 
    3: 'sub_admin',
    4: 'seller'
  };
};

// Pre-save middleware
roleSchema.pre('save', function(next) {
  if (this.isNew && this.name === 'super_admin' && this.level !== 1) {
    this.level = 1;
  }
  next();
});

export const Role = mongoose.model<IRole>('Role', roleSchema);
export default Role;