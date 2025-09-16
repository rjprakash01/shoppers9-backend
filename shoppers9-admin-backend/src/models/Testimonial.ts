import mongoose, { Schema, Document } from 'mongoose';

export interface ITestimonial extends Document {
  // Customer Information
  customerName: string;
  customerEmail?: string;
  customerImage?: string;
  customerLocation?: string;
  customerTitle?: string; // e.g., "Verified Buyer", "Premium Customer"
  
  // Testimonial Content
  title: string;
  content: string;
  rating: number; // 1-5 stars
  
  // Product/Service Reference
  productId?: string;
  productName?: string;
  orderNumber?: string;
  
  // Display Settings
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  
  // Verification
  isVerified: boolean;
  verifiedBy?: string;
  verificationDate?: Date;
  
  // Media
  images?: string[];
  videoUrl?: string;
  
  // Metadata
  source: 'manual' | 'import' | 'api' | 'form';
  tags: string[];
  category: 'product' | 'service' | 'delivery' | 'support' | 'general';
  
  // Admin Notes
  adminNotes?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
  
  // Instance methods
  verify(verifiedBy: string): Promise<ITestimonial>;
  feature(modifiedBy: string): Promise<ITestimonial>;
  unfeature(modifiedBy: string): Promise<ITestimonial>;
  activate(modifiedBy: string): Promise<ITestimonial>;
  deactivate(modifiedBy: string): Promise<ITestimonial>;
}

// Add static methods interface
interface ITestimonialModel extends mongoose.Model<ITestimonial> {
  getFeatured(limit?: number): Promise<ITestimonial[]>;
  getByCategory(category: string, limit?: number): Promise<ITestimonial[]>;
  getByRating(minRating?: number, limit?: number): Promise<ITestimonial[]>;
  getByProduct(productId: string): Promise<ITestimonial[]>;
}

const testimonialSchema = new Schema<ITestimonial>({
  // Customer Information
  customerName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  customerImage: {
    type: String,
    trim: true
  },
  customerLocation: {
    type: String,
    trim: true,
    maxlength: 100
  },
  customerTitle: {
    type: String,
    trim: true,
    maxlength: 50,
    default: 'Verified Customer'
  },
  
  // Testimonial Content
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: function(v: number) {
        return Number.isInteger(v) || (v % 0.5 === 0);
      },
      message: 'Rating must be a whole number or half number between 1 and 5'
    }
  },
  
  // Product/Service Reference
  productId: {
    type: String,
    trim: true
  },
  productName: {
    type: String,
    trim: true,
    maxlength: 200
  },
  orderNumber: {
    type: String,
    trim: true
  },
  
  // Display Settings
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  displayOrder: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: String,
    trim: true
  },
  verificationDate: {
    type: Date
  },
  
  // Media
  images: [{
    type: String,
    trim: true
  }],
  videoUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true;
        return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com)/.test(v);
      },
      message: 'Please enter a valid video URL (YouTube or Vimeo)'
    }
  },
  
  // Metadata
  source: {
    type: String,
    enum: ['manual', 'import', 'api', 'form'],
    default: 'manual',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    enum: ['product', 'service', 'delivery', 'support', 'general'],
    default: 'general',
    required: true
  },
  
  // Admin Notes
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Metadata
  createdBy: {
    type: String,
    required: true,
    default: 'admin'
  },
  lastModifiedBy: {
    type: String,
    required: true,
    default: 'admin'
  }
}, {
  timestamps: true
});

// Indexes for better performance
testimonialSchema.index({ isActive: 1, isFeatured: -1, displayOrder: 1 });
testimonialSchema.index({ rating: -1 });
testimonialSchema.index({ category: 1, isActive: 1 });
testimonialSchema.index({ productId: 1 });
testimonialSchema.index({ createdAt: -1 });
testimonialSchema.index({ customerEmail: 1 });
testimonialSchema.index({ tags: 1 });

// Virtual for star display
testimonialSchema.virtual('starDisplay').get(function() {
  const fullStars = Math.floor(this.rating);
  const hasHalfStar = this.rating % 1 !== 0;
  const emptyStars = 5 - Math.ceil(this.rating);
  
  return {
    full: fullStars,
    half: hasHalfStar ? 1 : 0,
    empty: emptyStars
  };
});

// Pre-save middleware
testimonialSchema.pre('save', function(next) {
  // Auto-verify if created by admin
  if (this.isNew && this.createdBy === 'admin' && !this.isVerified) {
    this.isVerified = true;
    this.verifiedBy = this.createdBy;
    this.verificationDate = new Date();
  }
  
  // Ensure featured testimonials have higher display order
  if (this.isFeatured && this.displayOrder === 0) {
    this.displayOrder = 1000;
  }
  
  next();
});

// Static methods
testimonialSchema.statics.getFeatured = function(limit = 6) {
  return this.find({ 
    isActive: true, 
    isFeatured: true 
  })
  .sort({ displayOrder: -1, rating: -1, createdAt: -1 })
  .limit(limit);
};

testimonialSchema.statics.getByCategory = function(category: string, limit = 10) {
  return this.find({ 
    isActive: true, 
    category: category 
  })
  .sort({ isFeatured: -1, rating: -1, createdAt: -1 })
  .limit(limit);
};

testimonialSchema.statics.getByRating = function(minRating = 4, limit = 10) {
  return this.find({ 
    isActive: true, 
    rating: { $gte: minRating } 
  })
  .sort({ rating: -1, isFeatured: -1, createdAt: -1 })
  .limit(limit);
};

testimonialSchema.statics.getByProduct = function(productId: string) {
  return this.find({ 
    isActive: true, 
    productId: productId 
  })
  .sort({ rating: -1, createdAt: -1 });
};

// Instance methods
testimonialSchema.methods.verify = function(verifiedBy: string) {
  this.isVerified = true;
  this.verifiedBy = verifiedBy;
  this.verificationDate = new Date();
  this.lastModifiedBy = verifiedBy;
  return this.save();
};

testimonialSchema.methods.feature = function(modifiedBy: string) {
  this.isFeatured = true;
  this.displayOrder = this.displayOrder || 1000;
  this.lastModifiedBy = modifiedBy;
  return this.save();
};

testimonialSchema.methods.unfeature = function(modifiedBy: string) {
  this.isFeatured = false;
  this.lastModifiedBy = modifiedBy;
  return this.save();
};

testimonialSchema.methods.activate = function(modifiedBy: string) {
  this.isActive = true;
  this.lastModifiedBy = modifiedBy;
  return this.save();
};

testimonialSchema.methods.deactivate = function(modifiedBy: string) {
  this.isActive = false;
  this.lastModifiedBy = modifiedBy;
  return this.save();
};

export const Testimonial = mongoose.model<ITestimonial, ITestimonialModel>('Testimonial', testimonialSchema);
export default Testimonial;