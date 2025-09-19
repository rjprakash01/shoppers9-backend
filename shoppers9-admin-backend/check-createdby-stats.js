const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'shoppers9';

async function checkCreatedByStats() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const productsCollection = db.collection('products');
    
    // Get admin user ID for reference
    const adminsCollection = db.collection('admins');
    const admin = await adminsCollection.findOne({ email: 'admin@shoppers9.com' });
    console.log(`Admin ID: ${admin ? admin._id : 'NOT FOUND'}`);
    
    // Check products without createdBy
    const productsWithoutCreatedBy = await productsCollection
      .countDocuments({ createdBy: { $exists: false } });
    
    const productsWithNullCreatedBy = await productsCollection
      .countDocuments({ createdBy: null });
    
    const totalProducts = await productsCollection.countDocuments({});
    
    console.log(`\n=== CreatedBy Statistics ===`);
    console.log(`Total products: ${totalProducts}`);
    console.log(`Products without createdBy field: ${productsWithoutCreatedBy}`);
    console.log(`Products with null createdBy: ${productsWithNullCreatedBy}`);
    
    // Check if any products have the admin's ID as createdBy
    if (admin) {
      const adminProducts = await productsCollection
        .countDocuments({ createdBy: admin._id });
      console.log(`Products created by admin: ${adminProducts}`);
      
      // Get a sample of admin's products
      const sampleAdminProducts = await productsCollection
        .find({ createdBy: admin._id })
        .limit(3)
        .toArray();
      
      console.log(`\n=== Sample Admin Products ===`);
      sampleAdminProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} (ID: ${product._id})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkCreatedByStats();