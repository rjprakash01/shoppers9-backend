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

async function fixProductPrices() {
  await connectDB();
  
  const db = mongoose.connection.db;
  const productsCollection = db.collection('products');
  const ordersCollection = db.collection('orders');
  
  console.log('\n=== Checking Products with Invalid Prices ===');
  
  // Find products with null or zero prices
  const problematicProducts = await productsCollection.find({
    $or: [
      { price: null },
      { price: undefined },
      { price: 0 },
      { originalPrice: null },
      { originalPrice: undefined },
      { originalPrice: 0 }
    ]
  }).toArray();
  
  console.log(`Found ${problematicProducts.length} products with invalid prices`);
  
  for (const product of problematicProducts) {
    console.log(`\nProduct: ${product.name} (ID: ${product._id})`);
    console.log(`  Current price: ${product.price}`);
    console.log(`  Current originalPrice: ${product.originalPrice}`);
    
    // Set a default price if both are invalid
    let newPrice = product.price || product.originalPrice || 10; // Default to $10
    let newOriginalPrice = product.originalPrice || product.price || 10;
    
    // If both are still invalid, set reasonable defaults
    if (!newPrice || newPrice === 0) {
      newPrice = 10;
    }
    if (!newOriginalPrice || newOriginalPrice === 0) {
      newOriginalPrice = newPrice;
    }
    
    console.log(`  Setting price: ${newPrice}`);
    console.log(`  Setting originalPrice: ${newOriginalPrice}`);
    
    await productsCollection.updateOne(
      { _id: product._id },
      {
        $set: {
          price: newPrice,
          originalPrice: newOriginalPrice
        }
      }
    );
    
    console.log(`  ✓ Product ${product.name} updated`);
  }
  
  console.log('\n=== Now Re-fixing Orders ===');
  
  // Now re-run the order fix for the specific problematic order
  const problematicOrder = await ordersCollection.findOne({ orderNumber: 'ORD1758122548155735' });
  
  if (problematicOrder) {
    console.log(`\nRe-processing order: ${problematicOrder.orderNumber}`);
    
    let newTotalAmount = 0;
    
    // Recalculate with updated product prices
    for (const item of problematicOrder.items) {
      const product = await productsCollection.findOne({ _id: new mongoose.Types.ObjectId(item.product) });
      
      if (product) {
        const originalPrice = product.originalPrice || product.price || 10;
        const currentPrice = product.price || originalPrice || 10;
        
        item.originalPrice = originalPrice;
        item.price = currentPrice;
        
        const itemTotal = originalPrice * (item.quantity || 1);
        newTotalAmount += itemTotal;
        
        console.log(`  - Item ${product.name}: price=${currentPrice}, originalPrice=${originalPrice}, quantity=${item.quantity}, total=${itemTotal}`);
      }
    }
    
    // Recalculate final amount
    const discount = problematicOrder.discount || 0;
    const couponDiscount = problematicOrder.couponDiscount || 0;
    const platformFee = problematicOrder.platformFee || 0;
    const deliveryCharge = problematicOrder.deliveryCharge || 0;
    
    let newFinalAmount = newTotalAmount - discount - couponDiscount + platformFee + deliveryCharge;
    if (newFinalAmount < 0) {
      newFinalAmount = platformFee + deliveryCharge;
    }
    
    console.log(`  - New totalAmount: ${newTotalAmount}`);
    console.log(`  - New finalAmount: ${newFinalAmount}`);
    
    // Update the order
    await ordersCollection.updateOne(
      { _id: problematicOrder._id },
      {
        $set: {
          totalAmount: newTotalAmount,
          finalAmount: newFinalAmount,
          items: problematicOrder.items
        }
      }
    );
    
    console.log(`  ✓ Order ${problematicOrder.orderNumber} re-fixed successfully`);
  }
  
  // Final verification
  console.log('\n=== Final Verification ===');
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
  
  if (remainingProblematic.length === 0) {
    console.log('✓ All orders now have valid amounts!');
  } else {
    console.log('Remaining problematic orders:');
    remainingProblematic.forEach(order => {
      console.log(`  - ${order.orderNumber}: totalAmount=${order.totalAmount}, finalAmount=${order.finalAmount}`);
    });
  }
  
  await mongoose.connection.close();
  console.log('\nDatabase connection closed.');
}

fixProductPrices().catch(console.error);