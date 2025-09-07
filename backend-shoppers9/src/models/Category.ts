import mongoose, { Schema } from 'mongoose';
import { ICategory } from '../types';

const categorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9-]+$/
  },
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  },
  level: {
    type: Number,
    required: true,
    enum: [1, 2, 3],
    default: 1
  },
  image: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
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
// slug already has unique index from schema definition
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ sortOrder: 1 });

// Pre-save middleware to generate slug from name if not provided
categorySchema.pre('save', function(next: any) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

export const Category = mongoose.model<ICategory>('Category', categorySchema);