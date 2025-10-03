import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IAdmin } from '../types';

const adminSchema = new Schema<IAdmin>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
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
  phone: {
    type: String,
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid phone number']
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'sub_admin'],
    default: 'sub_admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  refreshToken: {
    type: String
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin'
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.refreshToken;
      return ret;
    }
  }
});

// Indexes
adminSchema.index({ email: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ createdAt: -1 });

// Virtual for full name
adminSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to check password
adminSchema.methods.matchPassword = async function(enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
adminSchema.methods.generateJWT = function(): string {
  const payload = { 
    id: this._id,
    email: this.email,
    role: this.role
  };
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  return jwt.sign(payload, secret, { expiresIn } as any) as string;
};

// Method to generate refresh token
adminSchema.methods.generateRefreshToken = function(): string {
  const payload = { 
    id: this._id,
    email: this.email
  };
  const secret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn } as any) as string;
};

// Method to get permissions based on role
adminSchema.methods.getPermissions = function(): string[] {
  const permissions: { [key: string]: string[] } = {
    super_admin: [
      'admin:create', 'admin:read', 'admin:update', 'admin:delete',
      'user:create', 'user:read', 'user:update', 'user:delete',
      'product:create', 'product:read', 'product:update', 'product:delete',
      'order:create', 'order:read', 'order:update', 'order:delete',
      'analytics:read', 'settings:update'
    ],
    admin: [
      'user:read', 'user:update',
      'product:create', 'product:read', 'product:update', 'product:delete',
      'order:read', 'order:update',
      'analytics:read'
    ],
    moderator: [
      'user:read',
      'product:read', 'product:update',
      'order:read', 'order:update'
    ]
  };

  return permissions[this.role] || [];
};

// Pre-save middleware to hash password
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Create the model using default mongoose connection for now
// This will be updated to use adminConnection once it's properly established
const Admin = mongoose.model<IAdmin>('Admin', adminSchema);

export default Admin;