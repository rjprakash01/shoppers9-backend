import mongoose, { Schema } from 'mongoose';
import { IShippingProvider, IShippingRate, IShipment, ITrackingEvent } from '../types';

// Tracking Event Schema
const trackingEventSchema = new Schema<ITrackingEvent>({
  status: {
    type: String,
    required: true,
    enum: ['picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned']
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  estimatedDelivery: {
    type: Date
  }
});

// Shipment Schema
const shipmentSchema = new Schema<IShipment>({
  shipmentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  orderNumber: {
    type: String,
    required: true,
    ref: 'Order'
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'ShippingProvider'
  },
  trackingNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned'],
    default: 'pending'
  },
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String }
  },
  packageDetails: {
    weight: { type: Number, required: true }, // in kg
    dimensions: {
      length: { type: Number, required: true }, // in cm
      width: { type: Number, required: true },
      height: { type: Number, required: true }
    },
    value: { type: Number, required: true }, // package value for insurance
    description: { type: String, required: true }
  },
  shippingCost: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedDelivery: {
    type: Date,
    required: true
  },
  actualDelivery: {
    type: Date
  },
  trackingEvents: [trackingEventSchema],
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Shipping Rate Schema
const shippingRateSchema = new Schema<IShippingRate>({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'ShippingProvider'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['standard', 'express', 'overnight', 'same_day']
  },
  deliveryTime: {
    min: { type: Number, required: true }, // minimum days
    max: { type: Number, required: true }  // maximum days
  },
  rateStructure: {
    type: {
      type: String,
      required: true,
      enum: ['flat', 'weight_based', 'distance_based', 'value_based']
    },
    baseRate: {
      type: Number,
      required: true,
      min: 0
    },
    // For weight-based pricing
    weightRanges: [{
      minWeight: { type: Number, required: true }, // in kg
      maxWeight: { type: Number, required: true },
      rate: { type: Number, required: true }
    }],
    // For distance-based pricing
    distanceRanges: [{
      minDistance: { type: Number, required: true }, // in km
      maxDistance: { type: Number, required: true },
      rate: { type: Number, required: true }
    }],
    // For value-based pricing
    valuePercentage: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  zones: [{
    name: { type: String, required: true },
    pincodes: [{ type: String, required: true }],
    multiplier: { type: Number, required: true, default: 1 }
  }],
  freeShippingThreshold: {
    type: Number,
    min: 0
  },
  maxWeight: {
    type: Number,
    required: true
  },
  maxValue: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Shipping Provider Schema
const shippingProviderSchema = new Schema<IShippingProvider>({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    trim: true
  },
  contactInfo: {
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    website: { type: String, trim: true },
    supportUrl: { type: String, trim: true }
  },
  apiConfig: {
    baseUrl: { type: String, trim: true },
    apiKey: { type: String, trim: true },
    secretKey: { type: String, trim: true },
    trackingUrl: { type: String, trim: true },
    webhookUrl: { type: String, trim: true }
  },
  capabilities: {
    tracking: { type: Boolean, default: true },
    realTimeRates: { type: Boolean, default: false },
    pickupScheduling: { type: Boolean, default: false },
    insurance: { type: Boolean, default: false },
    codSupport: { type: Boolean, default: false }
  },
  serviceAreas: [{
    name: { type: String, required: true },
    pincodes: [{ type: String, required: true }],
    isActive: { type: Boolean, default: true }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
shipmentSchema.index({ orderNumber: 1 });
shipmentSchema.index({ trackingNumber: 1 });
shipmentSchema.index({ status: 1 });
shipmentSchema.index({ providerId: 1 });
shipmentSchema.index({ createdAt: -1 });

shippingRateSchema.index({ providerId: 1 });
shippingRateSchema.index({ serviceType: 1 });
shippingRateSchema.index({ isActive: 1 });

shippingProviderSchema.index({ code: 1 });
shippingProviderSchema.index({ isActive: 1 });
shippingProviderSchema.index({ priority: -1 });

// Virtual fields
shipmentSchema.virtual('currentLocation').get(function(this: any) {
  if (this.trackingEvents && this.trackingEvents.length > 0) {
    return this.trackingEvents[this.trackingEvents.length - 1].location;
  }
  return null;
});

shipmentSchema.virtual('isDelivered').get(function(this: any) {
  return this.status === 'delivered';
});

shipmentSchema.virtual('isInTransit').get(function(this: any) {
  return ['picked_up', 'in_transit', 'out_for_delivery'].includes(this.status);
});

// Methods
shipmentSchema.methods.addTrackingEvent = function(status: string, location: string, description: string, estimatedDelivery?: Date) {
  this.trackingEvents.push({
    status,
    location,
    description,
    timestamp: new Date(),
    estimatedDelivery
  });
  
  // Update shipment status
  this.status = status;
  
  // Update estimated delivery if provided
  if (estimatedDelivery) {
    this.estimatedDelivery = estimatedDelivery;
  }
  
  // Set actual delivery date if delivered
  if (status === 'delivered') {
    this.actualDelivery = new Date();
  }
  
  return this.save();
};

shipmentSchema.methods.updateStatus = function(status: string, location?: string, description?: string) {
  this.status = status;
  
  if (location && description) {
    return this.addTrackingEvent(status, location, description);
  }
  
  return this.save();
};

// Pre-save middleware
shipmentSchema.pre('save', function(next) {
  if (this.isNew && !this.shipmentId) {
    // Generate shipment ID
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.shipmentId = `SHP${timestamp.slice(-6)}${random}`;
  }
  next();
});

shippingRateSchema.pre('save', function(next) {
  // Validate weight ranges
  if (this.rateStructure.type === 'weight_based' && this.rateStructure.weightRanges) {
    for (let i = 0; i < this.rateStructure.weightRanges.length; i++) {
      const range = this.rateStructure.weightRanges[i];
      if (range.minWeight >= range.maxWeight) {
        return next(new Error('Invalid weight range: minWeight must be less than maxWeight'));
      }
    }
  }
  
  // Validate distance ranges
  if (this.rateStructure.type === 'distance_based' && this.rateStructure.distanceRanges) {
    for (let i = 0; i < this.rateStructure.distanceRanges.length; i++) {
      const range = this.rateStructure.distanceRanges[i];
      if (range.minDistance >= range.maxDistance) {
        return next(new Error('Invalid distance range: minDistance must be less than maxDistance'));
      }
    }
  }
  
  next();
});

export const ShippingProvider = mongoose.model<IShippingProvider>('ShippingProvider', shippingProviderSchema);
export const ShippingRate = mongoose.model<IShippingRate>('ShippingRate', shippingRateSchema);
export const Shipment = mongoose.model<IShipment>('Shipment', shipmentSchema);