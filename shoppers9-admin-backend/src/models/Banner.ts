import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  link?: string;
  buttonText?: string;
  isActive: boolean;
  order: number;
  startDate?: Date;
  endDate?: Date;
  displayType?: 'carousel' | 'category-card' | 'both';
  categoryId?: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: 300
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  image: {
    type: String,
    required: true
  },
  link: {
    type: String,
    trim: true
  },
  buttonText: {
    type: String,
    trim: true,
    maxlength: 50
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
  displayType: {
    type: String,
    enum: ['carousel', 'category-card', 'both'],
    default: 'carousel'
  },
  categoryId: {
    type: String,
    validate: {
      validator: function(this: IBanner, value: string) {
        // Category is required if displayType is 'category-card' or 'both'
        if ((this.displayType === 'category-card' || this.displayType === 'both') && !value) {
          return false;
        }
        return true;
      },
      message: 'Category is required for category-card and both display types'
    }
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
      return ret;
    }
  }
});

// Indexes
bannerSchema.index({ isActive: 1, order: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });
bannerSchema.index({ createdAt: -1 });

const Banner = mongoose.model<IBanner>('Banner', bannerSchema);

export default Banner;