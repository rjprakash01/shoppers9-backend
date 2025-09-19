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

async function fixProductsString() {
  try {
    await connectDB();
    console.log('🔄 Fixing Products with String IDs...');
    
    const productsCollection = mongoose.connection.db.collection('products');
    
    // Mapping from users collection IDs to admins collection IDs (as strings)
    const userMapping = {
      '68ca49d2922b49ad4f20395e': '68beb3ede848e94bb2067119', // superadmin@shoppers9.com
      '68ca49d2922b49ad4f203961': '68bd48f7e03d384b7a2f92ee'  // admin@shoppers9.com
    };
    
    console.log('\n📋 User ID Mapping (String):');
    Object.entries(userMapping).forEach(([oldId, newId]) => {
      console.log(`   ${oldId} -> ${newId}`);
    });
    
    // Check current products
    const allProducts = await productsCollection.find({}).toArray();
    console.log(`\n🛍️ Found ${allProducts.length} products`);
    
    console.log('\n📊 Current Product Ownership:');
    const ownershipCounts = {};
    allProducts.forEach(product => {
      const owner = product.createdBy || 'NO_OWNER';
      ownershipCounts[owner] = (ownershipCounts[owner] || 0) + 1;
    });
    
    Object.entries(ownershipCounts).forEach(([owner, count]) => {
      console.log(`   ${owner}: ${count} products`);
    });
    
    // Update products
    console.log('\n🔄 Updating Products...');
    let totalUpdated = 0;
    
    for (const [oldId, newId] of Object.entries(userMapping)) {
      const result = await productsCollection.updateMany(
        { createdBy: oldId },
        { $set: { createdBy: newId } }
      );
      
      console.log(`   Updated ${result.modifiedCount} products from ${oldId} to ${newId}`);
      totalUpdated += result.modifiedCount;
    }
    
    console.log(`\n✅ Total products updated: ${totalUpdated}`);
    
    // Verify the changes
    console.log('\n🔍 Verifying Product Changes...');
    const updatedProducts = await productsCollection.find({}).toArray();
    const newOwnershipCounts = {};
    updatedProducts.forEach(product => {
      const owner = product.createdBy || 'NO_OWNER';
      newOwnershipCounts[owner] = (newOwnershipCounts[owner] || 0) + 1;
    });
    
    Object.entries(newOwnershipCounts).forEach(([owner, count]) => {
      console.log(`   ${owner}: ${count} products`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔚 Product fix completed');
  }
}

fixProductsString();