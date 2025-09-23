const { MongoClient } = require('mongodb');
const axios = require('axios');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9';
const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://localhost:5003/api';

async function getSettings() {
  try {
    const response = await axios.get(`${ADMIN_API_URL}/settings/public`, {
      timeout: 5000
    });
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
  } catch (error) {
    console.warn('Failed to fetch settings from admin backend, using defaults:', error.message);
  }

  // Return default settings if fetch fails
  return {
    freeDeliveryMinAmount: 500,
    deliveryFee: 50,
    deliveryFeeThreshold: 500,
    platformFee: 20,
    platformFeeType: 'fixed',
    taxRate: 0,
    taxIncluded: true,
    minOrderAmount: 100,
    maxOrderAmount: 50000,
    codEnabled: true,
    onlinePaymentEnabled: true,
    businessName: 'Shoppers9',
    businessEmail: 'support@shoppers9.com',
    businessPhone: '+91-9999999999',
    businessAddress: 'India',
    orderProcessingTime: 24,
    deliveryTimeMin: 3,
    deliveryTimeMax: 7,
    returnPolicyDays: 7,
    refundProcessingDays: 5
  };
}

function calculatePlatformFee(subtotal, settings) {
  if (settings.platformFeeType === 'percentage') {
    return (subtotal * settings.platformFee) / 100;
  } else {
    return settings.platformFee;
  }
}

function calculateDeliveryFee(subtotal, settings) {
  if (subtotal >= settings.freeDeliveryMinAmount) {
    return 0; // Free delivery
  }
  return settings.deliveryFee;
}

async function fixOrderFees() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const ordersCollection = db.collection('orders');
    
    // Get current settings
    console.log('📋 Fetching current platform settings...');
    const settings = await getSettings();
    console.log('✅ Settings fetched:', {
      freeDeliveryMinAmount: settings.freeDeliveryMinAmount,
      deliveryFee: settings.deliveryFee,
      platformFee: settings.platformFee,
      platformFeeType: settings.platformFeeType
    });
    
    // Find all orders
    console.log('🔍 Finding all orders...');
    const orders = await ordersCollection.find({}).toArray();
    console.log(`📊 Found ${orders.length} orders to check`);
    
    let fixedCount = 0;
    
    for (const order of orders) {
      try {
        console.log(`\n🔍 Checking order ${order.orderNumber}...`);
        
        // Calculate the correct discounted amount from items
        const discountedAmount = order.items.reduce((sum, item) => {
          return sum + ((item.price || 0) * (item.quantity || 1));
        }, 0);
        
        console.log(`  💰 Discounted amount: ${discountedAmount}`);
        
        // Calculate correct fees based on current settings
        const correctPlatformFee = calculatePlatformFee(discountedAmount, settings);
        const correctDeliveryCharge = calculateDeliveryFee(discountedAmount, settings);
        
        console.log(`  🏢 Current platform fee: ${order.platformFee || 0} -> Correct: ${correctPlatformFee}`);
        console.log(`  🚚 Current delivery charge: ${order.deliveryCharge || 0} -> Correct: ${correctDeliveryCharge}`);
        
        // Check if fees need updating
        const needsUpdate = 
          (order.platformFee || 0) !== correctPlatformFee ||
          (order.deliveryCharge || 0) !== correctDeliveryCharge;
        
        if (needsUpdate) {
          // Recalculate final amount
          const couponDiscount = order.couponDiscount || 0;
          let correctFinalAmount = discountedAmount - couponDiscount + correctPlatformFee + correctDeliveryCharge;
          
          if (correctFinalAmount < 0) {
            correctFinalAmount = correctPlatformFee + correctDeliveryCharge;
          }
          
          console.log(`  💳 Current final amount: ${order.finalAmount} -> Correct: ${correctFinalAmount}`);
          
          // Update the order
          await ordersCollection.updateOne(
            { _id: order._id },
            {
              $set: {
                platformFee: correctPlatformFee,
                deliveryCharge: correctDeliveryCharge,
                finalAmount: correctFinalAmount
              }
            }
          );
          
          console.log(`  ✅ Fixed order ${order.orderNumber}`);
          fixedCount++;
        } else {
          console.log(`  ✅ Order ${order.orderNumber} fees are already correct`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error fixing order ${order.orderNumber}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} orders successfully`);
    
    // Verify the fixes
    console.log('\n🔍 Verifying fixes...');
    const updatedOrders = await ordersCollection.find({}).toArray();
    
    let correctCount = 0;
    for (const order of updatedOrders) {
      const discountedAmount = order.items.reduce((sum, item) => {
        return sum + ((item.price || 0) * (item.quantity || 1));
      }, 0);
      
      const expectedPlatformFee = calculatePlatformFee(discountedAmount, settings);
      const expectedDeliveryCharge = calculateDeliveryFee(discountedAmount, settings);
      
      if ((order.platformFee || 0) === expectedPlatformFee && 
          (order.deliveryCharge || 0) === expectedDeliveryCharge) {
        correctCount++;
      }
    }
    
    console.log(`✅ Verification complete: ${correctCount}/${updatedOrders.length} orders have correct fees`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixOrderFees().catch(console.error);