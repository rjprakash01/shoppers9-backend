const { MongoClient } = require('mongodb');

async function checkProductCategories() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('shoppers9');
    const productsCollection = db.collection('products');
    const categoriesCollection = db.collection('categories');
    
    // Get all categories first
    const categories = await categoriesCollection.find({}).toArray();
    const categoryMap = new Map();
    categories.forEach(cat => {
      categoryMap.set(cat._id.toString(), cat);
    });
    
    console.log('\n=== CHECKING SAREE PRODUCTS ===');
    
    // Find products with 'saree' in name
    const sareeProducts = await productsCollection.find({
      name: { $regex: 'saree', $options: 'i' }
    }).toArray();
    
    console.log(`Found ${sareeProducts.length} products with 'saree' in name:`);
    
    sareeProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. Product: ${product.name}`);
      
      const category = categoryMap.get(product.category?.toString());
      const subCategory = categoryMap.get(product.subCategory?.toString());
      const subSubCategory = categoryMap.get(product.subSubCategory?.toString());
      
      console.log(`   Category: ${category?.name || 'N/A'} (slug: ${category?.slug || 'N/A'})`);
      console.log(`   SubCategory: ${subCategory?.name || 'N/A'} (slug: ${subCategory?.slug || 'N/A'})`);
      console.log(`   SubSubCategory: ${subSubCategory?.name || 'N/A'} (slug: ${subSubCategory?.slug || 'N/A'})`);
      console.log(`   Product ID: ${product._id}`);
    });
    
    console.log('\n=== CHECKING T-SHIRT vs SHIRT PRODUCTS ===');
    
    // Find products with 'shirt' in name
    const shirtProducts = await productsCollection.find({
      name: { $regex: 'shirt', $options: 'i' }
    }).toArray();
    
    console.log(`\nFound ${shirtProducts.length} products with 'shirt' in name:`);
    
    shirtProducts.forEach((product, index) => {
      const category = categoryMap.get(product.category?.toString());
      const subCategory = categoryMap.get(product.subCategory?.toString());
      const subSubCategory = categoryMap.get(product.subSubCategory?.toString());
      
      console.log(`\n${index + 1}. Product: ${product.name}`);
      console.log(`   Category: ${category?.name || 'N/A'} (slug: ${category?.slug || 'N/A'})`);
      console.log(`   SubCategory: ${subCategory?.name || 'N/A'} (slug: ${subCategory?.slug || 'N/A'})`);
      console.log(`   SubSubCategory: ${subSubCategory?.name || 'N/A'} (slug: ${subSubCategory?.slug || 'N/A'})`);
    });
    
    console.log('\n=== CHECKING CATEGORY HIERARCHY ===');
    
    // Check for t-shirt and shirt categories
    const tshirtCategories = categories.filter(cat => 
      cat.name.toLowerCase().includes('t-shirt') || 
      cat.slug.toLowerCase().includes('tshirt') ||
      cat.slug.toLowerCase().includes('t-shirt')
    );
    
    const shirtCategories = categories.filter(cat => 
      cat.name.toLowerCase().includes('shirt') && 
      !cat.name.toLowerCase().includes('t-shirt')
    );
    
    console.log('\nT-Shirt Categories:');
    tshirtCategories.forEach(cat => {
      console.log(`  - ${cat.name} (slug: ${cat.slug}, level: ${cat.level})`);
    });
    
    console.log('\nShirt Categories:');
    shirtCategories.forEach(cat => {
      console.log(`  - ${cat.name} (slug: ${cat.slug}, level: ${cat.level})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

checkProductCategories();