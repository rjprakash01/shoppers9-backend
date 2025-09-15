const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/shoppers9')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define category schema
const categorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  level: Number,
  isActive: Boolean
});

const Category = mongoose.model('Category', categorySchema);

async function debugTshirtLookup() {
  try {
    console.log('\n=== DEBUGGING T-SHIRT CATEGORY LOOKUP ===');
    
    // Test the exact logic from the backend
    const subsubcategoryName = 't-shirt';
    const subcategoryName = 'clothing';
    
    console.log('\n1. Testing exact T-shirt lookup logic:');
    console.log(`Looking for subsubcategoryName: "${subsubcategoryName}"`);
    
    // Try multiple variations of the category name
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
    
    console.log('\n2. First lookup result:');
    if (subsubcategoryDoc) {
      console.log(`✅ Found: ${subsubcategoryDoc.name} (ID: ${subsubcategoryDoc._id})`);
    } else {
      console.log('❌ Not found with first lookup');
    }
    
    // Special handling for t-shirt variations only if we're actually looking for t-shirt
    if (!subsubcategoryDoc && subsubcategoryName.toLowerCase().includes('shirt')) {
      console.log('\n3. Trying t-shirt specific lookup:');
      subsubcategoryDoc = await Category.findOne({
        $or: [
          { name: { $regex: new RegExp(`t.?shirt`, 'i') } },
          { slug: { $regex: new RegExp(`t.?shirt`, 'i') } }
        ],
        isActive: true,
        level: 3
      });
      
      if (subsubcategoryDoc) {
        console.log(`✅ Found with t-shirt regex: ${subsubcategoryDoc.name} (ID: ${subsubcategoryDoc._id})`);
      } else {
        console.log('❌ Not found with t-shirt regex either');
      }
    }
    
    if (!subsubcategoryDoc) {
      console.log('\n4. Trying subcategory fallback:');
      console.log(`Looking for subcategoryName: "${subcategoryName}"`);
      
      const subcategoryDoc = await Category.findOne({
        $or: [
          { slug: subcategoryName },
          { name: { $regex: new RegExp(`^${subcategoryName}$`, 'i') } }
        ],
        isActive: true,
        level: 2
      });
      
      if (subcategoryDoc) {
        console.log(`✅ Found subcategory fallback: ${subcategoryDoc.name} (ID: ${subcategoryDoc._id})`);
      } else {
        console.log('❌ No subcategory found either');
      }
    }
    
    // Show all T-shirt related categories
    console.log('\n5. All T-shirt related categories in database:');
    const tshirtCategories = await Category.find({
      $or: [
        { name: { $regex: /t.*shirt/i } },
        { slug: { $regex: /t.*shirt/i } }
      ],
      isActive: true
    }).lean();
    
    if (tshirtCategories.length > 0) {
      tshirtCategories.forEach(cat => {
        console.log(`- ${cat.name} (slug: ${cat.slug}, level: ${cat.level}, id: ${cat._id})`);
      });
    } else {
      console.log('- No T-shirt related categories found!');
    }
    
    // Show all level 3 categories
    console.log('\n6. All level 3 categories:');
    const level3Categories = await Category.find({ level: 3, isActive: true }).lean();
    level3Categories.forEach(cat => {
      console.log(`- ${cat.name} (slug: ${cat.slug}, id: ${cat._id})`);
    });
    
    console.log('\n=== END T-SHIRT DEBUG ===');
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugTshirtLookup();