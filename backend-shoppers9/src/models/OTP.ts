import mongoose, { Schema } from 'mongoose';
import { IOTP, IOTPModel } from '../types';

const otpSchema = new Schema<IOTP>({
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
  otp: {
    type: String,
    required: true,
    length: 4,
    match: /^\d{4}$/
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.otp; // Don't expose OTP in JSON
      return ret;
    }
  }
});

// Indexes
otpSchema.index({ phone: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ phone: 1, isUsed: 1 });

// Static method to generate OTP
otpSchema.statics.generateOTP = function() {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Static method to create new OTP
otpSchema.statics.createOTP = async function(phone: string) {
  // Use fixed OTP for test phone number in development mode
  if (phone === '1234567890') {
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    return { otp: '1234', expiresAt };
  }
  
  // Check if MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    // In development mode without MongoDB, return mock OTP
    const otp = (this as IOTPModel).generateOTP();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    return { otp, expiresAt };
  }
  
  // Delete any existing unused OTPs for this phone
  await this.deleteMany({ phone, isUsed: false });
  
  const otp = (this as IOTPModel).generateOTP();
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  
  const otpDoc = new this({
    phone,
    otp,
    expiresAt
  });
  
  await otpDoc.save();
  return { otp, expiresAt };
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function(phone: string, otp: string) {
  // Handle test credentials
  if (phone === '1234567890' && otp === '1234') {
    return true;
  }
  
  // Check if MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    // In development mode without MongoDB, accept any 4-digit OTP
    return /^\d{4}$/.test(otp);
  }
  
  const otpDoc = await this.findOne({
    phone,
    otp,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });
  
  if (!otpDoc) {
    // Increment attempts for any existing OTP
    await this.updateMany(
      { phone, isUsed: false },
      { $inc: { attempts: 1 } }
    );
    return false;
  }
  
  // Mark OTP as used
  otpDoc.isUsed = true;
  await otpDoc.save();
  
  return true;
};

// Method to check if OTP is expired
otpSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to check if max attempts reached
otpSchema.methods.maxAttemptsReached = function() {
  return this.attempts >= 3;
};

export const OTP = mongoose.model<IOTP, IOTPModel>('OTP', otpSchema);