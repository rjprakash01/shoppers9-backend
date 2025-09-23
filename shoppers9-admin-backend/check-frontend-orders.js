const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function checkFrontendOrders() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const ordersCollection = db.collection('orders');
    const adminsCollection = db.collection('admins');
    
    console.log('\n🔍 CHECKING FRONTEND ORDER VISIBILITY ISSUE');
    console.log('=' .repeat(60));
    
    // Find Vishnu admin
    const vishnu = await adminsCollection.findOne({ email: 'prakash.jetender@gmail.com' });
    
    if (!vishnu) {
      console.log('❌ Vishnu admin not found!');
      await client.close();
      return;
    }
    
    console.log(`✅ Found admin: ${vishnu.email} (ID: ${vishnu._id})`);
    
    // Get all orders visible to this admin
    console.log('\n📋 ALL ORDERS VISIBLE TO ADMIN:');
    const allVisibleOrders = await ordersCollection.find({
      'items.sellerId': vishnu._id
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`Total visible orders: ${allVisibleOrders.length}`);
    
    allVisibleOrders.forEach((order, index) => {
      console.log(`\n${index + 1}. Order: ${order.orderNumber || 'NO_ORDER_NUMBER'}`);
      console.log(`   ID: ${order._id}`);
      console.log(`   Status: ${order.orderStatus}`);
      console.log(`   Payment: ${order.paymentStatus}`);
      console.log(`   Total: ₹${order.finalAmount}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log(`   Items: ${order.items?.length || 0}`);
      
      // Check if this order has orderNumber field
      if (!order.orderNumber) {
        console.log(`   ⚠️  WARNING: Missing orderNumber field!`);
      }
      
      // Check items
      if (order.items) {
        order.items.forEach((item, i) => {
          console.log(`     Item ${i + 1}: Product=${item.product}, SellerId=${item.sellerId}`);
        });
      }
    });
    
    // Check for orders without orderNumber (might cause frontend issues)
    console.log('\n🚨 CHECKING FOR PROBLEMATIC ORDERS:');
    
    const ordersWithoutOrderNumber = allVisibleOrders.filter(order => !order.orderNumber);
    console.log(`Orders without orderNumber: ${ordersWithoutOrderNumber.length}`);
    
    if (ordersWithoutOrderNumber.length > 0) {
      console.log('\n🔧 FIXING MISSING ORDER NUMBERS:');
      
      for (const order of ordersWithoutOrderNumber) {
        const newOrderNumber = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        await ordersCollection.updateOne(
          { _id: order._id },
          { 
            $set: { 
              orderNumber: newOrderNumber,
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`   ✅ Fixed order ${order._id} -> ${newOrderNumber}`);
      }
    }
    
    // Check for orders with null/undefined values that might break frontend
    console.log('\n🔍 CHECKING FOR NULL/UNDEFINED VALUES:');
    
    const ordersWithNullValues = allVisibleOrders.filter(order => 
      order.finalAmount === null || 
      order.finalAmount === undefined ||
      !order.orderStatus ||
      !order.paymentStatus
    );
    
    console.log(`Orders with null/undefined values: ${ordersWithNullValues.length}`);
    
    if (ordersWithNullValues.length > 0) {
      console.log('\n🔧 FIXING NULL/UNDEFINED VALUES:');
      
      for (const order of ordersWithNullValues) {
        const updates = {};
        
        if (order.finalAmount === null || order.finalAmount === undefined) {
          // Calculate total from items
          const total = order.items?.reduce((sum, item) => {
            const price = item.price || 0;
            const quantity = item.quantity || 1;
            return sum + (price * quantity);
          }, 0) || 0;
          
          updates.finalAmount = total;
          console.log(`   🔧 Setting finalAmount to ${total} for order ${order.orderNumber}`);
        }
        
        if (!order.orderStatus) {
          updates.orderStatus = 'pending';
          console.log(`   🔧 Setting orderStatus to 'pending' for order ${order.orderNumber}`);
        }
        
        if (!order.paymentStatus) {
          updates.paymentStatus = 'pending';
          console.log(`   🔧 Setting paymentStatus to 'pending' for order ${order.orderNumber}`);
        }
        
        if (Object.keys(updates).length > 0) {
          updates.updatedAt = new Date();
          
          await ordersCollection.updateOne(
            { _id: order._id },
            { $set: updates }
          );
          
          console.log(`   ✅ Updated order ${order.orderNumber}`);
        }
      }
    }
    
    // Final verification
    console.log('\n🧪 FINAL VERIFICATION:');
    
    const finalOrders = await ordersCollection.find({
      'items.sellerId': vishnu._id
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`\n✅ FINAL RESULT: ${finalOrders.length} orders should be visible`);
    
    finalOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. ${order.orderNumber} - ${order.orderStatus} - ₹${order.finalAmount}`);
    });
    
    // Check the most recent order specifically
    const mostRecentOrder = finalOrders[0];
    if (mostRecentOrder) {
      console.log('\n🕐 MOST RECENT ORDER:');
      console.log(`   Order Number: ${mostRecentOrder.orderNumber}`);
      console.log(`   Created: ${mostRecentOrder.createdAt}`);
      console.log(`   Status: ${mostRecentOrder.orderStatus}`);
      console.log(`   Payment: ${mostRecentOrder.paymentStatus}`);
      console.log(`   Total: ₹${mostRecentOrder.finalAmount}`);
      
      const minutesAgo = Math.round((Date.now() - mostRecentOrder.createdAt.getTime()) / 60000);
      console.log(`   Time ago: ${minutesAgo} minutes`);
      
      if (minutesAgo < 10) {
        console.log(`   🔥 This should definitely be visible in the frontend!`);
      }
    }
    
    await client.close();
    
    console.log('\n🎯 SUMMARY:');
    console.log(`✅ Database has ${finalOrders.length} orders for admin`);
    console.log(`✅ All orders now have proper orderNumber, status, and amounts`);
    console.log(`🔄 Please refresh the admin frontend to see all orders`);
    
  } catch (error) {
    console.error('❌ Error checking frontend orders:', error);
  }
}

checkFrontendOrders().catch(console.error);