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

async function fixProductOwnership() {
  try {
    await connectDB();
    console.log('🔄 Fixing Product Ownership...');
    
    const productsCollection = mongoose.connection.db.collection('products');
    const ordersCollection = mongoose.connection.db.collection('orders');
    
    // Mapping from users collection IDs to admins collection IDs
    const userMapping = {
      '68ca49d2922b49ad4f20395e': '68beb3ede848e94bb2067119', // superadmin@shoppers9.com
      '68ca49d2922b49ad4f203961': '68bd48f7e03d384b7a2f92ee'  // admin@shoppers9.com
    };
    
    console.log('\n📋 User ID Mapping:');
    Object.entries(userMapping).forEach(([oldId, newId]) => {
      console.log(`   ${oldId} -> ${newId}`);
    });
    
    // Update products
    console.log('\n🛍️ Updating Products...');
    let productUpdates = 0;
    
    for (const [oldId, newId] of Object.entries(userMapping)) {
      const result = await productsCollection.updateMany(
        { createdBy: oldId },
        { $set: { createdBy: newId } }
      );
      
      console.log(`   Updated ${result.modifiedCount} products from ${oldId} to ${newId}`);
      productUpdates += result.modifiedCount;
    }
    
    // Update orders
    console.log('\n📦 Updating Orders...');
    let orderUpdates = 0;
    
    for (const [oldId, newId] of Object.entries(userMapping)) {
      const orders = await ordersCollection.find({
        'items.sellerId': new mongoose.Types.ObjectId(oldId)
      }).toArray();
      
      console.log(`   Found ${orders.length} orders with seller ID ${oldId}`);
      
      for (const order of orders) {
        const updatedItems = order.items.map(item => {
          if (item.sellerId && item.sellerId.toString() === oldId) {
            return {
              ...item,
              sellerId: new mongoose.Types.ObjectId(newId)
            };
          }
          return item;
        });
        
        await ordersCollection.updateOne(
          { _id: order._id },
          { $set: { items: updatedItems } }
        );
        
        orderUpdates++;
      }
    }
    
    console.log('\n🎯 Update Summary:');
    console.log(`✅ Products updated: ${productUpdates}`);
    console.log(`✅ Orders updated: ${orderUpdates}`);
    
    // Verify the changes
    console.log('\n🔍 Verifying Changes...');
    
    const adminIds = Object.values(userMapping);
    for (const adminId of adminIds) {
      const productCount = await productsCollection.countDocuments({ createdBy: adminId });
      const orderCount = await ordersCollection.countDocuments({ 'items.sellerId': new mongoose.Types.ObjectId(adminId) });
      
      console.log(`   Admin ${adminId}:`);
      console.log(`     Products: ${productCount}`);
      console.log(`     Orders: ${orderCount}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔚 Fix completed');
  }
}

fixProductOwnership();