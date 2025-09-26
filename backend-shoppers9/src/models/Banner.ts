import mongoose, { Schema } from 'mongoose';
import { Document } from 'mongoose';

export interface IBanner extends Document {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  link?: string;
  buttonText?: string;
  isActive: boolean;
  order: number; // 1 = hero banner, 2-5 = grid banners
  startDate?: Date;
  endDate?: Date;
  categoryId?: string; // For category-specific banners
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: 150
  },
  description: {
    type: String,
    trim: true,
    maxlength: 300
  },
  image: {
    type: String,
    required: true,
    trim: true
  },
  link: {
    type: String,
    trim: true
  },
  buttonText: {
    type: String,
    trim: true,
    maxlength: 30
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  categoryId: {
    type: String,
    trim: true,
    required: true,
    validate: {
      validator: function(value: string) {
        return !!(value && value.trim().length > 0);
      },
      message: 'Category ID is required for all banners'
    }
  }
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
bannerSchema.index({ isActive: 1, order: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });
bannerSchema.index({ createdAt: -1 });

// Method to check if banner is currently active
bannerSchema.methods.isCurrentlyActive = function() {
  if (!this.isActive) return false;
  
  const now = new Date();
  
  if (this.startDate && now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;
  
  return true;
};

export const Banner = mongoose.model<IBanner>('Banner', bannerSchema);