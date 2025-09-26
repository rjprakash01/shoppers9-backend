const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

// Category schema (simplified)
const categorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  description: String,
  isActive: { type: Boolean, default: true },
  level: { type: Number, default: 1 },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

async function checkCategories() {
  try {
    await connectDB();
    
    console.log('\n🔍 Checking categories in database...');
    
    // Get total count
    const totalCount = await Category.countDocuments();
    console.log(`📊 Total categories: ${totalCount}`);
    
    // Get active count
    const activeCount = await Category.countDocuments({ isActive: true });
    console.log(`✅ Active categories: ${activeCount}`);
    
    // Get inactive count
    const inactiveCount = await Category.countDocuments({ isActive: false });
    console.log(`❌ Inactive categories: ${inactiveCount}`);
    
    // Get all categories
    const allCategories = await Category.find({}).sort({ level: 1, sortOrder: 1 });
    
    if (allCategories.length > 0) {
      console.log('\n📋 All categories:');
      allCategories.forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.name} (Level: ${cat.level}, Active: ${cat.isActive}, ID: ${cat._id})`);
      });
    } else {
      console.log('\n❌ No categories found in database');
    }
    
    // Test the exact query used by the controller
    console.log('\n🧪 Testing controller query...');
    const controllerQuery = {};
    const categories = await Category.find(controllerQuery)
      .populate('parentCategory', 'name')
      .sort({ sortOrder: 1 })
      .skip(0)
      .limit(10);
      
    console.log(`📊 Controller query result: ${categories.length} categories`);
    
    if (categories.length > 0) {
      console.log('📋 Categories from controller query:');
      categories.forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.name} (Active: ${cat.isActive})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkCategories();