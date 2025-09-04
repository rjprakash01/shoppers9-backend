import mongoose, { Schema } from 'mongoose';
import { IFilter } from '../types';

const filterSchema = new Schema<IFilter>({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    minlength: 2,
    maxlength: 50
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  type: {
    type: String,
    required: true,
    enum: ['single', 'multiple', 'range'],
    default: 'multiple'
  },
  dataType: {
    type: String,
    required: true,
    enum: ['string', 'number', 'boolean'],
    default: 'string'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  categoryLevels: {
    type: [Number],
    enum: [1, 2, 3],
    default: [2, 3], // Default to level 2 and 3 categories
    validate: {
      validator: function(levels: number[]) {
        return levels.length > 0 && levels.every(level => [1, 2, 3].includes(level));
      },
      message: 'Category levels must be an array containing values 1, 2, or 3'
    }
  },
  categories: {
    type: [Schema.Types.ObjectId],
    ref: 'Category',
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
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
filterSchema.index({ name: 1 });
filterSchema.index({ isActive: 1 });
filterSchema.index({ sortOrder: 1 });

const Filter = mongoose.model<IFilter>('Filter', filterSchema);

export default Filter;