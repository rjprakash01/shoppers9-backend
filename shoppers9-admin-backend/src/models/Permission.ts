import mongoose, { Document, Schema } from 'mongoose';

export interface IPermission extends Document {
  module: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<IPermission>({
  module: {
    type: String,
    required: true,
    unique: true,
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
    'analytics'
  ];
};

// Method to generate permission key (simplified to just module)
permissionSchema.methods.getKey = function(): string {
  return this.module;
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
    'analytics'
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

export const Permission = mongoose.model<IPermission>('Permission', permissionSchema);
export default Permission;