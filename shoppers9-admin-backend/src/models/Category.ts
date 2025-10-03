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
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true
  },
  image: {
    type: String,
    trim: true
  },
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    required: true,
    enum: [1, 2, 3],
    default: 1
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
// Allow same category names under different parent categories
// Only enforce unique slugs globally
categorySchema.index({ name: 1, parentCategory: 1 }); // Non-unique index for queries
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ sortOrder: 1 });

// Pre-save middleware to validate hierarchy and generate slug
categorySchema.pre('save', async function(next) {
  try {
    // Validate hierarchy levels
    if (this.parentCategory) {
      const parent = await mongoose.model('Category').findById(this.parentCategory);
      if (!parent) {
        return next(new Error('Parent category not found'));
      }
      
      // Level 2 (Subcategory) can only have Level 1 (Category) as parent
      if (this.level === 2 && parent.level !== 1) {
        return next(new Error('Subcategory can only have a Category as parent'));
      }
      
      // Level 3 (Sub-Subcategory) can only have Level 2 (Subcategory) as parent
      if (this.level === 3 && parent.level !== 2) {
        return next(new Error('Sub-Subcategory can only have a Subcategory as parent'));
      }
    } else {
      // No parent means this must be Level 1 (Category)
      if (this.level !== 1) {
        return next(new Error('Only Categories (level 1) can have no parent'));
      }
    }
    
    // Always generate slug from name
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Make slug unique by adding parent info if needed
    if (this.parentCategory) {
      const parent = await mongoose.model('Category').findById(this.parentCategory);
      if (parent) {
        baseSlug = `${parent.slug}-${baseSlug}`;
      }
    }
    
    // Ensure slug uniqueness by checking for existing slugs
    let finalSlug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existingCategory = await mongoose.model('Category').findOne({ 
        slug: finalSlug,
        _id: { $ne: this._id } // Exclude current document when updating
      });
      
      if (!existingCategory) {
        break; // Slug is unique
      }
      
      // Add counter to make it unique
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = finalSlug;
    
    // Validate that slug is not empty
    if (!this.slug || this.slug.trim() === '') {
      return next(new Error('Failed to generate slug from category name'));
    }
    
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error('Unknown error'));
  }
});

const Category = mongoose.model<ICategory>('Category', categorySchema);

export default Category;
export { categorySchema };