const mongoose = require('mongoose');

// MongoDB connection
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoppers9', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function fixAllNullOrders() {
  await connectDB();
  
  const db = mongoose.connection.db;
  const ordersCollection = db.collection('orders');
  const productsCollection = db.collection('products');
  
  console.log('\n=== Fixing All Orders with Null/Zero Amounts ===');
  
  // Find all orders with null, undefined, or zero amounts
  const problematicOrders = await ordersCollection.find({
    $or: [
      { totalAmount: null },
      { totalAmount: undefined },
      { totalAmount: 0 },
      { finalAmount: null },
      { finalAmount: undefined },
      { finalAmount: 0 },
      { 'items.originalPrice': null },
      { 'items.originalPrice': undefined },
      { 'items.originalPrice': 0 },
      { 'items.price': null },
      { 'items.price': undefined },
      { 'items.price': 0 }
    ]
  }).toArray();
  
  console.log(`Found ${problematicOrders.length} orders with null/zero amounts`);
  
  let fixedCount = 0;
  
  for (const order of problematicOrders) {
    console.log(`\nProcessing order: ${order.orderNumber}`);
    
    let needsUpdate = false;
    let newTotalAmount = 0;
    
    // Fix items with null prices
    for (const item of order.items) {
      if (!item.originalPrice || item.originalPrice === 0 || !item.price || item.price === 0) {
        console.log(`  - Item ${item.product} has null/zero price, looking up product...`);
        
        const product = await productsCollection.findOne({ _id: new mongoose.Types.ObjectId(item.product) });
        
        if (product) {
          const originalPrice = product.originalPrice || product.price || 0;
          const currentPrice = product.price || originalPrice || 0;
          
          if (originalPrice > 0) {
            item.originalPrice = originalPrice;
            item.price = currentPrice;
            needsUpdate = true;
            console.log(`    Fixed: originalPrice=${originalPrice}, price=${currentPrice}`);
          } else {
            console.log(`    Warning: Product ${product.name} has no valid price`);
          }
        } else {
          console.log(`    Error: Product not found for ID ${item.product}`);
        }
      }
      
      // Calculate item total
      const itemTotal = (item.originalPrice || 0) * (item.quantity || 1);
      newTotalAmount += itemTotal;
    }
    
    // Fix order amounts if needed
    if (!order.totalAmount || order.totalAmount === 0 || needsUpdate) {
      order.totalAmount = newTotalAmount;
      needsUpdate = true;
      console.log(`  - Updated totalAmount: ${newTotalAmount}`);
    }
    
    // Recalculate final amount
    const discount = order.discount || 0;
    const couponDiscount = order.couponDiscount || 0;
    const platformFee = order.platformFee || 0;
    const deliveryCharge = order.deliveryCharge || 0;
    
    let newFinalAmount = newTotalAmount - discount - couponDiscount + platformFee + deliveryCharge;
    if (newFinalAmount < 0) {
      newFinalAmount = platformFee + deliveryCharge;
    }
    
    if (!order.finalAmount || order.finalAmount === 0 || needsUpdate) {
      order.finalAmount = newFinalAmount;
      needsUpdate = true;
      console.log(`  - Updated finalAmount: ${newFinalAmount}`);
    }
    
    // Update the order if needed
    if (needsUpdate) {
      await ordersCollection.updateOne(
        { _id: order._id },
        {
          $set: {
            totalAmount: order.totalAmount,
            finalAmount: order.finalAmount,
            items: order.items
          }
        }
      );
      fixedCount++;
      console.log(`  ✓ Order ${order.orderNumber} fixed successfully`);
    } else {
      console.log(`  - Order ${order.orderNumber} already has valid amounts`);
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Total problematic orders found: ${problematicOrders.length}`);
  console.log(`Orders fixed: ${fixedCount}`);
  
  // Verify the fixes
  console.log('\n=== Verification ===');
  const remainingProblematic = await ordersCollection.find({
    $or: [
      { totalAmount: null },
      { totalAmount: undefined },
      { totalAmount: 0 },
      { finalAmount: null },
      { finalAmount: undefined },
      { finalAmount: 0 }
    ]
  }).toArray();
  
  console.log(`Remaining orders with null/zero amounts: ${remainingProblematic.length}`);
  
  if (remainingProblematic.length > 0) {
    console.log('Remaining problematic orders:');
    remainingProblematic.forEach(order => {
      console.log(`  - ${order.orderNumber}: totalAmount=${order.totalAmount}, finalAmount=${order.finalAmount}`);
    });
  }
  
  await mongoose.connection.close();
  console.log('\nDatabase connection closed.');
}

fixAllNullOrders().catch(console.error);