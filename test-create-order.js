const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Order schema (simplified)
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  items: [{
    product: { type: String, required: true },
    variantId: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 }
  }],
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: String
  },
  paymentMethod: { type: String, required: true },
  orderStatus: { type: String, default: 'PENDING' },
  paymentStatus: { type: String, default: 'PENDING' },
  totalAmount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },
  couponDiscount: { type: Number, default: 0 }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

// Create test order
async function createTestOrder() {
  try {
    // Use a test user ID - you may need to replace this with an actual user ID from your database
    const testUserId = '6759a123456789abcdef0123'; // Replace with actual user ID
    
    const testOrder = new Order({
      orderNumber: 'ORD-TEST-' + Date.now(),
      userId: testUserId,
      items: [{
        product: '6759b123456789abcdef0456', // Replace with actual product ID
        variantId: 'variant-1',
        size: 'M',
        quantity: 1,
        price: 1000,
        originalPrice: 1200,
        discount: 200
      }],
      shippingAddress: {
        name: 'Test User',
        phone: '9876543210',
        addressLine1: '123 Test Street',
        addressLine2: 'Test Area',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        landmark: 'Near Test Mall'
      },
      paymentMethod: 'COD',
      orderStatus: 'PENDING',
      paymentStatus: 'PENDING',
      totalAmount: 1000,
      discount: 200,
      platformFee: 50,
      deliveryCharge: 100,
      finalAmount: 950,
      couponDiscount: 0
    });

    const savedOrder = await testOrder.save();
    console.log('Test order created successfully:', savedOrder._id);
    console.log('Order Number:', savedOrder.orderNumber);
    console.log('User ID:', savedOrder.userId);
    
    // List all orders for this user
    const userOrders = await Order.find({ userId: testUserId });
    console.log('Total orders for user:', userOrders.length);
    
  } catch (error) {
    console.error('Error creating test order:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestOrder();