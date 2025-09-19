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

async function migrateOrders() {
  try {
    await connectDB();
    console.log('🔄 Starting Order Migration...');
    
    const ordersCollection = mongoose.connection.db.collection('orders');
    const productsCollection = mongoose.connection.db.collection('products');
    
    // Get all orders
    const orders = await ordersCollection.find({}).toArray();
    console.log(`📊 Found ${orders.length} orders to migrate`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const order of orders) {
      try {
        let needsUpdate = false;
        const updatedItems = [];
        
        for (const item of order.items) {
          if (!item.sellerId) {
            // Find the product to get its createdBy
            const product = await productsCollection.findOne({ _id: new mongoose.Types.ObjectId(item.product) });
            
            if (product && product.createdBy) {
              updatedItems.push({
                ...item,
                sellerId: new mongoose.Types.ObjectId(product.createdBy)
              });
              needsUpdate = true;
            } else {
              // Keep the item as is if product not found or no createdBy
              updatedItems.push(item);
              console.log(`⚠️  Product ${item.product} not found or no createdBy for order ${order.orderNumber}`);
            }
          } else {
            // Item already has sellerId
            updatedItems.push(item);
          }
        }
        
        if (needsUpdate) {
          await ordersCollection.updateOne(
            { _id: order._id },
            { $set: { items: updatedItems } }
          );
          updatedCount++;
          console.log(`✅ Updated order ${order.orderNumber}`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating order ${order.orderNumber}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n🎯 Migration Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} orders`);
    console.log(`❌ Errors: ${errorCount} orders`);
    console.log(`📊 Total processed: ${orders.length} orders`);
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const verifyOrders = await ordersCollection.find({}).limit(5).toArray();
    
    verifyOrders.forEach((order, index) => {
      const sellerIds = order.items.map(item => item.sellerId).filter(Boolean);
      console.log(`Order ${index + 1}: ${order.orderNumber} - Sellers: [${sellerIds.join(', ')}]`);
    });
    
  } catch (error) {
    console.error('❌ Migration Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔚 Migration completed');
  }
}

migrateOrders();