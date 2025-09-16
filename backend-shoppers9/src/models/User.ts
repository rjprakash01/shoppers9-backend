import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IAddress } from '../types';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

const addressSchema = new Schema<IAddress>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        // Allow test phone number or valid Indian phone numbers
        return v === '1234567890' || /^[6-9]\d{9}$/.test(v);
      },
      message: 'Phone number must be a valid Indian mobile number or test number'
    }
  },
  addressLine1: {
    type: String,
    required: true,
    trim: true
  },
  addressLine2: {
    type: String,
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
  pincode: {
    type: String,
    required: true,
    match: /^[1-9][0-9]{5}$/
  },
  landmark: {
    type: String,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    sparse: true,
    unique: true
  },
  phone: {
    type: String,
    required: function(this: IUser) {
      return this.authMethod === 'phone' || this.authMethod === 'both';
    },
    sparse: true,
    unique: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Allow empty if not required
        // Allow test phone number or valid Indian phone numbers
        return v === '1234567890' || /^[6-9]\d{9}$/.test(v);
      },
      message: 'Phone number must be a valid Indian mobile number or test number'
    }
  },
  password: {
    type: String,
    required: function(this: IUser) {
      return this.authMethod === 'email' || this.authMethod === 'both';
    },
    minlength: [8, 'Password must be at least 8 characters long'],
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Allow empty if not required
        // Password must contain at least one uppercase, one lowercase, one number, and one special character
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(v);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  },
  authMethod: {
    type: String,
    enum: ['phone', 'email', 'both'],
    required: true,
    default: 'phone'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  addresses: [addressSchema]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
// phone already has unique index from schema definition
userSchema.index({ email: 1 });
userSchema.index({ passwordResetToken: 1 });

// Note: isLocked is implemented as an instance method below

// Pre-save middleware for password hashing
userSchema.pre('save', async function(next) {
  // Hash password if it's modified
  if (this.isModified('password') && this.password) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error as Error);
    }
  }

  // Ensure phone number format
  if (this.phone && this.phone !== '1234567890') {
    // Ensure phone number is 10 digits
    this.phone = this.phone.replace(/\D/g, '');
    
    if (this.phone.length === 11 && this.phone.startsWith('0')) {
      this.phone = this.phone.substring(1);
    }
    
    if (this.phone.length !== 10) {
      return next(new Error('Phone number must be exactly 10 digits'));
    }
  }

  // Ensure only one default address
  if (this.addresses && this.addresses.length > 0) {
    const defaultAddresses = this.addresses.filter(addr => addr.isDefault);
    if (defaultAddresses.length > 1) {
      // Keep only the first default address
      this.addresses.forEach((addr, index) => {
        if (index > 0 && addr.isDefault) {
          addr.isDefault = false;
        }
      });
    }
  }
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if account is locked
userSchema.methods.isLocked = function(): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function(): Promise<IUser> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // If we have reached max attempts and it's not locked already, lock the account
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_TIME) };
  }
  
  return this.updateOne(updates);
};

// Static method to get reasons for failed login
userSchema.statics.getFailedLoginReasons = function() {
  return {
    NOT_FOUND: 0,
    PASSWORD_INCORRECT: 1,
    MAX_ATTEMPTS: 2
  };
};

export const User = mongoose.model<IUser>('User', userSchema);