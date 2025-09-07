const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define schemas
const filterSchema = new mongoose.Schema({
  name: String,
  slug: String,
  type: String,
  unit: String,
  isActive: Boolean,
  sortOrder: Number
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  level: Number,
  isActive: Boolean
}, { timestamps: true });

const categoryFilterSchema = new mongoose.Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  filter: { type: mongoose.Schema.Types.ObjectId, ref: 'Filter', required: true },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

const Filter = mongoose.model('Filter', filterSchema);
const Category = mongoose.model('Category', categorySchema);
const CategoryFilter = mongoose.model('CategoryFilter', categoryFilterSchema);

async function assignFiltersToCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');

    // Get all filters
    const filters = await Filter.find({ isActive: true });
    console.log(`Found ${filters.length} active filters`);

    // Get all categories
    const categories = await Category.find({ isActive: true });
    console.log(`Found ${categories.length} active categories`);

    // Clear existing category-filter assignments
    await CategoryFilter.deleteMany({});
    console.log('Cleared existing category-filter assignments');

    let assignmentCount = 0;

    // Assign all filters to all categories (for testing)
    for (const category of categories) {
      for (const filter of filters) {
        const categoryFilter = new CategoryFilter({
          category: category._id,
          filter: filter._id,
          isActive: true,
          sortOrder: filter.sortOrder || 0
        });
        
        await categoryFilter.save();
        assignmentCount++;
      }
      console.log(`✅ Assigned ${filters.length} filters to category: ${category.name}`);
    }

    console.log(`\n🎉 Successfully created ${assignmentCount} filter-category assignments!`);
    console.log(`\n📊 Summary:`);
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Filters: ${filters.length}`);
    console.log(`- Total Assignments: ${assignmentCount}`);
    
    // Verify assignments
    const verifyCount = await CategoryFilter.countDocuments();
    console.log(`\n✅ Verification: ${verifyCount} assignments in database`);
    
  } catch (error) {
    console.error('Error assigning filters to categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the assignment function
assignFiltersToCategories();