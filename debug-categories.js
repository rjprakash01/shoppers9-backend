const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/shoppers9')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define schemas
const categorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  level: Number,
  isActive: Boolean
});

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subSubCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  isActive: Boolean
});

const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);

async function debugCategories() {
  try {
    console.log('\n=== CATEGORY DEBUG ANALYSIS ===');
    
    // 1. Check all categories
    console.log('\n1. All Categories:');
    const allCategories = await Category.find({ isActive: true }).lean();
    allCategories.forEach(cat => {
      console.log(`- ${cat.name} (slug: ${cat.slug}, level: ${cat.level}, id: ${cat._id})`);
    });
    
    // 2. Look for T-shirt related categories
    console.log('\n2. T-shirt related categories:');
    const tshirtCategories = await Category.find({
      $or: [
        { name: { $regex: /t.?shirt/i } },
        { slug: { $regex: /t.?shirt/i } }
      ],
      isActive: true
    }).lean();
    
    if (tshirtCategories.length > 0) {
      tshirtCategories.forEach(cat => {
        console.log(`- Found: ${cat.name} (slug: ${cat.slug}, level: ${cat.level}, id: ${cat._id})`);
      });
    } else {
      console.log('- No T-shirt categories found!');
    }
    
    // 3. Check all products and their categories
    console.log('\n3. All Products and their categories:');
    const allProducts = await Product.find({ isActive: true })
      .populate('category', 'name slug level')
      .populate('subCategory', 'name slug level')
      .populate('subSubCategory', 'name slug level')
      .lean();
    
    console.log(`Total products: ${allProducts.length}`);
    allProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (ID: ${product._id})`);
      console.log(`   Category: ${product.category?.name || 'None'} (${product.category?._id || 'None'})`);
      console.log(`   SubCategory: ${product.subCategory?.name || 'None'} (${product.subCategory?._id || 'None'})`);
      console.log(`   SubSubCategory: ${product.subSubCategory?.name || 'None'} (${product.subSubCategory?._id || 'None'})`);
      console.log(`   Price: ${product.price}`);
      console.log('   ---');
    });
    
    // 4. Test the exact query that should be used for T-shirts
    console.log('\n4. Testing T-shirt category query:');
    const tshirtCategory = tshirtCategories[0];
    if (tshirtCategory) {
      console.log(`Using category: ${tshirtCategory.name} (ID: ${tshirtCategory._id})`);
      const tshirtProducts = await Product.find({
        isActive: true,
        subSubCategory: tshirtCategory._id
      })
      .populate('category', 'name slug level')
      .populate('subCategory', 'name slug level')
      .populate('subSubCategory', 'name slug level')
      .lean();
      
      console.log(`Products found with T-shirt filter: ${tshirtProducts.length}`);
      tshirtProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
      });
    }
    
    console.log('\n=== END CATEGORY DEBUG ===');
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugCategories();