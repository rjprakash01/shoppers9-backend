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
  displayType?: 'carousel' | 'price-range';
  categoryId?: string;
  priceRange?: {
    minPrice?: number;
    maxPrice?: number;
    label: string;
    color?: string;
  };
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
    enum: ['carousel', 'price-range'],
    default: 'carousel'
  },
  categoryId: {
    type: String,
    // Optional field for legacy support
  },
  priceRange: {
    type: {
      minPrice: {
        type: Number,
        min: 0
      },
      maxPrice: {
        type: Number,
        min: 0
      },
      label: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
      },
      color: {
        type: String,
        trim: true,
        validate: {
          validator: function(value: string) {
            if (!value) return true; // Allow empty values
            // Allow hex colors (#RGB or #RRGGBB)
            const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
            // Allow CSS gradients (linear-gradient, radial-gradient, etc.)
            const gradientPattern = /^(linear-gradient|radial-gradient|conic-gradient)\s*\(/;
            return hexPattern.test(value) || gradientPattern.test(value);
          },
          message: 'Color must be a valid hex color (#RGB or #RRGGBB) or CSS gradient'
        },
        default: '#3B82F6'
      }
    },
    validate: {
      validator: function(this: IBanner, value: any) {
        // Price range is required if displayType is 'price-range'
        if (this.displayType === 'price-range' && !value) {
          return false;
        }
        // Validate that maxPrice is greater than minPrice if both are provided
        if (value && value.minPrice !== undefined && value.maxPrice !== undefined) {
          return value.maxPrice > value.minPrice;
        }
        return true;
      },
      message: 'Price range is required for price-range display type and maxPrice must be greater than minPrice'
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