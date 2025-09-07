import mongoose, { Schema } from 'mongoose';
import { ICategoryFilter } from '../types';

const categoryFilterSchema = new Schema<ICategoryFilter>({
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  } as any,
  filter: {
    type: Schema.Types.ObjectId,
    ref: 'Filter',
    required: true
  } as any,
  isRequired: {
    type: Boolean,
    default: false
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
categoryFilterSchema.index({ category: 1, filter: 1 }, { unique: true });
categoryFilterSchema.index({ category: 1 });
categoryFilterSchema.index({ filter: 1 });
categoryFilterSchema.index({ isActive: 1 });
categoryFilterSchema.index({ sortOrder: 1 });

const CategoryFilter = mongoose.model<ICategoryFilter>('CategoryFilter', categoryFilterSchema);

export default CategoryFilter;