const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define Order schema
const orderSchema = new mongoose.Schema({
  items: [{
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, { strict: false });

const Order = mongoose.model('Order', orderSchema);

// Define User schema
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  primaryRole: String
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function fixOrderVisibility() {
  try {
    console.log('Connected to MongoDB');
    
    // Find the current admin user (Admin User)
    const currentAdmin = await User.findOne({ 
      email: 'admin@shoppers9.com',
      firstName: 'Admin',
      lastName: 'User'
    });
    
    if (!currentAdmin) {
      console.log('❌ Current admin user not found');
      return;
    }
    
    console.log('✅ Current admin user found:', {
      id: currentAdmin._id.toString(),
      name: currentAdmin.firstName + ' ' + currentAdmin.lastName,
      email: currentAdmin.email
    });
    
    // Find orders with orphaned seller IDs (users that no longer exist)
    const orphanedSellerIds = [
      '68bd48f7e03d384b7a2f92ee', // 9 orders
      '68beb3ede848e94bb2067119'  // 46 orders
    ];
    
    console.log('\n🔍 Looking for orders with orphaned seller IDs...');
    
    const ordersToUpdate = await Order.find({
      'items.sellerId': { $in: orphanedSellerIds.map(id => new mongoose.Types.ObjectId(id)) }
    });
    
    console.log(`\n📦 Found ${ordersToUpdate.length} orders to update`);
    
    if (ordersToUpdate.length === 0) {
      console.log('No orders found to update');
      return;
    }
    
    // Update each order
    let updatedCount = 0;
    
    for (const order of ordersToUpdate) {
      // Update sellerId in all items
      for (const item of order.items) {
        if (item.sellerId && orphanedSellerIds.includes(item.sellerId.toString())) {
          console.log(`  Updating item sellerId from ${item.sellerId} to ${currentAdmin._id}`);
          item.sellerId = currentAdmin._id;
        }
      }
      
      await order.save();
      updatedCount++;
      
      console.log(`✅ Updated order ${order._id} (${updatedCount}/${ordersToUpdate.length})`);
    }
    
    console.log(`\n🎉 Successfully updated ${updatedCount} orders!`);
    
    // Verify the update
    const verifyOrders = await Order.find({
      'items.sellerId': currentAdmin._id
    });
    
    console.log(`\n✅ Verification: Found ${verifyOrders.length} orders now assigned to current admin`);
    
  } catch (error) {
    console.error('❌ Error fixing order visibility:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixOrderVisibility();