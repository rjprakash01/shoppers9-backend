const mongoose = require('mongoose');
const { Cart } = require('./dist/models/Cart');
const { Product } = require('./dist/models/Product');

async function debugCartItem() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');
    
    // Find the cart
    const cart = await Cart.findOne().lean();
    if (!cart) {
      console.log('No cart found');
      return;
    }
    
    console.log('Cart ID:', cart._id);
    console.log('User ID:', cart.userId);
    console.log('Items count:', cart.items.length);
    
    // Check each item in detail
    for (let i = 0; i < cart.items.length; i++) {
      const item = cart.items[i];
      console.log(`\nItem ${i}:`);
      console.log('  _id:', item._id);
      console.log('  product:', item.product);
      console.log('  product type:', typeof item.product);
      console.log('  variantId:', item.variantId);
      console.log('  size:', item.size);
      console.log('  quantity:', item.quantity);
      console.log('  price:', item.price);
      
      // Check if product exists
      if (item.product) {
        const product = await Product.findById(item.product);
        console.log('  product exists:', !!product);
        if (product) {
          console.log('  product name:', product.name);
          console.log('  product isActive:', product.isActive);
        }
      } else {
        console.log('  ERROR: product field is missing or null!');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugCartItem();