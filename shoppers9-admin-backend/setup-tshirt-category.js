const mongoose = require('mongoose');

// Connect to admin backend MongoDB
mongoose.connect('mongodb://localhost:27017/shoppers9-admin');

// Define schemas
const CategoryFilter = mongoose.model('CategoryFilter', new mongoose.Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  filter: { type: mongoose.Schema.Types.ObjectId, ref: 'Filter' },
  isRequired: Boolean,
  isActive: Boolean,
  sortOrder: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

const Category = mongoose.model('Category', new mongoose.Schema({
  name: String,
  slug: String,
  level: Number,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}));

const Filter = mongoose.model('Filter', new mongoose.Schema({
  name: String,
  type: String,
  options: [{
    value: String,
    label: String,
    isActive: { type: Boolean, default: true }
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}));

async function setupTShirtCategory() {
  try {
    console.log('=== SETTING UP T-SHIRT CATEGORY AND FILTERS ===\n');
    
    // Step 1: Create Clothing category hierarchy if it doesn't exist
    let clothingCategory = await Category.findOne({ name: 'Clothing', level: 1 });
    if (!clothingCategory) {
      clothingCategory = new Category({
        name: 'Clothing',
        slug: 'clothing',
        level: 1,
        isActive: true
      });
      await clothingCategory.save();
      console.log('✅ Created Clothing category (Level 1)');
    } else {
      console.log('✅ Found existing Clothing category (Level 1)');
    }
    
    // Step 2: Create Men's Clothing subcategory
    let mensCategory = await Category.findOne({ name: "Men's Clothing", level: 2 });
    if (!mensCategory) {
      mensCategory = new Category({
        name: "Men's Clothing",
        slug: 'mens-clothing',
        level: 2,
        parent: clothingCategory._id,
        isActive: true
      });
      await mensCategory.save();
      console.log('✅ Created Men\'s Clothing category (Level 2)');
    } else {
      console.log('✅ Found existing Men\'s Clothing category (Level 2)');
    }
    
    // Step 3: Create T-Shirts category at level 3
    let tshirtCategory = await Category.findOne({ name: 'T-Shirts', level: 3 });
    if (!tshirtCategory) {
      tshirtCategory = new Category({
        name: 'T-Shirts',
        slug: 't-shirts',
        level: 3,
        parent: mensCategory._id,
        isActive: true
      });
      await tshirtCategory.save();
      console.log('✅ Created T-Shirts category (Level 3)');
    } else {
      console.log('✅ Found existing T-Shirts category (Level 3)');
    }
    
    console.log(`\nT-Shirts Category ID: ${tshirtCategory._id}\n`);
    
    // Step 4: Update existing filters with proper options
    const filterUpdates = [
      {
        name: 'size',
        type: 'single',
        options: [
          { value: 'xs', label: 'XS', isActive: true },
          { value: 's', label: 'S', isActive: true },
          { value: 'm', label: 'M', isActive: true },
          { value: 'l', label: 'L', isActive: true },
          { value: 'xl', label: 'XL', isActive: true },
          { value: 'xxl', label: 'XXL', isActive: true }
        ]
      },
      {
        name: 'color',
        type: 'multiple',
        options: [
          { value: 'black', label: 'Black', isActive: true },
          { value: 'white', label: 'White', isActive: true },
          { value: 'red', label: 'Red', isActive: true },
          { value: 'blue', label: 'Blue', isActive: true },
          { value: 'green', label: 'Green', isActive: true },
          { value: 'gray', label: 'Gray', isActive: true }
        ]
      },
      {
        name: 'material',
        type: 'single',
        options: [
          { value: 'cotton', label: 'Cotton', isActive: true },
          { value: 'polyester', label: 'Polyester', isActive: true },
          { value: 'blend', label: 'Cotton-Polyester Blend', isActive: true },
          { value: 'linen', label: 'Linen', isActive: true }
        ]
      }
    ];
    
    for (const filterData of filterUpdates) {
      const filter = await Filter.findOneAndUpdate(
        { name: filterData.name },
        { 
          type: filterData.type,
          options: filterData.options,
          isActive: true
        },
        { new: true }
      );
      
      if (filter) {
        console.log(`✅ Updated ${filter.name} filter with ${filter.options.length} options`);
      }
    }
    
    // Step 5: Assign filters to T-Shirts category
    const filtersToAssign = [
      { name: 'size', isRequired: true, sortOrder: 1 },
      { name: 'color', isRequired: false, sortOrder: 2 },
      { name: 'material', isRequired: false, sortOrder: 3 }
    ];
    
    console.log('\n=== ASSIGNING FILTERS TO T-SHIRTS ===\n');
    
    for (const filterAssignment of filtersToAssign) {
      const filter = await Filter.findOne({ name: filterAssignment.name });
      if (!filter) {
        console.log(`❌ Filter '${filterAssignment.name}' not found`);
        continue;
      }
      
      // Check if assignment already exists
      const existingAssignment = await CategoryFilter.findOne({
        category: tshirtCategory._id,
        filter: filter._id
      });
      
      if (existingAssignment) {
        console.log(`⚠️  Filter '${filter.name}' already assigned to T-Shirts`);
        continue;
      }
      
      // Create new assignment
      const assignment = new CategoryFilter({
        category: tshirtCategory._id,
        filter: filter._id,
        isRequired: filterAssignment.isRequired,
        isActive: true,
        sortOrder: filterAssignment.sortOrder
      });
      
      await assignment.save();
      console.log(`✅ Assigned '${filter.name}' filter to T-Shirts (Required: ${filterAssignment.isRequired})`);
    }
    
    // Step 6: Verify the setup
    console.log('\n=== VERIFICATION ===\n');
    
    const assignments = await CategoryFilter.find({ 
      category: tshirtCategory._id 
    }).populate('filter');
    
    console.log(`🎉 T-Shirts category now has ${assignments.length} filters assigned:`);
    assignments.forEach(assignment => {
      console.log(`  - ${assignment.filter.name} (${assignment.filter.type}) - Required: ${assignment.isRequired}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

setupTShirtCategory();