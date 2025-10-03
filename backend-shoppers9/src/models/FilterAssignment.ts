import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFilterAssignment extends Document {
  filter: Types.ObjectId;
  category: Types.ObjectId;
  categoryLevel: number;
  parentAssignment?: Types.ObjectId;
  isRequired?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  assignedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFilterAssignmentModel extends mongoose.Model<IFilterAssignment> {
  getHierarchicalFilters(categoryId: mongoose.Types.ObjectId): Promise<any>;
  findByCategory(categoryId: mongoose.Types.ObjectId, includeInactive?: boolean): Promise<any>;
  findByFilter(filterId: mongoose.Types.ObjectId, includeInactive?: boolean): Promise<any>;
  findAvailableFiltersForCategory(categoryId: mongoose.Types.ObjectId): Promise<any>;
}

const filterAssignmentSchema = new Schema<IFilterAssignment>({
  filter: {
    type: Schema.Types.ObjectId,
    ref: 'Filter',
    required: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  categoryLevel: {
    type: Number,
    required: true,
    enum: [1, 2, 3], // 1=Category, 2=Subcategory, 3=Product Type
    validate: {
      validator: function(level: number) {
        return [1, 2, 3].includes(level);
      },
      message: 'Category level must be 1 (Category), 2 (Subcategory), or 3 (Product Type)'
    }
  },
  parentAssignment: {
    type: Schema.Types.ObjectId,
    ref: 'FilterAssignment',
    default: null
  },
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
  assignedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
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
filterAssignmentSchema.index({ filter: 1, category: 1 }, { unique: true });
filterAssignmentSchema.index({ filter: 1 });
filterAssignmentSchema.index({ category: 1 });
filterAssignmentSchema.index({ categoryLevel: 1 });
filterAssignmentSchema.index({ parentAssignment: 1 });
filterAssignmentSchema.index({ isActive: 1 });
filterAssignmentSchema.index({ sortOrder: 1 });
filterAssignmentSchema.index({ assignedAt: -1 });

// Compound indexes for common queries
filterAssignmentSchema.index({ categoryLevel: 1, isActive: 1 });
filterAssignmentSchema.index({ filter: 1, categoryLevel: 1, isActive: 1 });

// Static methods for querying
filterAssignmentSchema.statics.findByCategory = function(categoryId: mongoose.Types.ObjectId, includeInactive = false) {
  const query: any = { category: categoryId };
  if (!includeInactive) {
    query.isActive = true;
  }
  return this.find(query).populate('filter').sort({ sortOrder: 1, assignedAt: 1 });
};

filterAssignmentSchema.statics.findByFilter = function(filterId: mongoose.Types.ObjectId, includeInactive = false) {
  const query: any = { filter: filterId };
  if (!includeInactive) {
    query.isActive = true;
  }
  return this.find(query).populate('category').sort({ categoryLevel: 1, sortOrder: 1 });
};

filterAssignmentSchema.statics.getHierarchicalFilters = function(categoryId: mongoose.Types.ObjectId) {
  return this.aggregate([
    {
      $match: {
        category: categoryId,
        isActive: true
      }
    },
    {
      $lookup: {
        from: 'filters',
        localField: 'filter',
        foreignField: '_id',
        as: 'filterInfo'
      }
    },
    {
      $unwind: '$filterInfo'
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    {
      $unwind: '$categoryInfo'
    },
    {
      $sort: { categoryLevel: 1, sortOrder: 1 }
    }
  ]);
};

const FilterAssignment = mongoose.model<IFilterAssignment, IFilterAssignmentModel>('FilterAssignment', filterAssignmentSchema);

export default FilterAssignment;