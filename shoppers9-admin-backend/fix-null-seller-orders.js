const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'shoppers9';

async function fixNullSellerOrders() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const ordersCollection = db.collection('orders');
    const productsCollection = db.collection('products');
    const adminsCollection = db.collection('admins');
    
    // Get admin ID
    const admin = await adminsCollection.findOne({ email: 'admin@shoppers9.com' });
    if (!admin) {
      console.log('❌ Admin not found');
      return;
    }
    
    console.log(`Admin ID: ${admin._id}`);
    
    // Get all orders with null sellerId
    const ordersWithNullSeller = await ordersCollection
      .find({ 'items.sellerId': null })
      .toArray();
    
    console.log(`\n=== Found ${ordersWithNullSeller.length} orders with null sellerId ===`);
    
    let totalFixed = 0;
    
    for (const order of ordersWithNullSeller) {
      console.log(`\nProcessing Order: ${order.orderNumber}`);
      console.log(`Created: ${order.createdAt}`);
      
      let orderUpdated = false;
      const updatedItems = [];
      
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        console.log(`\n  Item ${i + 1}:`);
        console.log(`    Product ID: ${item.product}`);
        console.log(`    Current Seller ID: ${item.sellerId || 'NULL'}`);
        
        if (!item.sellerId) {
          // Try to find the product
          let product = null;
          
          // Try with string ID first
          product = await productsCollection.findOne({ _id: item.product });
          
          // If not found, try with ObjectId
          if (!product) {
            try {
              const objectId = new ObjectId(item.product);
              product = await productsCollection.findOne({ _id: objectId });
            } catch (err) {
              console.log(`    ❌ Invalid ObjectId: ${err.message}`);
            }
          }
          
          if (product) {
            console.log(`    ✅ Product found: ${product.name}`);
            console.log(`    Product createdBy: ${product.createdBy}`);
            
            // Update the item with correct sellerId
            const updatedItem = {
              ...item,
              sellerId: product.createdBy
            };
            updatedItems.push(updatedItem);
            orderUpdated = true;
            
            console.log(`    ✅ Setting sellerId to: ${product.createdBy}`);
          } else {
            console.log(`    ❌ Product not found`);
            updatedItems.push(item);
          }
        } else {
          console.log(`    ✅ Already has sellerId`);
          updatedItems.push(item);
        }
      }
      
      if (orderUpdated) {
        // Update the order in database
        const updateResult = await ordersCollection.updateOne(
          { _id: order._id },
          { 
            $set: { 
              items: updatedItems,
              updatedAt: new Date()
            }
          }
        );
        
        if (updateResult.modifiedCount > 0) {
          console.log(`  ✅ Order ${order.orderNumber} updated successfully`);
          totalFixed++;
        } else {
          console.log(`  ❌ Failed to update order ${order.orderNumber}`);
        }
      } else {
        console.log(`  ⚠️  No updates needed for order ${order.orderNumber}`);
      }
    }
    
    console.log(`\n\n=== Summary ===`);
    console.log(`Total orders processed: ${ordersWithNullSeller.length}`);
    console.log(`Orders fixed: ${totalFixed}`);
    
    // Verify the fix
    console.log(`\n=== Verification ===`);
    const remainingNullOrders = await ordersCollection
      .countDocuments({ 'items.sellerId': null });
    
    console.log(`Orders with null sellerId remaining: ${remainingNullOrders}`);
    
    // Check admin's visible orders now
    const adminVisibleOrders = await ordersCollection
      .find({ 'items.sellerId': admin._id })
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`\nAdmin's visible orders: ${adminVisibleOrders.length}`);
    adminVisibleOrders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.orderNumber} - ${order.createdAt}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fixNullSellerOrders();