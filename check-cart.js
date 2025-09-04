const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/shoppers9').then(async () => {
  const Cart = mongoose.model('Cart', new mongoose.Schema({
    userId: String,
    items: [{
      product: String,
      variantId: String,
      size: String,
      quantity: Number,
      price: Number,
      originalPrice: Number,
      discount: Number,
      isSelected: Boolean
    }]
  }, { timestamps: true }));
  
  const cart = await Cart.findOne();
  console.log('Cart found:', !!cart);
  
  if (cart) {
    console.log('Items count:', cart.items.length);
    cart.items.forEach((item, i) => {
      console.log(`Item ${i}: ID=${item._id.toString()}, product=${item.product}, quantity=${item.quantity}`);
    });
  }
  
  process.exit(0);
}).catch(console.error);