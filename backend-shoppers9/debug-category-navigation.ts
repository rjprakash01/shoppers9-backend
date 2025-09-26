import mongoose from 'mongoose';
import { Product } from './src/models/Product';
import { Category } from './src/models/Category';
import { connectDB } from './src/config/database';

const debugCategoryNavigation = async () => {
  try {
    console.log('🔍 Debugging category navigation from homepage banners...');
    
    await connectDB();
    console.log('✅ Connected to database');
    
    // Test the exact same logic as the backend controller
    const testCategories = ['men', 'women', 'electronics', 'household'];
    
    for (const categoryName of testCategories) {
      console.log(`\n=== Testing category: ${categoryName} ===`);
      
      // Find the main category
      const categoryDoc = await Category.findOne({ 
        $or: [
          { slug: categoryName },
          { name: { $regex: new RegExp(`^${categoryName}$`, 'i') } }
        ],
        isActive: true,
        level: 1
      });
      
      if (categoryDoc) {
        console.log(`✅ Found category: ${categoryDoc.name} (ID: ${categoryDoc._id})`);
        
        // Get all descendant categories recursively
        const getAllDescendants = async (parentId: any): Promise<any[]> => {
          const children = await Category.find({
            parentCategory: parentId,
            isActive: true
          }).lean();
          
          let allDescendants = [...children];
          
          // Recursively get descendants of each child
          for (const child of children) {
            const grandChildren = await getAllDescendants(child._id);
            allDescendants = allDescendants.concat(grandChildren);
          }
          
          return allDescendants;
        };
        
        const allSubcategories = await getAllDescendants(categoryDoc._id);
        const categoryIds = [categoryDoc._id, ...allSubcategories.map(s => s._id)];
        
        console.log(`📂 Found ${allSubcategories.length} subcategories:`);
        allSubcategories.forEach(sub => {
          console.log(`  - ${sub.name} (Level ${sub.level}, ID: ${sub._id})`);
        });
        
        // Build the same query as the backend
        const query: any = {
          isActive: true,
          approvalStatus: 'approved',
          $or: [
            { category: { $in: categoryIds } },
            { subCategory: { $in: categoryIds } },
            { subSubCategory: { $in: categoryIds } }
          ]
        };
        
        console.log('🔍 Query:', JSON.stringify(query, null, 2));
        
        // Count products matching this query
        const productCount = await Product.countDocuments(query);
        console.log(`📊 Found ${productCount} products for category ${categoryName}`);
        
        // Get a few sample products
        const sampleProducts = await Product.find(query)
          .populate('category', 'name slug')
          .populate('subCategory', 'name slug')
          .populate('subSubCategory', 'name slug')
          .limit(3)
          .lean();
        
        console.log('📦 Sample products:');
        sampleProducts.forEach((product: any) => {
          console.log(`  - ${product.name}`);
          console.log(`    Category: ${product.category?.name || 'N/A'}`);
          console.log(`    SubCategory: ${product.subCategory?.name || 'N/A'}`);
          console.log(`    SubSubCategory: ${product.subSubCategory?.name || 'N/A'}`);
        });
        
      } else {
        console.log(`❌ Category '${categoryName}' not found`);
      }
    }
    
    console.log('\n🔍 Checking all products and their categories...');
    const allProducts = await Product.find({ isActive: true, approvalStatus: 'approved' })
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('subSubCategory', 'name slug')
      .limit(10)
      .lean();
    
    console.log(`📊 Total active approved products: ${allProducts.length}`);
    allProducts.forEach((product: any) => {
      console.log(`- ${product.name}:`);
      console.log(`  Category: ${product.category?.name || 'N/A'} (${product.category?.slug || 'N/A'})`);
      console.log(`  SubCategory: ${product.subCategory?.name || 'N/A'} (${product.subCategory?.slug || 'N/A'})`);
      console.log(`  SubSubCategory: ${product.subSubCategory?.name || 'N/A'} (${product.subSubCategory?.slug || 'N/A'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

debugCategoryNavigation();