import mongoose, { Schema } from 'mongoose';
import { IFilterOption } from '../types';

const filterOptionSchema = new Schema<IFilterOption>({
  filter: {
    type: Schema.Types.ObjectId,
    ref: 'Filter',
    required: true
  } as any,
  value: {
    type: String,
    required: true,
    trim: true
  },
  displayValue: {
    type: String,
    required: true,
    trim: true
  },
  colorCode: {
    type: String,
    trim: true,
    match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    default: null
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
filterOptionSchema.index({ filter: 1, value: 1 }, { unique: true });
filterOptionSchema.index({ filter: 1 });
filterOptionSchema.index({ isActive: 1 });
filterOptionSchema.index({ sortOrder: 1 });

const FilterOption = mongoose.model<IFilterOption>('FilterOption', filterOptionSchema);

export default FilterOption;