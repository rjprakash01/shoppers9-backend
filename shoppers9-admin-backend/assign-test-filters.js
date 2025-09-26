const mongoose = require('mongoose');
require('dotenv').config();

// Define schemas directly
const filterSchema = new mongoose.Schema({
  name: String,
  displayName: String,
  type: String,
  dataType: String,
  isActive: Boolean
});

const categorySchema = new mongoose.Schema({
  name: String,
  level: Number,
  parentCategory: mongoose.Schema.Types.ObjectId
});

const filterAssignmentSchema = new mongoose.Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  filter: { type: mongoose.Schema.Types.ObjectId, ref: 'Filter' },
  categoryLevel: Number,
  isRequired: Boolean,
  isActive: Boolean,
  sortOrder: Number,
  assignedAt: Date,
  assignedBy: mongoose.Schema.Types.ObjectId
});

const Filter = mongoose.model('Filter', filterSchema);
const Category = mongoose.model('Category', categorySchema);
const FilterAssignment = mongoose.model('FilterAssignment', filterAssignmentSchema);

// Connect to MongoDB
const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin');
  console.log('✅ Connected to MongoDB');
};

const assignTestFilters = async () => {
  try {
    await connectDB();
    
    // Find the Men category (level 1)
    const menCategory = await Category.findOne({ name: 'Men', level: 1 });
    if (!menCategory) {
      console.log('❌ Men category not found');
      return;
    }
    
    console.log(`📂 Found Men category: ${menCategory.name} (${menCategory._id})`);
    
    // Get some filters to assign
    const filters = await Filter.find({ isActive: true }).limit(5);
    console.log(`🎯 Found ${filters.length} active filters`);
    
    // Assign filters to Men category
    for (let i = 0; i < filters.length; i++) {
      const filter = filters[i];
      
      // Check if already assigned
      const existingAssignment = await FilterAssignment.findOne({
        category: menCategory._id,
        filter: filter._id
      });
      
      if (!existingAssignment) {
        const assignment = new FilterAssignment({
          category: menCategory._id,
          filter: filter._id,
          categoryLevel: menCategory.level,
          isRequired: i < 2, // First 2 filters are required
          isActive: true,
          sortOrder: i,
          assignedAt: new Date(),
          assignedBy: new mongoose.Types.ObjectId() // Dummy admin ID
        });
        
        await assignment.save();
        console.log(`✅ Assigned filter "${filter.displayName}" to Men category`);
      } else {
        console.log(`⚠️  Filter "${filter.displayName}" already assigned to Men category`);
      }
    }
    
    // Verify assignments
    const assignments = await FilterAssignment.find({ category: menCategory._id })
      .populate('filter', 'name displayName');
    
    console.log(`\n📊 Total assignments for Men category: ${assignments.length}`);
    assignments.forEach((assignment, index) => {
      console.log(`  ${index + 1}. ${assignment.filter.displayName} (required: ${assignment.isRequired})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('🔌 Disconnecting from MongoDB');
    await mongoose.disconnect();
  }
};

assignTestFilters();