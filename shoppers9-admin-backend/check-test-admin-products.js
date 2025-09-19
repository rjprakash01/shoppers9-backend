const { MongoClient } = require('mongodb');

async function checkTestAdminProducts() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('shoppers9');
    const productsCollection = db.collection('products');
    
    const testAdminId = '68bd48f7e03d384b7a2f92ee';
    const { ObjectId } = require('mongodb');
    
    // Check products created by test admin
    const products = await productsCollection.find({ 
      $or: [
        { createdBy: testAdminId },
        { createdBy: new ObjectId(testAdminId) }
      ]
    }).toArray();
    
    console.log(`\nProducts created by test admin (${testAdminId}):`, products.length);
    
    if (products.length > 0) {
      console.log('\nTest admin\'s products:');
      products.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (ID: ${product._id})`);
        console.log(`     Created By: ${product.createdBy}`);
        console.log(`     Status: ${product.status}`);
        console.log(`     Price: $${product.price}`);
      });
    } else {
      console.log('\n❌ No products found for test admin!');
      console.log('This explains why no orders are visible to the test admin.');
    }
    
    // Check all products to see who created them
    const allProducts = await productsCollection.find().limit(10).toArray();
    console.log('\nSample of all products (first 10):');
    allProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} - Created by: ${product.createdBy}`);
    });
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await client.close();
    process.exit(1);
  }
}

checkTestAdminProducts();