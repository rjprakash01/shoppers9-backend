import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  // Delivery Settings
  freeDeliveryMinAmount: number;
  deliveryFee: number;
  deliveryFeeThreshold: number;
  
  // Platform Settings
  platformFee: number;
  platformFeeType: 'fixed' | 'percentage';
  
  // Tax Settings
  taxRate: number;
  taxIncluded: boolean;
  
  // Order Settings
  minOrderAmount: number;
  maxOrderAmount: number;
  
  // Payment Settings
  codEnabled: boolean;
  onlinePaymentEnabled: boolean;
  
  // Business Settings
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  
  // Operational Settings
  orderProcessingTime: number; // in hours
  deliveryTimeMin: number; // in days
  deliveryTimeMax: number; // in days
  
  // Return/Refund Settings
  returnPolicyDays: number;
  refundProcessingDays: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy: string;
  
  // Instance methods
  updateSettings(updates: Partial<ISettings>, modifiedBy: string): Promise<ISettings>;
}

const settingsSchema = new Schema<ISettings>({
  // Delivery Settings
  freeDeliveryMinAmount: {
    type: Number,
    required: true,
    default: 500,
    min: 0
  },
  deliveryFee: {
    type: Number,
    required: true,
    default: 50,
    min: 0
  },
  deliveryFeeThreshold: {
    type: Number,
    required: true,
    default: 500,
    min: 0
  },
  
  // Platform Settings
  platformFee: {
    type: Number,
    required: true,
    default: 20,
    min: 0
  },
  platformFeeType: {
    type: String,
    enum: ['fixed', 'percentage'],
    default: 'fixed',
    required: true
  },
  
  // Tax Settings
  taxRate: {
    type: Number,
    required: true,
    default: 18,
    min: 0,
    max: 100
  },
  taxIncluded: {
    type: Boolean,
    default: true
  },
  
  // Order Settings
  minOrderAmount: {
    type: Number,
    required: true,
    default: 100,
    min: 0
  },
  maxOrderAmount: {
    type: Number,
    required: true,
    default: 50000,
    min: 0
  },
  
  // Payment Settings
  codEnabled: {
    type: Boolean,
    default: true
  },
  onlinePaymentEnabled: {
    type: Boolean,
    default: true
  },
  
  // Business Settings
  businessName: {
    type: String,
    required: true,
    default: 'Shoppers9',
    trim: true
  },
  businessEmail: {
    type: String,
    required: true,
    default: 'admin@shoppers9.com',
    trim: true,
    lowercase: true
  },
  businessPhone: {
    type: String,
    required: true,
    default: '+91-9876543210',
    trim: true
  },
  businessAddress: {
    type: String,
    required: true,
    default: 'Business Address, City, State, PIN',
    trim: true
  },
  
  // Operational Settings
  orderProcessingTime: {
    type: Number,
    required: true,
    default: 24, // 24 hours
    min: 1
  },
  deliveryTimeMin: {
    type: Number,
    required: true,
    default: 3, // 3 days
    min: 1
  },
  deliveryTimeMax: {
    type: Number,
    required: true,
    default: 7, // 7 days
    min: 1
  },
  
  // Return/Refund Settings
  returnPolicyDays: {
    type: Number,
    required: true,
    default: 7,
    min: 0
  },
  refundProcessingDays: {
    type: Number,
    required: true,
    default: 5,
    min: 1
  },
  
  // Metadata
  lastModifiedBy: {
    type: String,
    required: true,
    default: 'system'
  }
}, {
  timestamps: true
});

// Indexes for better performance
settingsSchema.index({ lastModifiedBy: 1 });
settingsSchema.index({ updatedAt: -1 });

// Validation middleware
settingsSchema.pre('save', function(next) {
  // Ensure delivery fee threshold is not greater than free delivery minimum
  if (this.deliveryFeeThreshold > this.freeDeliveryMinAmount) {
    this.deliveryFeeThreshold = this.freeDeliveryMinAmount;
  }
  
  // Ensure min order amount is not greater than max order amount
  if (this.minOrderAmount > this.maxOrderAmount) {
    const temp = this.minOrderAmount;
    this.minOrderAmount = this.maxOrderAmount;
    this.maxOrderAmount = temp;
  }
  
  // Ensure delivery time min is not greater than max
  if (this.deliveryTimeMin > this.deliveryTimeMax) {
    const temp = this.deliveryTimeMin;
    this.deliveryTimeMin = this.deliveryTimeMax;
    this.deliveryTimeMax = temp;
  }
  
  next();
});

// Static method to get current settings (singleton pattern)
settingsSchema.statics.getCurrentSettings = async function() {
  let settings = await this.findOne().sort({ updatedAt: -1 });
  
  if (!settings) {
    // Create default settings if none exist
    settings = new this({});
    await settings.save();
  }
  
  return settings;
};

// Add static method to interface
interface ISettingsModel extends mongoose.Model<ISettings> {
  getCurrentSettings(): Promise<ISettings>;
}

// Instance method to update settings
settingsSchema.methods.updateSettings = async function(updates: Partial<ISettings>, modifiedBy: string) {
  Object.assign(this, updates);
  this.lastModifiedBy = modifiedBy;
  return await this.save();
};

export const Settings = mongoose.model<ISettings, ISettingsModel>('Settings', settingsSchema);
export default Settings;