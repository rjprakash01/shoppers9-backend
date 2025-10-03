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
  canManageRoles: boolean;
}

export interface IRoleModel extends mongoose.Model<IRole> {
  getHierarchy(): Record<number, string>;
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

// Instance methods
roleSchema.methods.canManage = function(this: IRole, targetRole: IRole): boolean {
  return this.level < targetRole.level;
};

roleSchema.methods.hasModuleAccess = function(this: IRole, module: string): boolean {
  return this.permissions.some(async (permissionId) => {
    const permission = await mongoose.model('Permission').findById(permissionId);
    return permission && permission.module === module && permission.isActive;
  });
};

roleSchema.methods.addModulePermission = function(this: IRole, permissionId: string): void {
  if (!this.permissions.some(p => p.toString() === permissionId)) {
    this.permissions.push(new mongoose.Types.ObjectId(permissionId));
  }
};

roleSchema.methods.removeModulePermission = function(this: IRole, permissionId: string): void {
  this.permissions = this.permissions.filter(p => p.toString() !== permissionId);
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

// Lazy model creation
let _roleModel: any = null;

// Function to get Role model with proper connection
export const getRoleModel = () => {
  if (!_roleModel) {
    const { adminConnection } = require('../config/database');
    if (!adminConnection) {
      throw new Error('Admin connection not established');
    }
    _roleModel = adminConnection.model<IRole, IRoleModel>('Role', roleSchema);
  }
  return _roleModel;
};

// Export the model (for backward compatibility)
export const Role = new Proxy({}, {
  get(target, prop) {
    return getRoleModel()[prop];
  }
});
export default Role;