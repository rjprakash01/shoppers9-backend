const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './backend-shoppers9/.env' });

// User Schema (simplified)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  isVerified: Boolean
});

// Cart Schema (simplified)
const cartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  items: [{
    product: String,
    variantId: String,
    size: String,
    quantity: Number,
    price: Number,
    originalPrice: Number,
    discount: Number,
    isSelected: Boolean
  }],
  totalAmount: Number,
  totalDiscount: Number,
  subtotal: Number,
  couponDiscount: Number,
  appliedCoupon: String
});

const User = mongoose.model('User', userSchema);
const Cart = mongoose.model('Cart', cartSchema);

async function clearUserCart() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB successfully');

    // Find user by email
    const userEmail = 'prakash9679@gmail.com';
    console.log(`Looking for user with email: ${userEmail}`);
    
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.log('❌ User not found with email:', userEmail);
      return;
    }

    console.log('✅ User found:', {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone
    });

    // Find and clear user's cart
    console.log('Looking for user cart...');
    const cart = await Cart.findOne({ userId: user._id.toString() });
    
    if (!cart) {
      console.log('ℹ️ No cart found for this user');
      return;
    }

    console.log('📦 Cart found with', cart.items.length, 'items');
    console.log('Cart items:', cart.items.map(item => ({
      product: item.product,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
      originalPrice: item.originalPrice
    })));

    // Clear cart items
    cart.items = [];
    cart.totalAmount = 0;
    cart.totalDiscount = 0;
    cart.subtotal = 0;
    cart.couponDiscount = 0;
    cart.appliedCoupon = undefined;
    
    await cart.save();
    console.log('✅ Cart cleared successfully for user:', userEmail);
    
  } catch (error) {
    console.error('❌ Error clearing cart:', error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
clearUserCart();