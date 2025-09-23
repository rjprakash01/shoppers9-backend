const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define schemas
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create models
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

async function fixOrderSellerIds() {
  try {
    console.log('=== FIXING ORDER SELLER IDS ===\n');
    
    // 1. Find all orders with null sellerId
    const ordersWithNullSeller = await Order.find({
      'items.sellerId': null
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${ordersWithNullSeller.length} orders with null sellerId\n`);
    
    if (ordersWithNullSeller.length === 0) {
      console.log('No orders need fixing!');
      return;
    }
    
    let totalFixed = 0;
    let totalErrors = 0;
    
    // 2. Process each order
    for (let orderIndex = 0; orderIndex < ordersWithNullSeller.length; orderIndex++) {
      const order = ordersWithNullSeller[orderIndex];
      console.log(`\nProcessing Order ${orderIndex + 1}/${ordersWithNullSeller.length}: ${order.orderNumber}`);
      
      let orderModified = false;
      const updatedItems = [];
      
      // 3. Process each item in the order
      for (let itemIndex = 0; itemIndex < order.items.length; itemIndex++) {
        const item = order.items[itemIndex];
        console.log(`  Item ${itemIndex + 1}: Product ${item.product}`);
        
        if (item.sellerId) {
          console.log(`    ✅ Already has sellerId: ${item.sellerId}`);
          updatedItems.push(item);
          continue;
        }
        
        // Look up the product to get createdBy
        try {
          const product = await Product.findById(item.product).select('_id name createdBy');
          
          if (product && product.createdBy) {
            console.log(`    ✅ Found product: ${product.name}`);
            console.log(`    ✅ Setting sellerId to: ${product.createdBy}`);
            
            // Update the item with sellerId
            const updatedItem = {
              ...item.toObject(),
              sellerId: product.createdBy
            };
            updatedItems.push(updatedItem);
            orderModified = true;
            totalFixed++;
            
          } else if (product) {
            console.log(`    ❌ Product found but no createdBy: ${product.name}`);
            console.log(`    ❌ Keeping sellerId as null`);
            updatedItems.push(item);
            totalErrors++;
            
          } else {
            console.log(`    ❌ Product not found`);
            console.log(`    ❌ Keeping sellerId as null`);
            updatedItems.push(item);
            totalErrors++;
          }
          
        } catch (error) {
          console.log(`    ❌ Error looking up product: ${error.message}`);
          updatedItems.push(item);
          totalErrors++;
        }
      }
      
      // 4. Update the order if any items were modified
      if (orderModified) {
        try {
          await Order.findByIdAndUpdate(
            order._id,
            { 
              items: updatedItems,
              updatedAt: new Date()
            },
            { new: true }
          );
          console.log(`  ✅ Order ${order.orderNumber} updated successfully`);
        } catch (updateError) {
          console.log(`  ❌ Failed to update order ${order.orderNumber}: ${updateError.message}`);
          totalErrors++;
        }
      } else {
        console.log(`  ⚠️  No changes needed for order ${order.orderNumber}`);
      }
    }
    
    console.log(`\n=== MIGRATION COMPLETE ===`);
    console.log(`Total items fixed: ${totalFixed}`);
    console.log(`Total errors: ${totalErrors}`);
    
    // 5. Verify the fix
    console.log(`\n=== VERIFICATION ===`);
    const remainingOrdersWithNullSeller = await Order.find({
      'items.sellerId': null
    }).countDocuments();
    
    console.log(`Orders with null sellerId remaining: ${remainingOrdersWithNullSeller}`);
    
    if (remainingOrdersWithNullSeller === 0) {
      console.log(`🎉 SUCCESS: All orders now have sellerId populated!`);
    } else {
      console.log(`⚠️  WARNING: ${remainingOrdersWithNullSeller} orders still have null sellerId`);
      
      // Show details of remaining problematic orders
      const remainingOrders = await Order.find({
        'items.sellerId': null
      }).limit(5);
      
      console.log(`\nFirst 5 remaining problematic orders:`);
      for (const order of remainingOrders) {
        console.log(`  Order ${order.orderNumber}:`);
        for (const item of order.items) {
          if (!item.sellerId) {
            console.log(`    Item with Product ${item.product} - no sellerId`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Add confirmation prompt
console.log('This script will update orders with null sellerId values.');
console.log('It will look up each product and set the sellerId based on the product\'s createdBy field.');
console.log('\nStarting migration in 3 seconds...');

setTimeout(() => {
  fixOrderSellerIds();
}, 3000);