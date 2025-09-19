const mongoose = require('mongoose');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoppers9', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function fixNullOrderAmounts() {
  try {
    await connectDB();
    console.log('\n=== FIXING NULL ORDER AMOUNTS ===\n');
    
    const ordersCollection = mongoose.connection.db.collection('orders');
    const productsCollection = mongoose.connection.db.collection('products');
    
    // Find orders with null/zero amounts
    const problematicOrders = await ordersCollection.find({
      $or: [
        { totalAmount: null },
        { finalAmount: null },
        { totalAmount: 0 },
        { finalAmount: 0 },
        { 'items.price': null },
        { 'items.originalPrice': null }
      ]
    }).toArray();
    
    console.log(`Found ${problematicOrders.length} orders with null/zero amounts`);
    
    let fixedCount = 0;
    
    for (const order of problematicOrders) {
      console.log(`\n🔧 Fixing order: ${order.orderNumber}`);
      console.log(`  Current total: ${order.totalAmount}`);
      console.log(`  Current final: ${order.finalAmount}`);
      
      let needsUpdate = false;
      let updatedItems = [...order.items];
      
      // Fix null prices in items by looking up product prices
      for (let i = 0; i < updatedItems.length; i++) {
        const item = updatedItems[i];
        
        if (item.price === null || item.originalPrice === null) {
          console.log(`    Fixing item ${i + 1}: ${item.productName || 'Unknown'}`);
          
          // Look up the product to get correct prices
          const product = await productsCollection.findOne({ _id: item.product });
          
          if (product) {
            // Use product's base price or variant price
            let productPrice = product.price || 0;
            
            // If there's a variant, try to find its price
            if (item.variantId && product.variants) {
              const variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
              if (variant && variant.price) {
                productPrice = variant.price;
              }
            }
            
            if (item.price === null) {
              updatedItems[i].price = productPrice;
              console.log(`      Set price: ${productPrice}`);
              needsUpdate = true;
            }
            
            if (item.originalPrice === null) {
              updatedItems[i].originalPrice = productPrice;
              console.log(`      Set original price: ${productPrice}`);
              needsUpdate = true;
            }
          } else {
            console.log(`      ⚠️  Product not found, setting default prices`);
            if (item.price === null) {
              updatedItems[i].price = 0;
              needsUpdate = true;
            }
            if (item.originalPrice === null) {
              updatedItems[i].originalPrice = 0;
              needsUpdate = true;
            }
          }
        }
      }
      
      // Recalculate order amounts
      const originalAmount = updatedItems.reduce((sum, item) => {
        return sum + ((item.originalPrice || 0) * (item.quantity || 1));
      }, 0);
      
      const discountedAmount = updatedItems.reduce((sum, item) => {
        return sum + ((item.price || 0) * (item.quantity || 1));
      }, 0);
      
      // Calculate fees based on discounted amount
      const platformFee = discountedAmount > 500 ? 0 : 20;
      const deliveryCharge = discountedAmount > 500 ? 0 : 50;
      
      // Apply coupon discount if available
      const couponDiscount = order.couponDiscount || 0;
      
      // Calculate correct discount (only item-level, not including coupon)
      const itemLevelDiscount = originalAmount - discountedAmount;
      
      // Calculate correct finalAmount (discounted amount - coupon discount + fees)
      let correctFinalAmount = discountedAmount - couponDiscount + platformFee + deliveryCharge;
      if (correctFinalAmount < 0) {
        correctFinalAmount = platformFee + deliveryCharge; // Minimum amount should be fees only
      }
      
      const correctTotalAmount = originalAmount;
      const correctDiscount = itemLevelDiscount;
      
      console.log(`  Calculated total: ${correctTotalAmount}`);
      console.log(`  Calculated final: ${correctFinalAmount}`);
      console.log(`  Calculated discount: ${correctDiscount}`);
      
      // Update if amounts are different or if items were updated
      if (needsUpdate || 
          order.totalAmount !== correctTotalAmount || 
          order.finalAmount !== correctFinalAmount || 
          order.discount !== correctDiscount) {
        
        const updateData = {
          items: updatedItems,
          totalAmount: correctTotalAmount,
          finalAmount: correctFinalAmount,
          discount: correctDiscount,
          platformFee: platformFee,
          deliveryCharge: deliveryCharge
        };
        
        await ordersCollection.updateOne(
          { _id: order._id },
          { $set: updateData }
        );
        
        console.log(`  ✅ Fixed order ${order.orderNumber}`);
        fixedCount++;
      } else {
        console.log(`  ℹ️  Order ${order.orderNumber} already correct`);
      }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} orders successfully`);
    
    // Verify the fixes
    console.log('\n🔍 Verifying fixes...');
    const stillProblematic = await ordersCollection.find({
      $or: [
        { totalAmount: null },
        { finalAmount: null },
        { totalAmount: 0 },
        { finalAmount: 0 }
      ]
    }).toArray();
    
    console.log(`Remaining problematic orders: ${stillProblematic.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixNullOrderAmounts();