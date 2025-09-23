const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
require('dotenv').config();

async function fixOrderSellerIds() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const ordersCollection = db.collection('orders');
    const productsCollection = db.collection('products');
    
    // Find orders with missing sellerId in items
    console.log('\n🔍 Finding orders with missing sellerId...');
    const ordersWithMissingSellerId = await ordersCollection.find({
      $or: [
        { 'items.sellerId': { $exists: false } },
        { 'items.sellerId': null },
        { 'items.sellerId': undefined }
      ]
    }).toArray();
    
    console.log(`📊 Found ${ordersWithMissingSellerId.length} orders with missing sellerId`);
    
    if (ordersWithMissingSellerId.length === 0) {
      console.log('✅ All orders already have sellerId fields!');
      await client.close();
      return;
    }
    
    let fixedOrders = 0;
    let fixedItems = 0;
    
    console.log('\n🔧 Fixing orders...');
    
    for (const order of ordersWithMissingSellerId) {
      let orderNeedsUpdate = false;
      const updatedItems = [];
      
      for (const item of order.items) {
        if (!item.sellerId) {
          // Find the product to get the creator/seller
          const product = await productsCollection.findOne({ _id: item.product });
          
          if (product && product.createdBy) {
            // Add sellerId to the item
            const updatedItem = {
              ...item,
              sellerId: product.createdBy
            };
            updatedItems.push(updatedItem);
            orderNeedsUpdate = true;
            fixedItems++;
            console.log(`  ✅ Fixed item in order ${order.orderNumber || order._id}: Product ${item.product} -> Seller ${product.createdBy}`);
          } else {
            // Keep the item as is if no product found
            updatedItems.push(item);
            console.log(`  ⚠️  Could not find product ${item.product} for order ${order.orderNumber || order._id}`);
          }
        } else {
          // Item already has sellerId
          updatedItems.push(item);
        }
      }
      
      // Update the order if any items were fixed
      if (orderNeedsUpdate) {
        await ordersCollection.updateOne(
          { _id: order._id },
          { 
            $set: { 
              items: updatedItems,
              updatedAt: new Date()
            }
          }
        );
        fixedOrders++;
        console.log(`  📦 Updated order ${order.orderNumber || order._id}`);
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`  Orders processed: ${ordersWithMissingSellerId.length}`);
    console.log(`  Orders fixed: ${fixedOrders}`);
    console.log(`  Items fixed: ${fixedItems}`);
    
    // Verify the fix by checking Vishnu's orders
    console.log('\n🧪 VERIFICATION:');
    
    // Find Vishnu Dutta
    const adminsCollection = db.collection('admins');
    const vishnu = await adminsCollection.findOne({ email: 'prakash.jetender@gmail.com' });
    
    if (vishnu) {
      console.log(`\n👤 Vishnu Dutta ID: ${vishnu._id}`);
      
      // Check orders visible to Vishnu
      const vishnuOrders = await ordersCollection.find({
        'items.sellerId': vishnu._id
      }).toArray();
      
      console.log(`📦 Orders now visible to Vishnu: ${vishnuOrders.length}`);
      
      if (vishnuOrders.length > 0) {
        console.log('\n📋 Vishnu\'s visible orders:');
        vishnuOrders.forEach((order, index) => {
          console.log(`  ${index + 1}. ${order.orderNumber || 'N/A'} (${order._id})`);
          console.log(`     Created: ${order.createdAt}`);
          console.log(`     Status: ${order.orderStatus}`);
          console.log(`     Items: ${order.items.length}`);
        });
      }
      
      // Check Vishnu's products
      const vishnuProducts = await productsCollection.find({ createdBy: vishnu._id }).toArray();
      console.log(`\n🛍️  Vishnu's products: ${vishnuProducts.length}`);
      
      if (vishnuProducts.length > 0) {
        const productIds = vishnuProducts.map(p => p._id);
        
        // Check orders containing Vishnu's products
        const ordersWithVishnuProducts = await ordersCollection.find({
          'items.product': { $in: productIds }
        }).toArray();
        
        console.log(`📦 Orders containing Vishnu's products: ${ordersWithVishnuProducts.length}`);
        
        // Check if all these orders now have correct sellerId
        let correctlyAttributed = 0;
        for (const order of ordersWithVishnuProducts) {
          const hasCorrectSellerId = order.items.some(item => 
            productIds.some(pid => pid.toString() === item.product.toString()) &&
            item.sellerId && item.sellerId.toString() === vishnu._id.toString()
          );
          if (hasCorrectSellerId) correctlyAttributed++;
        }
        
        console.log(`✅ Orders correctly attributed to Vishnu: ${correctlyAttributed}/${ordersWithVishnuProducts.length}`);
      }
    }
    
    await client.close();
    console.log('\n🎉 ORDER SELLER ID FIX COMPLETE!');
    console.log('💡 Admin users should now see orders for their products in the frontend.');
    
  } catch (error) {
    console.error('❌ Error fixing order seller IDs:', error);
  }
}

fixOrderSellerIds().catch(console.error);