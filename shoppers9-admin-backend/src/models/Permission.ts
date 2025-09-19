import mongoose, { Document, Schema } from 'mongoose';

export interface IPermission extends Document {
  module: string;
  action: string;
  resource: string;
  scope: 'own' | 'all';
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<IPermission>({
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
  action: {
    type: String,
    required: true,
    enum: ['read', 'create', 'edit', 'delete', 'export', 'import', 'approve', 'reject', 'create_assets']
  },
  resource: {
    type: String,
    required: true,
    default: '*' // '*' means all resources in the module
  },
  scope: {
    type: String,
    required: true,
    enum: ['own', 'all'],
    default: 'all'
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

// Compound index for unique permission combinations
permissionSchema.index({ module: 1, action: 1, resource: 1, scope: 1 }, { unique: true });
permissionSchema.index({ module: 1 });
permissionSchema.index({ isActive: 1 });

// Static method to get all modules
permissionSchema.statics.getModules = function() {
  return [
    'dashboard',
    'seller_management', 
    'product_management',
    'order_management',
    'analytics_reports',
    'category_management',
    'user_management',
    'payment_billing',
    'support_complaints',
    'audit_logs',
    'settings'
  ];
};

// Static method to get all actions
permissionSchema.statics.getActions = function() {
  return ['read', 'create', 'edit', 'delete', 'export', 'import', 'approve', 'reject'];
};

permissionSchema.statics.getScopes = function() {
  return ['own', 'all'];
};

// Method to generate permission key
permissionSchema.methods.getKey = function(): string {
  return `${this.module}:${this.action}:${this.resource}:${this.scope}`;
};

// Static method to create default permissions
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
  const actions = ['read', 'create', 'edit', 'delete', 'export', 'import', 'approve', 'reject'];
  const scopes = ['own', 'all'];
  const permissions = [];
  
  for (const module of modules) {
    for (const action of actions) {
      for (const scope of scopes) {
        // Skip 'own' scope for certain modules that don't have ownership concept
        if (scope === 'own' && ['dashboard', 'analytics', 'settings'].includes(module)) {
          continue;
        }
        
        permissions.push({
          module,
          action,
          resource: '*',
          scope,
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} access to ${scope === 'own' ? 'own' : 'all'} ${module.replace('_', ' ')}`
        });
      }
    }
  }
  
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