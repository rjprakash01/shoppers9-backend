import mongoose, { Schema } from 'mongoose';
import { IProductFilterValue } from '../types';

const productFilterValueSchema = new Schema<IProductFilterValue>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  } as any,
  filter: {
    type: Schema.Types.ObjectId,
    ref: 'Filter',
    required: true
  } as any,
  filterOption: {
    type: Schema.Types.ObjectId,
    ref: 'FilterOption',
    required: true
  } as any,
  customValue: {
    type: String,
    trim: true,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
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
productFilterValueSchema.index({ product: 1, filter: 1, filterOption: 1 }, { unique: true });
productFilterValueSchema.index({ product: 1 });
productFilterValueSchema.index({ filter: 1 });
productFilterValueSchema.index({ filterOption: 1 });
productFilterValueSchema.index({ isActive: 1 });

const ProductFilterValue = mongoose.model<IProductFilterValue>('ProductFilterValue', productFilterValueSchema);

export default ProductFilterValue;