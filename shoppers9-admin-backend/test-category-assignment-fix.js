const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/shoppers9';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function checkProductCategoryAssignments() {
  try {
    // Define schemas
    const categorySchema = new mongoose.Schema({
      name: String,
      level: Number,
      parentCategory: String,
      isActive: Boolean
    });
    
    const productSchema = new mongoose.Schema({
      name: String,
      category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
      subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
      subSubCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
      isActive: Boolean
    });
    
    const Category = mongoose.model('Category', categorySchema);
    const Product = mongoose.model('Product', productSchema);
    
    // Get all products with their category assignments
    const products = await Product.find({})
      .populate('category', 'name level')
      .populate('subCategory', 'name level')
      .populate('subSubCategory', 'name level')
      .sort({ name: 1 });
    
    console.log('\n📋 Product Category Assignment Status:');
    console.log('=' .repeat(80));
    
    let properlyAssigned = 0;
    let missingAssignments = 0;
    
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   Category (L1): ${product.category ? `${product.category.name} (Level ${product.category.level})` : '❌ NONE'}`);
      console.log(`   SubCategory (L2): ${product.subCategory ? `${product.subCategory.name} (Level ${product.subCategory.level})` : '❌ NONE'}`);
      console.log(`   SubSubCategory (L3): ${product.subSubCategory ? `${product.subSubCategory.name} (Level ${product.subSubCategory.level})` : '⚪ NONE'}`);
      
      if (product.category && product.subCategory) {
        console.log('   Status: ✅ Properly assigned');
        properlyAssigned++;
      } else {
        console.log('   Status: ❌ Missing assignments');
        missingAssignments++;
      }
    });
    
    console.log('\n' + '=' .repeat(80));
    console.log(`📊 Summary:`);
    console.log(`   Total products: ${products.length}`);
    console.log(`   Properly assigned: ${properlyAssigned}`);
    console.log(`   Missing assignments: ${missingAssignments}`);
    
    if (missingAssignments === 0) {
      console.log('\n🎉 SUCCESS: All products have proper category assignments!');
    } else {
      console.log(`\n⚠️  WARNING: ${missingAssignments} products are missing category assignments!`);
    }
    
    // Show available categories for reference
    console.log('\n📂 Available Categories:');
    const categories = await Category.find({ isActive: true }).sort({ level: 1, name: 1 });
    
    const level1 = categories.filter(cat => cat.level === 1);
    const level2 = categories.filter(cat => cat.level === 2);
    const level3 = categories.filter(cat => cat.level === 3);
    
    console.log(`   Level 1 (${level1.length}): ${level1.map(cat => cat.name).join(', ')}`);
    console.log(`   Level 2 (${level2.length}): ${level2.map(cat => cat.name).join(', ')}`);
    console.log(`   Level 3 (${level3.length}): ${level3.map(cat => cat.name).join(', ')}`);
    
    return { properlyAssigned, missingAssignments, total: products.length };
    
  } catch (error) {
    console.error('❌ Failed to check product categories:', error);
    throw error;
  }
}

async function testCategoryAssignmentStatus() {
  console.log('🔍 Checking Product Category Assignment Status...');
  
  try {
    await connectDB();
    const result = await checkProductCategoryAssignments();
    
    if (result.missingAssignments === 0) {
      console.log('\n✅ Category assignment fix verification: PASSED');
    } else {
      console.log('\n❌ Category assignment fix verification: FAILED');
      console.log('   Some products still need category assignments.');
    }
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testCategoryAssignmentStatus();