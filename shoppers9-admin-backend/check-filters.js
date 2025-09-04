const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9_admin')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define schemas directly
const categorySchema = new mongoose.Schema({
  name: String,
  level: Number,
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
}, { timestamps: true });

const filterSchema = new mongoose.Schema({
  name: String,
  displayName: String,
  type: String,
  dataType: String,
  description: String,
  isActive: Boolean,
  sortOrder: Number
}, { timestamps: true });

const filterOptionSchema = new mongoose.Schema({
  filter: { type: mongoose.Schema.Types.ObjectId, ref: 'Filter' },
  value: String,
  displayValue: String,
  colorCode: String,
  isActive: Boolean,
  sortOrder: Number
}, { timestamps: true });

const categoryFilterSchema = new mongoose.Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  filter: { type: mongoose.Schema.Types.ObjectId, ref: 'Filter' },
  isRequired: Boolean,
  isActive: Boolean,
  sortOrder: Number
}, { timestamps: true });

// Create models
const Category = mongoose.model('Category', categorySchema);
const Filter = mongoose.model('Filter', filterSchema);
const FilterOption = mongoose.model('FilterOption', filterOptionSchema);
const CategoryFilter = mongoose.model('CategoryFilter', categoryFilterSchema);

async function assignFiltersToTShirts() {
  try {
    console.log('\n=== ASSIGNING FILTERS TO T-SHIRTS CATEGORY ===\n');
    
    // Find T-Shirts category
    const tshirtCategory = await Category.findOne({ 
      name: { $regex: /t-shirt/i },
      level: 3 
    });
    
    if (!tshirtCategory) {
      console.log('❌ T-Shirts category not found!');
      return;
    }
    
    console.log(`Found T-Shirts category: ${tshirtCategory.name} (ID: ${tshirtCategory._id})`);
    
    // Find existing filters that are suitable for clothing
    const sizeFilter = await Filter.findOne({ name: 'size' });
    const colorFilter = await Filter.findOne({ name: 'color' });
    const materialFilter = await Filter.findOne({ name: 'material' });
    
    console.log('\nFound existing filters:');
    if (sizeFilter) console.log(`  - Size filter: ${sizeFilter.displayName}`);
    if (colorFilter) console.log(`  - Color filter: ${colorFilter.displayName}`);
    if (materialFilter) console.log(`  - Material filter: ${materialFilter.displayName}`);
    
    // Check if filters are already assigned
    const existingAssignments = await CategoryFilter.find({ category: tshirtCategory._id });
    console.log(`\nExisting filter assignments: ${existingAssignments.length}`);
    
    // Assign Size filter (required)
    if (sizeFilter) {
      const existingSizeAssignment = await CategoryFilter.findOne({ 
        category: tshirtCategory._id, 
        filter: sizeFilter._id 
      });
      
      if (!existingSizeAssignment) {
        const sizeCategoryFilter = new CategoryFilter({
          category: tshirtCategory._id,
          filter: sizeFilter._id,
          isRequired: true,
          isActive: true,
          sortOrder: 1
        });
        await sizeCategoryFilter.save();
        console.log('✅ Assigned Size filter to T-Shirts (Required)');
      } else {
        console.log('ℹ️  Size filter already assigned to T-Shirts');
      }
    }
    
    // Assign Color filter (optional)
    if (colorFilter) {
      const existingColorAssignment = await CategoryFilter.findOne({ 
        category: tshirtCategory._id, 
        filter: colorFilter._id 
      });
      
      if (!existingColorAssignment) {
        const colorCategoryFilter = new CategoryFilter({
          category: tshirtCategory._id,
          filter: colorFilter._id,
          isRequired: false,
          isActive: true,
          sortOrder: 2
        });
        await colorCategoryFilter.save();
        console.log('✅ Assigned Color filter to T-Shirts (Optional)');
      } else {
        console.log('ℹ️  Color filter already assigned to T-Shirts');
      }
    }
    
    // Assign Material filter (optional)
    if (materialFilter) {
      const existingMaterialAssignment = await CategoryFilter.findOne({ 
        category: tshirtCategory._id, 
        filter: materialFilter._id 
      });
      
      if (!existingMaterialAssignment) {
        const materialCategoryFilter = new CategoryFilter({
          category: tshirtCategory._id,
          filter: materialFilter._id,
          isRequired: false,
          isActive: true,
          sortOrder: 3
        });
        await materialCategoryFilter.save();
        console.log('✅ Assigned Material filter to T-Shirts (Optional)');
      } else {
        console.log('ℹ️  Material filter already assigned to T-Shirts');
      }
    }
    
    // Verify assignments
    const finalAssignments = await CategoryFilter.find({ category: tshirtCategory._id })
      .populate('filter', 'displayName type');
    
    console.log(`\n🎉 T-Shirts category now has ${finalAssignments.length} filters assigned:`);
    finalAssignments.forEach(cf => {
      console.log(`  - ${cf.filter.displayName} (${cf.filter.type}, Required: ${cf.isRequired})`);
    });
    
  } catch (error) {
    console.error('Error assigning filters:', error);
  } finally {
    mongoose.connection.close();
  }
}

assignFiltersToTShirts();