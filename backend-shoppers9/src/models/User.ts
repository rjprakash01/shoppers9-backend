import mongoose, { Schema } from 'mongoose';
import { IUser, IAddress } from '../types';

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
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v: string) {
        // Allow test phone number or valid Indian phone numbers
        return v === '1234567890' || /^[6-9]\d{9}$/.test(v);
      },
      message: 'Phone number must be a valid Indian mobile number or test number'
    }
  },
  isVerified: {
    type: Boolean,
    default: false
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

// Middleware to ensure only one default address
userSchema.pre('save', function(next) {
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

export const User = mongoose.model<IUser>('User', userSchema);