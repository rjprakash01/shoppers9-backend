import mongoose, { Document, Schema } from 'mongoose';

export interface IPermission extends Document {
  name: string;
  module: string;
  action: string;
  resource?: string;
  scope?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  getKey(): string;
}

export interface IPermissionModel extends mongoose.Model<IPermission> {
  getModules(): string[];
  getActions(): string[];
  findByModule(module: string): Promise<IPermission[]>;
  createDefaults(): Promise<void>;
}

const permissionSchema = new Schema<IPermission>({
  name: {
    type: String,
    required: true
  },
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
      'analytics',
      'product_review_queue'
    ]
  },
  action: {
    type: String,
    required: true
  },
  resource: {
    type: String,
    required: false
  },
  scope: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for module lookup
permissionSchema.index({ module: 1 }, { unique: true });
permissionSchema.index({ isActive: 1 });

// Static method to get all modules
permissionSchema.statics.getModules = function() {
  return [
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
    'analytics',
    'product_review_queue'
  ];
};

// Static method to get all actions
permissionSchema.statics.getActions = function() {
  return [
    'create',
    'read',
    'edit',
    'delete',
    'manage',
    'view',
    'export',
    'import'
  ];
};

// Method to generate permission key (simplified to just module)
permissionSchema.methods.getKey = function(): string {
  return this.module;
};

// Static method to find permissions by module
permissionSchema.statics.findByModule = function(module: string) {
  return this.find({ module, isActive: true });
};

// Static method to create default permissions (simplified binary model)
permissionSchema.statics.createDefaults = async function() {
  const modules = [
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
    'analytics',
    'product_review_queue'
  ];
  
  const permissions = modules.map(module => ({
    module,
    description: `Full access to ${module.replace('_', ' ')} module`
  }));
  
  try {
    await this.insertMany(permissions, { ordered: false });
  } catch (error: any) {
    // Ignore duplicate key errors
    if (error.code !== 11000) {
      throw error;
    }
  }
};

export const Permission = mongoose.model<IPermission, IPermissionModel>('Permission', permissionSchema);
export default Permission;