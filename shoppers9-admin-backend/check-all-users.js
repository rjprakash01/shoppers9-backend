const mongoose = require('mongoose');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoppers9', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function checkAllUsers() {
  try {
    await connectDB();
    console.log('🔍 Checking All Users and Product Ownership...');
    
    // Check all collections that might have users
    const collections = ['admins', 'users'];
    
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const users = await collection.find({}).toArray();
        
        console.log(`\n📋 ${collectionName.toUpperCase()} Collection (${users.length} users):`);
        
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ID: ${user._id}`);
          console.log(`      Email: ${user.email || 'N/A'}`);
          console.log(`      Phone: ${user.phone || 'N/A'}`);
          console.log(`      Role: ${user.role || user.primaryRole || 'N/A'}`);
          console.log(`      Created: ${user.createdAt || 'N/A'}`);
          console.log('');
        });
      } catch (error) {
        console.log(`   Collection ${collectionName} not found or error: ${error.message}`);
      }
    }
    
    // Check who created the products
    const productsCollection = mongoose.connection.db.collection('products');
    const products = await productsCollection.find({}).toArray();
    
    console.log(`\n🛍️ Products Analysis (${products.length} total):`);
    
    const creatorCounts = {};
    products.forEach(product => {
      if (product.createdBy) {
        creatorCounts[product.createdBy] = (creatorCounts[product.createdBy] || 0) + 1;
      } else {
        creatorCounts['NO_CREATOR'] = (creatorCounts['NO_CREATOR'] || 0) + 1;
      }
    });
    
    console.log('\n📊 Products by Creator:');
    Object.entries(creatorCounts).forEach(([creatorId, count]) => {
      console.log(`   ${creatorId}: ${count} products`);
    });
    
    // Check if the seller IDs from orders exist as users
    const sellerIds = ['68ca49d2922b49ad4f20395e', '68ca49d2922b49ad4f203961'];
    
    console.log('\n🔍 Checking Seller IDs from Orders:');
    for (const sellerId of sellerIds) {
      let found = false;
      
      for (const collectionName of collections) {
        try {
          const collection = mongoose.connection.db.collection(collectionName);
          const user = await collection.findOne({ _id: new mongoose.Types.ObjectId(sellerId) });
          
          if (user) {
            console.log(`   ✅ ${sellerId} found in ${collectionName}:`);
            console.log(`      Email: ${user.email || 'N/A'}`);
            console.log(`      Role: ${user.role || user.primaryRole || 'N/A'}`);
            found = true;
            break;
          }
        } catch (error) {
          // Continue checking other collections
        }
      }
      
      if (!found) {
        console.log(`   ❌ ${sellerId} not found in any user collection`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkAllUsers();