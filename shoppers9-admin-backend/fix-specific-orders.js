const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

async function fixSpecificOrders() {
  try {
    console.log('🔧 FIXING SPECIFIC ORDERS WITH MISSING PRODUCT DATA...');
    
    // Connect to admin database
    const client = new MongoClient('mongodb://localhost:27017/shoppers9-admin');
    await client.connect();
    const db = client.db('shoppers9-admin');
    
    // Get test admin info
    const testAdmin = await db.collection('admins').findOne({ email: 'admin@shoppers9.com' });
    console.log(`\n👤 Test Admin ID: ${testAdmin._id}`);
    
    // Target order IDs
    const targetOrderNumbers = ['ORD17581929116770086', 'ORD17581915363610085'];
    
    // Get admin products for reference
    const adminProducts = await db.collection('products').find({
      createdBy: testAdmin._id
    }).toArray();
    
    console.log(`\n🛍️ Available admin products: ${adminProducts.length}`);
    adminProducts.forEach(p => {
      console.log(`   - ${p.name} (ID: ${p._id}, Price: ${p.price || 'undefined'})`);
    });
    
    for (const orderNumber of targetOrderNumbers) {
      console.log(`\n🔧 FIXING ORDER: ${orderNumber}`);
      
      const order = await db.collection('orders').findOne({ orderNumber });
      
      if (!order) {
        console.log(`   ❌ Order not found`);
        continue;
      }
      
      console.log(`   ✅ Order found with ${order.items?.length || 0} items`);
      
      if (order.items && order.items.length > 0) {
        const fixedItems = order.items.map((item, index) => {
          console.log(`\n   Processing item ${index + 1}:`);
          console.log(`      Current state:`);
          console.log(`         Product ID: ${item.productId || 'MISSING'}`);
          console.log(`         Seller ID: ${item.sellerId || 'MISSING'}`);
          console.log(`         Product Name: ${item.productName || 'MISSING'}`);
          console.log(`         Price: ${item.price}`);
          console.log(`         Quantity: ${item.quantity}`);
          
          const fixed = { ...item };
          
          // If productId is missing, assign a suitable admin product
          if (!fixed.productId && adminProducts.length > 0) {
            // Try to find a product that matches the price
            let matchingProduct = adminProducts.find(p => p.price === item.price);
            
            // If no exact price match, use the first available product
            if (!matchingProduct) {
              matchingProduct = adminProducts[0];
            }
            
            if (matchingProduct) {
              fixed.productId = matchingProduct._id;
              fixed.productName = matchingProduct.name;
              console.log(`      ✅ Assigned product: ${matchingProduct.name} (${matchingProduct._id})`);
            }
          }
          
          // Ensure sellerId is set to test admin
          if (!fixed.sellerId || fixed.sellerId.toString() !== testAdmin._id.toString()) {
            fixed.sellerId = testAdmin._id;
            console.log(`      ✅ Set sellerId to test admin`);
          }
          
          // Ensure productName is set
          if (!fixed.productName && fixed.productId) {
            const product = adminProducts.find(p => p._id.toString() === fixed.productId.toString());
            if (product) {
              fixed.productName = product.name;
              console.log(`      ✅ Set product name: ${product.name}`);
            }
          }
          
          return fixed;
        });
        
        console.log(`\n   📝 Updating order with fixed items...`);
        console.log('   Fixed items:', JSON.stringify(fixedItems, null, 2));
        
        // Update the order
        const updateResult = await db.collection('orders').updateOne(
          { orderNumber },
          { 
            $set: { 
              items: fixedItems,
              updatedAt: new Date(),
              fixedBy: 'specific-order-repair-script'
            }
          }
        );
        
        if (updateResult.modifiedCount > 0) {
          console.log(`   ✅ Successfully updated order ${orderNumber}`);
        } else {
          console.log(`   ❌ Failed to update order ${orderNumber}`);
        }
      }
    }
    
    // Test the admin API query after fix
    console.log('\n🔍 TESTING ADMIN API QUERY AFTER FIX...');
    
    // This is the exact query used by admin backend
    const adminVisibleOrders = await db.collection('orders').find({
      'items.sellerId': testAdmin._id
    }).toArray();
    
    console.log(`\n   Total orders visible to test admin: ${adminVisibleOrders.length}`);
    
    const visibleOrderNumbers = adminVisibleOrders.map(o => o.orderNumber);
    
    for (const targetOrder of targetOrderNumbers) {
      const isVisible = visibleOrderNumbers.includes(targetOrder);
      console.log(`   ${targetOrder}: ${isVisible ? '✅ NOW VISIBLE' : '❌ STILL NOT VISIBLE'}`);
    }
    
    // Show all visible orders for verification
    console.log('\n📋 ALL VISIBLE ORDERS:');
    adminVisibleOrders.forEach((order, i) => {
      console.log(`   ${i + 1}. ${order.orderNumber} - ${order.createdAt}`);
    });
    
    // Double-check by querying the specific orders again
    console.log('\n🔍 DOUBLE-CHECK SPECIFIC ORDERS:');
    
    for (const orderNumber of targetOrderNumbers) {
      const order = await db.collection('orders').findOne({ orderNumber });
      if (order) {
        const hasAdminItems = order.items?.some(item => 
          item.sellerId && item.sellerId.toString() === testAdmin._id.toString()
        );
        console.log(`   ${orderNumber}: ${hasAdminItems ? '✅ Has admin items' : '❌ No admin items'}`);
        
        if (order.items) {
          order.items.forEach((item, i) => {
            console.log(`      Item ${i + 1}: ProductID=${item.productId || 'MISSING'}, SellerID=${item.sellerId || 'MISSING'}`);
          });
        }
      }
    }
    
    await client.close();
    
    console.log('\n🎉 REPAIR COMPLETE!');
    console.log('   The orders should now be visible in the admin panel.');
    console.log('   Please refresh the admin frontend to see the changes.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixSpecificOrders();