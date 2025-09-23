const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define schemas
const orderSchema = new mongoose.Schema({
  items: [{
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, { strict: false });

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  primaryRole: String
}, { strict: false });

const Order = mongoose.model('Order', orderSchema);
const User = mongoose.model('User', userSchema);

async function findOrderOwner() {
  try {
    console.log('Connected to MongoDB');
    
    // Find all admin users
    const adminUsers = await User.find({
      primaryRole: { $in: ['admin', 'super_admin'] }
    });
    
    console.log('\n=== ALL ADMIN USERS ===');
    adminUsers.forEach(user => {
      console.log({
        id: user._id.toString(),
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.primaryRole
      });
    });
    
    // Find all unique sellerIds in orders
    const orders = await Order.find({});
    const sellerIds = new Set();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.sellerId) {
          sellerIds.add(item.sellerId.toString());
        }
      });
    });
    
    console.log('\n=== UNIQUE SELLER IDs IN ORDERS ===');
    for (const sellerId of sellerIds) {
      console.log('Seller ID:', sellerId);
      
      // Find user with this ID
      const seller = await User.findById(sellerId);
      if (seller) {
        console.log('  -> User:', {
          name: `${seller.firstName} ${seller.lastName}`,
          email: seller.email,
          role: seller.primaryRole
        });
      } else {
        console.log('  -> User not found');
      }
      
      // Count orders for this seller
      const orderCount = await Order.countDocuments({
        'items.sellerId': sellerId
      });
      console.log(`  -> Orders: ${orderCount}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

findOrderOwner();