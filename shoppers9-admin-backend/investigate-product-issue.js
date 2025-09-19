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

async function investigateProductIssue() {
  try {
    await connectDB();
    console.log('🔍 Investigating Product Issue...');
    
    const adminsCollection = mongoose.connection.db.collection('admins');
    const productsCollection = mongoose.connection.db.collection('products');
    const ordersCollection = mongoose.connection.db.collection('orders');
    
    // Get Test Admin
    const testAdmin = await adminsCollection.findOne({ 
      email: 'admin@shoppers9.com' 
    });
    
    console.log(`\n👤 Test Admin: ${testAdmin.email} (${testAdmin._id})`);
    
    // Check the specific product ID from the order
    const productId = '68cace61602fb46d62b8e9dc';
    console.log(`\n🔍 Searching for product: ${productId}`);
    
    // Try to find the product with different query methods
    const productById = await productsCollection.findOne({ _id: new mongoose.Types.ObjectId(productId) });
    const productByString = await productsCollection.findOne({ _id: productId });
    
    console.log(`📦 Product found by ObjectId: ${productById ? 'YES' : 'NO'}`);
    console.log(`📦 Product found by string: ${productByString ? 'YES' : 'NO'}`);
    
    if (productById) {
      console.log('\n📋 Product details (ObjectId query):');
      console.log(`   Name: ${productById.name}`);
      console.log(`   Created By: ${productById.createdBy}`);
      console.log(`   Active: ${productById.isActive}`);
      console.log(`   Created At: ${productById.createdAt}`);
    }
    
    if (productByString) {
      console.log('\n📋 Product details (string query):');
      console.log(`   Name: ${productByString.name}`);
      console.log(`   Created By: ${productByString.createdBy}`);
      console.log(`   Active: ${productByString.isActive}`);
      console.log(`   Created At: ${productByString.createdAt}`);
    }
    
    // Check all products by Test Admin
    console.log('\n📦 All products by Test Admin:');
    const adminProducts = await productsCollection.find({ 
      createdBy: testAdmin._id 
    }).toArray();
    
    console.log(`   Found ${adminProducts.length} products`);
    adminProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (${product._id})`);
      console.log(`      Created: ${product.createdAt}`);
      console.log(`      Active: ${product.isActive}`);
    });
    
    // Check the problematic order again
    console.log('\n📦 Checking problematic order...');
    const problemOrder = await ordersCollection.findOne({
      orderNumber: 'ORD17581216079150076'
    });
    
    if (problemOrder) {
      console.log(`   Order: ${problemOrder.orderNumber}`);
      console.log(`   Created: ${problemOrder.createdAt}`);
      console.log(`   Items:`);
      
      problemOrder.items.forEach((item, index) => {
        console.log(`     ${index + 1}. Product: ${item.product}`);
        console.log(`        Seller ID: ${item.sellerId || 'NOT SET'}`);
        console.log(`        Quantity: ${item.quantity}`);
        console.log(`        Price: ${item.price}`);
      });
    }
    
    // Let's manually fix this specific order if we found the product
    const product = productById || productByString;
    if (product && problemOrder) {
      console.log('\n🔧 Manually fixing the order...');
      
      // Update the order with the correct sellerId
      const updatedItems = problemOrder.items.map(item => {
        if (item.product.toString() === productId) {
          return {
            ...item,
            sellerId: product.createdBy
          };
        }
        return item;
      });
      
      await ordersCollection.updateOne(
        { _id: problemOrder._id },
        { 
          $set: { 
            items: updatedItems,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`✅ Order ${problemOrder.orderNumber} fixed manually`);
      
      // Verify the fix
      const verifyOrder = await ordersCollection.findOne({
        orderNumber: 'ORD17581216079150076'
      });
      
      console.log('\n🔍 Verification:');
      verifyOrder.items.forEach((item, index) => {
        console.log(`   Item ${index + 1}:`);
        console.log(`     Product: ${item.product}`);
        console.log(`     Seller ID: ${item.sellerId || 'NOT SET'}`);
        console.log(`     Matches Test Admin: ${item.sellerId?.toString() === testAdmin._id.toString() ? '✅' : '❌'}`);
      });
    }
    
    // Check current orders visible to Test Admin
    console.log('\n📊 Current orders visible to Test Admin:');
    const visibleOrders = await ordersCollection.find({
      'items.sellerId': testAdmin._id
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`   Total visible orders: ${visibleOrders.length}`);
    visibleOrders.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.orderNumber} - ${order.createdAt}`);
    });
    
    // Check if the order creation process is working correctly
    console.log('\n🔍 Checking order creation process...');
    
    // Look at the backend order creation code to see if there's an issue
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('   1. Check if the order creation API is properly setting sellerId');
    console.log('   2. Verify that the product creation process sets createdBy correctly');
    console.log('   3. Ensure the order processing middleware maps product.createdBy to item.sellerId');
    console.log('   4. Test the complete flow: create product → place order → check admin dashboard');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔚 Investigation completed');
  }
}

investigateProductIssue();