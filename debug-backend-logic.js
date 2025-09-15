const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/shoppers9')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define schemas exactly like backend
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

async function debugBackendLogic() {
  try {
    console.log('\n=== DEBUGGING EXACT BACKEND LOGIC ===');
    
    // Simulate the exact request: category=men-clothing-t-shirt
    const category = 'men-clothing-t-shirt';
    console.log('\n1. Processing category parameter:', category);
    
    // Parse category hierarchy exactly like backend
    const categoryParts = category.split('-');
    let categoryName, subcategoryName, subsubcategoryName;
    
    if (categoryParts.length >= 3) {
      categoryName = categoryParts[0]; // men
      subcategoryName = categoryParts[1]; // clothing
      subsubcategoryName = categoryParts.slice(2).join('-'); // t-shirt
    }
    
    console.log('Parsed parts:', { categoryName, subcategoryName, subsubcategoryName });
    
    // Start with base query
    const query = { isActive: true };
    console.log('\n2. Initial query:', JSON.stringify(query));
    
    // Try subsubcategory lookup (level 3)
    if (subsubcategoryName) {
      console.log('\n3. Looking for subsubcategory:', subsubcategoryName);
      
      // Try multiple variations
      const searchVariations = [
        subsubcategoryName,
        subsubcategoryName.replace('-', ' '),
        subsubcategoryName.replace('-', ''),
        subsubcategoryName.toUpperCase(),
        subsubcategoryName.toLowerCase()
      ];
      
      console.log('Search variations:', searchVariations);
      
      let subsubcategoryDoc = await Category.findOne({
        $or: [
          { slug: { $in: searchVariations } },
          { name: { $regex: new RegExp(`^(${searchVariations.join('|')})$`, 'i') } }
        ],
        isActive: true,
        level: 3
      });
      
      console.log('First lookup result:', subsubcategoryDoc ? `Found: ${subsubcategoryDoc.name}` : 'Not found');
      
      // Special handling for t-shirt variations
      if (!subsubcategoryDoc && subsubcategoryName.toLowerCase().includes('shirt')) {
        console.log('\n4. Trying t-shirt specific lookup...');
        subsubcategoryDoc = await Category.findOne({
          $or: [
            { name: { $regex: new RegExp(`t.?shirt`, 'i') } },
            { slug: { $regex: new RegExp(`t.?shirt`, 'i') } }
          ],
          isActive: true,
          level: 3
        });
        
        console.log('T-shirt regex result:', subsubcategoryDoc ? `Found: ${subsubcategoryDoc.name}` : 'Not found');
      }
      
      if (subsubcategoryDoc) {
        console.log('\n5. ✅ Found subsubcategory, applying filter');
        query.subSubCategory = subsubcategoryDoc._id;
        console.log('Applied subSubCategory filter:', subsubcategoryDoc._id);
      } else {
        console.log('\n5. ❌ No subsubcategory found, trying subcategory fallback');
        
        // Try subcategory fallback
        const subcategoryDoc = await Category.findOne({
          $or: [
            { slug: subcategoryName },
            { name: { $regex: new RegExp(`^${subcategoryName}$`, 'i') } }
          ],
          isActive: true,
          level: 2
        });
        
        if (subcategoryDoc) {
          console.log('\n6. ✅ Found subcategory fallback:', subcategoryDoc.name);
          
          // Get all subsubcategories under this subcategory
          const subsubcategories = await Category.find({
            parentCategory: subcategoryDoc._id,
            isActive: true
          }).lean();
          
          const subsubcategoryIds = subsubcategories.map(s => s._id);
          console.log('Found', subsubcategories.length, 'subsubcategories under', subcategoryDoc.name);
          
          query.$or = [
            { subCategory: subcategoryDoc._id },
            { subSubCategory: { $in: subsubcategoryIds } }
          ];
          console.log('Applied subcategory fallback filter');
        } else {
          console.log('\n6. ❌ No subcategory found either, returning empty results');
          query._id = { $in: [] };
        }
      }
    }
    
    console.log('\n7. Final query:', JSON.stringify(query, null, 2));
    
    // Check if we have empty results query
    const hasEmptyResultsQuery = query._id && Array.isArray(query._id.$in) && query._id.$in.length === 0;
    console.log('Has empty results query:', hasEmptyResultsQuery);
    
    // Execute the query
    console.log('\n8. Executing product query...');
    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .populate('subSubCategory', 'name')
      .limit(5)
      .lean();
    
    console.log('\n9. Query results:');
    console.log('Products found:', products.length);
    
    if (products.length > 0) {
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   Category: ${product.category?.name || 'None'}`);
        console.log(`   SubCategory: ${product.subCategory?.name || 'None'}`);
        console.log(`   SubSubCategory: ${product.subSubCategory?.name || 'None'}`);
      });
    } else {
      console.log('No products found with this query');
      
      if (hasEmptyResultsQuery) {
        console.log('This is expected due to empty results query from category filtering');
      } else {
        console.log('This might indicate a problem with the query or data');
      }
    }
    
    // Also test if T-shirt products exist at all
    console.log('\n10. Checking if T-shirt products exist in database...');
    const tshirtProducts = await Product.find({
      isActive: true,
      subSubCategory: { $exists: true }
    })
    .populate('subSubCategory', 'name')
    .lean();
    
    const actualTshirts = tshirtProducts.filter(p => 
      p.subSubCategory && p.subSubCategory.name && 
      p.subSubCategory.name.toLowerCase().includes('shirt')
    );
    
    console.log('Total T-shirt products in database:', actualTshirts.length);
    actualTshirts.forEach(p => {
      console.log(`- ${p.name} (SubSubCategory: ${p.subSubCategory.name})`);
    });
    
    console.log('\n=== END BACKEND LOGIC DEBUG ===');
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugBackendLogic();