import mongoose from 'mongoose';
import Product from './src/models/Product';
import Category from './src/models/Category';
import connectDB from './src/config/database';

(async () => {
  try {
    await connectDB();
    
    // Find the men-clothing-shirts category
    const menClothingShirts = await Category.findOne({slug: 'men-clothing-shirts'});
    if (!menClothingShirts) {
      console.log('❌ men-clothing-shirts category not found!');
      process.exit(1);
    }
    
    console.log('✅ Found men-clothing-shirts category:', menClothingShirts._id);
    
    // Find parent categories
    const menClothing = await Category.findOne({slug: 'men-clothing'});
    const men = await Category.findOne({slug: 'men'});
    
    if (!menClothing || !men) {
      console.log('❌ Parent categories not found!');
      process.exit(1);
    }
    
    console.log('✅ Found parent categories:');
    console.log('  Men:', men._id);
    console.log('  Men-Clothing:', menClothing._id);
    
    // Create a test product
    const testProduct = {
      name: 'Test Dress Shirt',
      description: 'A test dress shirt for men',
      category: men._id,
      subCategory: menClothing._id,
      subSubCategory: menClothingShirts._id,
      brand: 'Test Brand',
      variants: [{
        size: 'M',
        color: 'White',
        price: 2999,
        originalPrice: 3999,
        stock: 10,
        sku: 'TEST-SHIRT-M-WHITE',
        images: ['https://example.com/shirt.jpg']
      }],
      tags: ['formal', 'cotton', 'men'],
      isActive: true,
      reviewStatus: 'pending_review'
    };
    
    console.log('🔄 Creating test product...');
    const createdProduct = await Product.create(testProduct);
    
    console.log('✅ Product created successfully!');
    console.log('  Product ID:', createdProduct._id);
    console.log('  Name:', createdProduct.name);
    console.log('  Category:', createdProduct.category);
    console.log('  SubCategory:', createdProduct.subCategory);
    console.log('  SubSubCategory:', createdProduct.subSubCategory);
    
    // Verify the product can be found
    const foundProduct = await Product.findById(createdProduct._id)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('subSubCategory', 'name slug');
    
    if (foundProduct) {
      console.log('✅ Product verification successful!');
      console.log('  Category:', (foundProduct.category as any)?.name);
      console.log('  SubCategory:', (foundProduct.subCategory as any)?.name);
      console.log('  SubSubCategory:', (foundProduct.subSubCategory as any)?.name);
    } else {
      console.log('❌ Product verification failed!');
    }
    
    // Clean up - delete the test product
    await Product.findByIdAndDelete(createdProduct._id);
    console.log('🧹 Test product cleaned up');
    
    console.log('\n🎉 Product creation test completed successfully!');
    console.log('The men-clothing-shirts category hierarchy is working properly.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during product creation test:', error);
    process.exit(1);
  }
})();