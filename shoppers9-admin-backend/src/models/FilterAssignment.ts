import mongoose, { Schema } from 'mongoose';
import { IFilterAssignment } from '../types';

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
    default: null,
    validate: {
      validator: async function(parentId: mongoose.Types.ObjectId) {
        if (!parentId) {
          // Level 1 categories should not have parent assignments
          return this.categoryLevel === 1;
        }
        
        // For levels 2 and 3, parent assignment must exist
        if (this.categoryLevel === 1) {
          return false; // Level 1 should not have parent
        }
        
        const parent = await mongoose.model('FilterAssignment').findById(parentId);
        if (!parent) return false;
        
        // Parent must have the same filter
        if (!parent.filter.equals(this.filter)) return false;
        
        // Parent level must be exactly one level above
        return parent.categoryLevel === this.categoryLevel - 1;
      },
      message: 'Invalid parent assignment: parent must exist, have same filter, and be one level above'
    }
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

// Pre-save middleware to validate hierarchy
filterAssignmentSchema.pre('save', async function(next) {
  try {
    // Validate category level matches the actual category's level
    const category = await mongoose.model('Category').findById(this.category);
    if (!category) {
      return next(new Error('Category not found'));
    }
    
    if (category.level !== this.categoryLevel) {
      return next(new Error(`Category level mismatch: category has level ${category.level}, assignment has level ${this.categoryLevel}`));
    }
    
    // For level 2 and 3, validate parent assignment exists and is valid
    if (this.categoryLevel > 1) {
      if (!this.parentAssignment) {
        return next(new Error(`Level ${this.categoryLevel} assignments must have a parent assignment`));
      }
      
      const parent = await mongoose.model('FilterAssignment').findById(this.parentAssignment);
      if (!parent) {
        return next(new Error('Parent assignment not found'));
      }
      
      // Validate parent category is actually the parent of current category
      if (!category.parentCategory || !category.parentCategory.equals(parent.category)) {
        return next(new Error('Parent assignment category must match the parent category'));
      }
    }
    
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error('Unknown validation error'));
  }
});

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

filterAssignmentSchema.statics.findAvailableFiltersForCategory = function(categoryId: mongoose.Types.ObjectId) {
  return this.aggregate([
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
      $match: {
        $or: [
          { category: categoryId }, // Direct assignments
          { 
            'categoryInfo.parentCategory': categoryId, // Parent category assignments
            isActive: true
          }
        ]
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
      $group: {
        _id: '$filter',
        filter: { $first: '$filterInfo' },
        assignments: { $push: '$$ROOT' }
      }
    }
  ]);
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

const FilterAssignment = mongoose.model<IFilterAssignment>('FilterAssignment', filterAssignmentSchema);

export default FilterAssignment;