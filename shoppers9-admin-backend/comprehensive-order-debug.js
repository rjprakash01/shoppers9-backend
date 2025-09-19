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

async function comprehensiveOrderDebug() {
  try {
    await connectDB();
    console.log('🔍 COMPREHENSIVE ORDER DEBUG FOR TEST ADMIN...');
    console.log('=' .repeat(60));
    
    const adminsCollection = mongoose.connection.db.collection('admins');
    const productsCollection = mongoose.connection.db.collection('products');
    const ordersCollection = mongoose.connection.db.collection('orders');
    const cartsCollection = mongoose.connection.db.collection('carts');
    
    // Get Test Admin details
    console.log('\n1. 👤 TEST ADMIN VERIFICATION');
    console.log('-'.repeat(40));
    
    const testAdmin = await adminsCollection.findOne({ 
      email: 'admin@shoppers9.com' 
    });
    
    if (!testAdmin) {
      console.log('❌ CRITICAL: Test Admin not found!');
      return;
    }
    
    console.log(`✅ Test Admin Found:`);
    console.log(`   ID: ${testAdmin._id}`);
    console.log(`   Email: ${testAdmin.email}`);
    console.log(`   Role: ${testAdmin.role}`);
    console.log(`   Active: ${testAdmin.isActive}`);
    
    // Check Test Admin's products
    console.log('\n2. 📦 TEST ADMIN PRODUCTS ANALYSIS');
    console.log('-'.repeat(40));
    
    const adminProducts = await productsCollection.find({ 
      createdBy: testAdmin._id 
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`📊 Total products by Test Admin: ${adminProducts.length}`);
    
    if (adminProducts.length === 0) {
      console.log('❌ ISSUE: Test Admin has no products!');
      console.log('💡 RECOMMENDATION: Create a product first');
      return;
    }
    
    console.log('\n📋 Test Admin Products:');
    adminProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}`);
      console.log(`      ID: ${product._id}`);
      console.log(`      Created: ${product.createdAt}`);
      console.log(`      Active: ${product.isActive}`);
      console.log(`      Price: ₹${product.price}`);
      console.log(`      Stock: ${product.stock || 'N/A'}`);
      console.log('');
    });
    
    // Check recent orders (last 24 hours)
    console.log('\n3. 📋 RECENT ORDERS ANALYSIS (Last 24 Hours)');
    console.log('-'.repeat(40));
    
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentOrders = await ordersCollection.find({
      createdAt: { $gte: last24Hours }
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`📊 Recent orders (24h): ${recentOrders.length}`);
    
    if (recentOrders.length === 0) {
      console.log('⚠️  No orders placed in the last 24 hours');
    } else {
      console.log('\n📦 Recent Orders Details:');
      recentOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. Order ${order.orderNumber}`);
        console.log(`      Created: ${order.createdAt}`);
        console.log(`      User: ${order.userId}`);
        console.log(`      Status: ${order.orderStatus}`);
        console.log(`      Items: ${order.items?.length || 0}`);
        
        if (order.items && order.items.length > 0) {
          order.items.forEach((item, itemIndex) => {
            const isAdminProduct = adminProducts.some(p => p._id.toString() === item.product.toString());
            console.log(`        Item ${itemIndex + 1}:`);
            console.log(`          Product: ${item.product}`);
            console.log(`          Seller ID: ${item.sellerId || 'NOT SET'}`);
            console.log(`          Is Admin Product: ${isAdminProduct ? '✅' : '❌'}`);
            console.log(`          Should be Admin: ${isAdminProduct && (!item.sellerId || item.sellerId.toString() !== testAdmin._id.toString()) ? '❌ MISSING' : '✅'}`);
          });
        }
        console.log('');
      });
    }
    
    // Check orders containing Test Admin products
    console.log('\n4. 🎯 ORDERS WITH TEST ADMIN PRODUCTS');
    console.log('-'.repeat(40));
    
    const productIds = adminProducts.map(p => p._id);
    const ordersWithAdminProducts = await ordersCollection.find({
      'items.product': { $in: productIds }
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`📊 Total orders with admin products: ${ordersWithAdminProducts.length}`);
    
    if (ordersWithAdminProducts.length === 0) {
      console.log('❌ ISSUE: No orders found for Test Admin products!');
      console.log('💡 This means either:');
      console.log('   - No customers have ordered admin products');
      console.log('   - Orders exist but product IDs don\'t match');
    } else {
      console.log('\n📦 Orders with Admin Products:');
      ordersWithAdminProducts.forEach((order, index) => {
        console.log(`   ${index + 1}. Order ${order.orderNumber}`);
        console.log(`      Created: ${order.createdAt}`);
        console.log(`      Status: ${order.orderStatus}`);
        
        const adminItems = order.items.filter(item => 
          productIds.some(pid => pid.toString() === item.product.toString())
        );
        
        console.log(`      Admin Items: ${adminItems.length}`);
        adminItems.forEach((item, itemIndex) => {
          const product = adminProducts.find(p => p._id.toString() === item.product.toString());
          console.log(`        ${itemIndex + 1}. Product: ${product?.name || 'Unknown'}`);
          console.log(`           Product ID: ${item.product}`);
          console.log(`           Seller ID: ${item.sellerId || 'NOT SET'}`);
          console.log(`           Correct Seller: ${item.sellerId?.toString() === testAdmin._id.toString() ? '✅' : '❌'}`);
          
          if (!item.sellerId || item.sellerId.toString() !== testAdmin._id.toString()) {
            console.log(`           🚨 ISSUE: Incorrect or missing sellerId!`);
          }
        });
        console.log('');
      });
    }
    
    // Check orders visible to Test Admin
    console.log('\n5. 👁️  ORDERS VISIBLE TO TEST ADMIN');
    console.log('-'.repeat(40));
    
    const visibleOrders = await ordersCollection.find({
      'items.sellerId': testAdmin._id
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`📊 Orders visible to Test Admin: ${visibleOrders.length}`);
    
    if (visibleOrders.length === 0) {
      console.log('❌ CRITICAL ISSUE: Test Admin cannot see any orders!');
    } else {
      console.log('\n📦 Visible Orders:');
      visibleOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. Order ${order.orderNumber}`);
        console.log(`      Created: ${order.createdAt}`);
        console.log(`      Status: ${order.orderStatus}`);
        console.log(`      Items with admin as seller: ${order.items.filter(item => item.sellerId?.toString() === testAdmin._id.toString()).length}`);
      });
    }
    
    // Check for broken orders (orders with admin products but wrong sellerId)
    console.log('\n6. 🔧 BROKEN ORDERS DETECTION');
    console.log('-'.repeat(40));
    
    const brokenOrders = [];
    
    for (const order of ordersWithAdminProducts) {
      const adminItems = order.items.filter(item => 
        productIds.some(pid => pid.toString() === item.product.toString())
      );
      
      const brokenItems = adminItems.filter(item => 
        !item.sellerId || item.sellerId.toString() !== testAdmin._id.toString()
      );
      
      if (brokenItems.length > 0) {
        brokenOrders.push({
          order: order,
          brokenItems: brokenItems
        });
      }
    }
    
    console.log(`📊 Broken orders found: ${brokenOrders.length}`);
    
    if (brokenOrders.length > 0) {
      console.log('\n🚨 BROKEN ORDERS DETAILS:');
      brokenOrders.forEach((broken, index) => {
        console.log(`   ${index + 1}. Order ${broken.order.orderNumber}`);
        console.log(`      Created: ${broken.order.createdAt}`);
        console.log(`      Broken Items: ${broken.brokenItems.length}`);
        
        broken.brokenItems.forEach((item, itemIndex) => {
          const product = adminProducts.find(p => p._id.toString() === item.product.toString());
          console.log(`        ${itemIndex + 1}. Product: ${product?.name || 'Unknown'}`);
          console.log(`           Current Seller ID: ${item.sellerId || 'NOT SET'}`);
          console.log(`           Should be: ${testAdmin._id}`);
        });
      });
      
      // Fix broken orders
      console.log('\n🔧 FIXING BROKEN ORDERS...');
      
      for (const broken of brokenOrders) {
        const updatedItems = broken.order.items.map(item => {
          const isAdminProduct = productIds.some(pid => pid.toString() === item.product.toString());
          if (isAdminProduct && (!item.sellerId || item.sellerId.toString() !== testAdmin._id.toString())) {
            return {
              ...item,
              sellerId: testAdmin._id
            };
          }
          return item;
        });
        
        await ordersCollection.updateOne(
          { _id: broken.order._id },
          { 
            $set: { 
              items: updatedItems,
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`   ✅ Fixed order ${broken.order.orderNumber}`);
      }
    }
    
    // Check active carts with admin products
    console.log('\n7. 🛒 ACTIVE CARTS WITH ADMIN PRODUCTS');
    console.log('-'.repeat(40));
    
    const cartsWithAdminProducts = await cartsCollection.find({
      'items.product': { $in: productIds }
    }).toArray();
    
    console.log(`📊 Carts with admin products: ${cartsWithAdminProducts.length}`);
    
    if (cartsWithAdminProducts.length > 0) {
      console.log('\n🛒 Cart Details:');
      cartsWithAdminProducts.forEach((cart, index) => {
        console.log(`   ${index + 1}. User: ${cart.userId}`);
        console.log(`      Items: ${cart.items.length}`);
        console.log(`      Updated: ${cart.updatedAt}`);
        
        const adminItems = cart.items.filter(item => 
          productIds.some(pid => pid.toString() === item.product.toString())
        );
        
        console.log(`      Admin Items: ${adminItems.length}`);
        adminItems.forEach((item, itemIndex) => {
          const product = adminProducts.find(p => p._id.toString() === item.product.toString());
          console.log(`        ${itemIndex + 1}. ${product?.name || 'Unknown'} (Qty: ${item.quantity})`);
        });
      });
    }
    
    // Final verification
    console.log('\n8. ✅ FINAL VERIFICATION');
    console.log('-'.repeat(40));
    
    const finalVisibleOrders = await ordersCollection.find({
      'items.sellerId': testAdmin._id
    }).sort({ createdAt: -1 }).toArray();
    
    const finalOrdersWithProducts = await ordersCollection.find({
      'items.product': { $in: productIds }
    }).toArray();
    
    console.log(`📊 FINAL RESULTS:`);
    console.log(`   Test Admin Products: ${adminProducts.length}`);
    console.log(`   Orders with admin products: ${finalOrdersWithProducts.length}`);
    console.log(`   Orders visible to admin: ${finalVisibleOrders.length}`);
    console.log(`   Broken orders fixed: ${brokenOrders.length}`);
    
    // Summary and recommendations
    console.log('\n9. 📋 SUMMARY & RECOMMENDATIONS');
    console.log('-'.repeat(40));
    
    if (finalVisibleOrders.length === finalOrdersWithProducts.length) {
      console.log('✅ SUCCESS: All orders with admin products are now visible to admin!');
    } else {
      console.log('❌ ISSUE: Some orders with admin products are still not visible');
      console.log(`   Expected: ${finalOrdersWithProducts.length}`);
      console.log(`   Actual: ${finalVisibleOrders.length}`);
    }
    
    if (recentOrders.length === 0) {
      console.log('💡 RECOMMENDATION: Test by placing a new order for admin products');
    }
    
    if (cartsWithAdminProducts.length > 0) {
      console.log('💡 INFO: There are active carts with admin products - orders may be placed soon');
    }
    
    console.log('\n🔍 DEBUGGING CHECKLIST:');
    console.log('   ✅ Test Admin exists and is active');
    console.log(`   ${adminProducts.length > 0 ? '✅' : '❌'} Test Admin has products`);
    console.log(`   ${finalOrdersWithProducts.length > 0 ? '✅' : '❌'} Orders exist for admin products`);
    console.log(`   ${finalVisibleOrders.length === finalOrdersWithProducts.length ? '✅' : '❌'} All orders are visible to admin`);
    console.log(`   ${brokenOrders.length === 0 ? '✅' : '🔧'} No broken orders (${brokenOrders.length} fixed)`);
    
  } catch (error) {
    console.error('❌ Error during comprehensive debug:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔚 Comprehensive debug completed');
  }
}

comprehensiveOrderDebug();