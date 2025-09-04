const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/shoppers9-admin');

// Define Category schema (matching the actual model)
const categorySchema = new mongoose.Schema({
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
    type: mongoose.Schema.Types.ObjectId,
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

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
        break;
      }
      
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = finalSlug;
    next();
  } catch (error) {
    next(error);
  }
});

const Category = mongoose.model('Category', categorySchema);

async function testCategoryHierarchy() {
  try {
    console.log('=== TESTING CATEGORY HIERARCHY ===\n');
    
    // Clear existing categories
    await Category.deleteMany({});
    console.log('✅ Cleared existing categories\n');
    
    // Test 1: Create Level 1 Category
    console.log('🧪 Test 1: Creating Level 1 Category...');
    const level1Category = await Category.create({
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      level: 1,
      isActive: true,
      sortOrder: 1
    });
    
    console.log('✅ Level 1 Category Created:');
    console.log(`   ID: ${level1Category._id}`);
    console.log(`   Name: ${level1Category.name}`);
    console.log(`   Level: ${level1Category.level}`);
    console.log(`   Parent: ${level1Category.parentCategory}`);
    console.log(`   Slug: ${level1Category.slug}\n`);
    
    // Test 2: Create Level 2 Category with correct parent
    console.log('🧪 Test 2: Creating Level 2 Category with correct parent...');
    const level2Category = await Category.create({
      name: 'Smartphones',
      description: 'Mobile phones and smartphones',
      parentCategory: level1Category._id,
      level: 2,
      isActive: true,
      sortOrder: 1
    });
    
    console.log('✅ Level 2 Category Created:');
    console.log(`   ID: ${level2Category._id}`);
    console.log(`   Name: ${level2Category.name}`);
    console.log(`   Level: ${level2Category.level}`);
    console.log(`   Parent: ${level2Category.parentCategory}`);
    console.log(`   Slug: ${level2Category.slug}\n`);
    
    // Test 3: Simulate the controller logic
    console.log('🧪 Test 3: Simulating Controller Logic...');
    
    // This simulates what the controller does
    const requestBody = {
      name: 'Tablets',
      description: 'Tablet computers',
      parentCategory: level1Category._id.toString(), // This is how it comes from frontend
      isActive: true,
      sortOrder: 2
    };
    
    console.log('📤 Simulated request body:', JSON.stringify(requestBody, null, 2));
    
    // Extract parent ID (controller logic)
    let parentCategoryId = null;
    if (requestBody.parentCategory) {
      if (typeof requestBody.parentCategory === 'object' && requestBody.parentCategory.id) {
        parentCategoryId = requestBody.parentCategory.id;
      } else if (typeof requestBody.parentCategory === 'string' && requestBody.parentCategory !== '') {
        parentCategoryId = requestBody.parentCategory;
      }
    }
    
    console.log(`🔍 Extracted parent ID: ${parentCategoryId}`);
    
    // Determine level based on parent (controller logic)
    let level = 1; // Default to level 1
    if (parentCategoryId) {
      const parentCategory = await Category.findById(parentCategoryId);
      if (!parentCategory) {
        throw new Error('Parent category not found');
      }
      level = parentCategory.level + 1;
      console.log(`🔍 Parent level: ${parentCategory.level}, calculated child level: ${level}`);
    }
    
    const categoryData = {
      ...requestBody,
      parentCategory: parentCategoryId,
      level: level
    };
    
    console.log('📊 Final category data:', JSON.stringify(categoryData, null, 2));
    
    const level2Category2 = await Category.create(categoryData);
    
    console.log('✅ Level 2 Category (via controller logic) Created:');
    console.log(`   ID: ${level2Category2._id}`);
    console.log(`   Name: ${level2Category2.name}`);
    console.log(`   Level: ${level2Category2.level}`);
    console.log(`   Parent: ${level2Category2.parentCategory}`);
    console.log(`   Slug: ${level2Category2.slug}\n`);
    
    // Final check: List all categories
    console.log('📋 All Categories in Database:');
    const allCategories = await Category.find({}).populate('parentCategory');
    allCategories.forEach(cat => {
      console.log(`   - ${cat.name} (Level: ${cat.level}, Parent: ${cat.parentCategory ? cat.parentCategory.name : 'None'}, Slug: ${cat.slug})`);
    });
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    mongoose.disconnect();
  }
}

testCategoryHierarchy();