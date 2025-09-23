const mongoose = require('mongoose');

async function checkVishnuProducts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    const usersCollection = db.collection('users');
    
    // First, get Vishnu's user ID
    const vishnu = await usersCollection.findOne({ email: 'prakash.jetender@gmail.com' });
    
    if (!vishnu) {
      console.log('Vishnu user not found');
      return;
    }
    
    console.log('Vishnu User ID:', vishnu._id);
    console.log('Vishnu Name:', vishnu.firstName, vishnu.lastName);
    
    // Find products created by Vishnu
    const vishnuProducts = await productsCollection.find({
      $or: [
        { createdBy: vishnu._id },
        { createdBy: vishnu._id.toString() },
        { sellerId: vishnu._id },
        { sellerId: vishnu._id.toString() },
        { seller: vishnu._id },
        { seller: vishnu._id.toString() }
      ]
    }).toArray();
    
    console.log('\nProducts created by Vishnu:', vishnuProducts.length);
    
    vishnuProducts.forEach((product, index) => {
      console.log(`\nProduct ${index + 1}:`);
      console.log('- ID:', product._id);
      console.log('- Name:', product.name);
      console.log('- CreatedBy:', product.createdBy);
      console.log('- SellerId:', product.sellerId);
      console.log('- Seller:', product.seller);
      console.log('- Price:', product.price);
      console.log('- Status:', product.status);
      console.log('- Created At:', product.createdAt);
    });
    
    // Also check all products to see ownership patterns
    const allProducts = await productsCollection.find({}).limit(5).toArray();
    console.log('\nSample of all products (first 5):');
    allProducts.forEach((product, index) => {
      console.log(`\nSample Product ${index + 1}:`);
      console.log('- ID:', product._id);
      console.log('- Name:', product.name);
      console.log('- CreatedBy:', product.createdBy);
      console.log('- SellerId:', product.sellerId);
      console.log('- Seller:', product.seller);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkVishnuProducts();