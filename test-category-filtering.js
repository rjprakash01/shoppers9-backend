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

async function testCategoryFiltering() {
  try {
    console.log('\n=== TESTING CATEGORY FILTERING SCENARIOS ===');
    
    // Test scenarios from the screenshots
    const testCases = [
      { name: 'T-Shirt', category: 'men-clothing-t-shirt' },
      { name: 'Jeans', category: 'men-clothing-jeans' },
      { name: 'Shirts', category: 'men-clothing-shirts' },
      { name: 'Shoes', category: 'men-footwear-shoes' },
      { name: 'Sandals', category: 'men-footwear-sandals' }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n--- Testing ${testCase.name} (${testCase.category}) ---`);
      
      // Parse category like the backend does
      const categoryParts = testCase.category.split('-');
      let categoryName, subcategoryName, subsubcategoryName;
      
      if (categoryParts.length >= 3) {
        categoryName = categoryParts[0]; // men
        subcategoryName = categoryParts[1]; // clothing/footwear
        subsubcategoryName = categoryParts.slice(2).join('-'); // t-shirt/jeans/etc
      }
      
      console.log(`Parsed: category=${categoryName}, sub=${subcategoryName}, subsub=${subsubcategoryName}`);
      
      // Look for the subsubcategory
      const searchVariations = [
        subsubcategoryName,
        subsubcategoryName.replace('-', ' '),
        subsubcategoryName.replace('-', ''),
        subsubcategoryName.toUpperCase(),
        subsubcategoryName.toLowerCase()
      ];
      
      console.log(`Search variations: ${searchVariations.join(', ')}`);
      
      const subsubcategoryDoc = await Category.findOne({
        $or: [
          { slug: { $in: searchVariations } },
          { name: { $regex: new RegExp(`^(${searchVariations.join('|')})$`, 'i') } },
          { name: { $regex: new RegExp(`t.?shirt`, 'i') } },
          { slug: { $regex: new RegExp(`t.?shirt`, 'i') } }
        ],
        isActive: true,
        level: 3
      });
      
      if (subsubcategoryDoc) {
        console.log(`✅ Found category: ${subsubcategoryDoc.name} (ID: ${subsubcategoryDoc._id})`);
        
        // Test the query
        const query = {
          isActive: true,
          subSubCategory: subsubcategoryDoc._id
        };
        
        console.log(`Query: ${JSON.stringify(query)}`);
        
        const products = await Product.find(query)
          .populate('subSubCategory', 'name')
          .lean();
        
        console.log(`Products found: ${products.length}`);
        products.forEach(p => {
          console.log(`  - ${p.name} (SubSubCategory: ${p.subSubCategory?.name})`);
        });
      } else {
        console.log(`❌ No category found for: ${subsubcategoryName}`);
        
        // Show what categories ARE available at level 3
        const availableLevel3 = await Category.find({ level: 3, isActive: true }).lean();
        console.log('Available level 3 categories:');
        availableLevel3.forEach(cat => {
          console.log(`  - ${cat.name} (slug: ${cat.slug})`);
        });
      }
    }
    
    console.log('\n=== END TESTING ===');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testCategoryFiltering();