const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'shoppers9';

async function checkProductCreatedBy() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const productsCollection = db.collection('products');
    
    // Get the latest 5 products
    const recentProducts = await productsCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    console.log('\n=== Recent Products ===');
    recentProducts.forEach((product, index) => {
      console.log(`${index + 1}. Product: ${product.name}`);
      console.log(`   ID: ${product._id}`);
      console.log(`   createdBy: ${product.createdBy || 'NULL/UNDEFINED'}`);
      console.log(`   createdAt: ${product.createdAt}`);
      console.log('---');
    });
    
    // Check products without createdBy
    const productsWithoutCreatedBy = await productsCollection
      .find({ createdBy: { $exists: false } })
      .count();
    
    const productsWithNullCreatedBy = await productsCollection
      .find({ createdBy: null })
      .count();
    
    console.log(`\n=== CreatedBy Statistics ===`);
    console.log(`Products without createdBy field: ${productsWithoutCreatedBy}`);
    console.log(`Products with null createdBy: ${productsWithNullCreatedBy}`);
    
    // Get admin user ID for reference
    const adminsCollection = db.collection('admins');
    const admin = await adminsCollection.findOne({ email: 'admin@shoppers9.com' });
    console.log(`\nAdmin ID: ${admin ? admin._id : 'NOT FOUND'}`);
    
    // Check if any products have the admin's ID as createdBy
    if (admin) {
      const adminProducts = await productsCollection
        .find({ createdBy: admin._id })
        .count();
      console.log(`Products created by admin: ${adminProducts}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkProductCreatedBy();