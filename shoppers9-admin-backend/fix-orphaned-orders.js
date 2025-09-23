const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define schemas
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['customer', 'admin', 'super_admin'], default: 'customer' }
});

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
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

async function fixOrphanedOrders() {
  try {
    console.log('=== FIXING ORPHANED ORDERS ===\n');
    
    // Find Super Admin by ID (from debug output)
    const superAdminId = '68ca49d2922b49ad4f20395e';
    const superAdmin = await User.findById(superAdminId);
    if (!superAdmin) {
      console.log('❌ ERROR: Super Admin not found!');
      console.log(`Looking for user ID: ${superAdminId}`);
      return;
    }
    
    console.log(`✅ Found Super Admin: ${superAdmin.firstName} ${superAdmin.lastName} (${superAdmin._id})\n`);
    
    // 2. Find all orders with null sellerId
    const ordersWithNullSeller = await Order.find({
      'items.sellerId': null
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${ordersWithNullSeller.length} orders with null sellerId\n`);
    
    if (ordersWithNullSeller.length === 0) {
      console.log('No orders need fixing!');
      return;
    }
    
    let totalFixed = 0;
    let totalOrphanedItems = 0;
    
    // 3. Process each order
    for (let orderIndex = 0; orderIndex < ordersWithNullSeller.length; orderIndex++) {
      const order = ordersWithNullSeller[orderIndex];
      console.log(`\nProcessing Order ${orderIndex + 1}/${ordersWithNullSeller.length}: ${order.orderNumber}`);
      
      let orderModified = false;
      const updatedItems = [];
      
      // 4. Process each item in the order
      for (let itemIndex = 0; itemIndex < order.items.length; itemIndex++) {
        const item = order.items[itemIndex];
        console.log(`  Item ${itemIndex + 1}: Product ${item.product}`);
        
        if (item.sellerId) {
          console.log(`    ✅ Already has sellerId: ${item.sellerId}`);
          updatedItems.push(item);
          continue;
        }
        
        // Check if product exists
        try {
          const product = await Product.findById(item.product).select('_id name createdBy');
          
          if (product && product.createdBy) {
            console.log(`    ✅ Found product: ${product.name}`);
            console.log(`    ✅ Setting sellerId to: ${product.createdBy}`);
            
            const updatedItem = {
              ...item.toObject(),
              sellerId: product.createdBy
            };
            updatedItems.push(updatedItem);
            orderModified = true;
            totalFixed++;
            
          } else if (product) {
            console.log(`    ⚠️  Product found but no createdBy: ${product.name}`);
            console.log(`    ✅ Assigning to Super Admin`);
            
            const updatedItem = {
              ...item.toObject(),
              sellerId: superAdmin._id
            };
            updatedItems.push(updatedItem);
            orderModified = true;
            totalOrphanedItems++;
            
          } else {
            console.log(`    ❌ Product not found (deleted)`);
            console.log(`    ✅ Assigning to Super Admin as orphaned item`);
            
            const updatedItem = {
              ...item.toObject(),
              sellerId: superAdmin._id
            };
            updatedItems.push(updatedItem);
            orderModified = true;
            totalOrphanedItems++;
          }
          
        } catch (error) {
          console.log(`    ❌ Error looking up product: ${error.message}`);
          console.log(`    ✅ Assigning to Super Admin due to error`);
          
          const updatedItem = {
            ...item.toObject(),
            sellerId: superAdmin._id
          };
          updatedItems.push(updatedItem);
          orderModified = true;
          totalOrphanedItems++;
        }
      }
      
      // 5. Update the order if any items were modified
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
        }
      } else {
        console.log(`  ⚠️  No changes needed for order ${order.orderNumber}`);
      }
    }
    
    console.log(`\n=== MIGRATION COMPLETE ===`);
    console.log(`Total items with existing products fixed: ${totalFixed}`);
    console.log(`Total orphaned items assigned to Super Admin: ${totalOrphanedItems}`);
    
    // 6. Final verification
    console.log(`\n=== VERIFICATION ===`);
    const remainingOrdersWithNullSeller = await Order.find({
      'items.sellerId': null
    }).countDocuments();
    
    console.log(`Orders with null sellerId remaining: ${remainingOrdersWithNullSeller}`);
    
    if (remainingOrdersWithNullSeller === 0) {
      console.log(`🎉 SUCCESS: All orders now have sellerId populated!`);
      
      // Show distribution of orders by seller
      const sellerDistribution = await Order.aggregate([
        { $unwind: '$items' },
        { $group: {
          _id: '$items.sellerId',
          orderCount: { $addToSet: '$_id' },
          itemCount: { $sum: 1 }
        }},
        { $project: {
          sellerId: '$_id',
          orderCount: { $size: '$orderCount' },
          itemCount: 1
        }}
      ]);
      
      console.log(`\nOrder distribution by seller:`);
      for (const dist of sellerDistribution) {
        const seller = await User.findById(dist.sellerId).select('firstName lastName role');
        const sellerName = seller ? `${seller.firstName} ${seller.lastName} (${seller.role})` : 'Unknown';
        console.log(`  ${sellerName}: ${dist.orderCount} orders, ${dist.itemCount} items`);
      }
      
    } else {
      console.log(`⚠️  WARNING: ${remainingOrdersWithNullSeller} orders still have null sellerId`);
    }
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Add confirmation prompt
console.log('This script will fix orphaned orders by:');
console.log('1. Assigning orders with existing products to their creators');
console.log('2. Assigning orders with deleted/missing products to the Super Admin');
console.log('\nStarting migration in 3 seconds...');

setTimeout(() => {
  fixOrphanedOrders();
}, 3000);