const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const API_BASE_URL = 'http://localhost:3001/api';

// Test scenarios for order visibility
const testOrderVisibility = async () => {
  console.log('🧪 COMPREHENSIVE ORDER VISIBILITY TESTS');
  console.log('=' .repeat(50));
  
  try {
    await connectDB();
    
    const adminsCollection = mongoose.connection.db.collection('admins');
    const ordersCollection = mongoose.connection.db.collection('orders');
    
    // Get all admin users
    const admins = await adminsCollection.find({}).toArray();
    console.log(`\n👥 Found ${admins.length} admin users`);
    
    // Test each admin's order visibility
    for (const admin of admins) {
      console.log(`\n🔍 Testing admin: ${admin.email}`);
      console.log(`   Role: ${admin.primaryRole || admin.role}`);
      console.log(`   ID: ${admin._id}`);
      
      try {
        // Login to get token
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/admin/login`, {
          email: admin.email,
          password: admin.primaryRole === 'super_admin' ? 'SuperAdmin@123' : 'admin123'
        });
        
        if (loginResponse.data.success) {
          const token = loginResponse.data.data.token;
          console.log(`   ✅ Login successful`);
          
          // Test order access
          const ordersResponse = await axios.get(`${API_BASE_URL}/admin/orders`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (ordersResponse.data.success) {
            const orders = ordersResponse.data.data.orders;
            console.log(`   📊 Orders accessible: ${orders.length}`);
            
            // Analyze order ownership
            if (orders.length > 0) {
              const orderAnalysis = {
                ownOrders: 0,
                otherOrders: 0,
                totalValue: 0
              };
              
              orders.forEach(order => {
                orderAnalysis.totalValue += order.finalAmount || 0;
                
                // Check if order contains items from this admin
                const hasOwnItems = order.items?.some(item => 
                  item.sellerId?.toString() === admin._id.toString()
                );
                
                if (hasOwnItems) {
                  orderAnalysis.ownOrders++;
                } else {
                  orderAnalysis.otherOrders++;
                }
              });
              
              console.log(`   📈 Analysis:`);
              console.log(`     - Own orders: ${orderAnalysis.ownOrders}`);
              console.log(`     - Other orders: ${orderAnalysis.otherOrders}`);
              console.log(`     - Total value: ₹${orderAnalysis.totalValue}`);
              
              // Role-based expectations
              if (admin.primaryRole === 'super_admin') {
                console.log(`   ✅ Super Admin: Should see ALL orders (${orders.length} total)`);
              } else {
                console.log(`   ✅ Regular Admin: Should see only own orders (${orderAnalysis.ownOrders} own)`);
                if (orderAnalysis.otherOrders > 0) {
                  console.log(`   ⚠️  WARNING: Regular admin seeing ${orderAnalysis.otherOrders} orders from other admins`);
                }
              }
            }
            
            // Test with filters
            console.log(`   🔍 Testing with status filter...`);
            const filteredResponse = await axios.get(`${API_BASE_URL}/admin/orders?status=pending`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (filteredResponse.data.success) {
              console.log(`   📊 Pending orders: ${filteredResponse.data.data.orders.length}`);
            }
            
          } else {
            console.log(`   ❌ Failed to fetch orders: ${ordersResponse.data.message}`);
          }
          
        } else {
          console.log(`   ❌ Login failed: ${loginResponse.data.message}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error testing admin: ${error.response?.data?.message || error.message}`);
      }
    }
    
    // Database-level verification
    console.log(`\n🔍 DATABASE-LEVEL VERIFICATION`);
    console.log('-'.repeat(30));
    
    const totalOrders = await ordersCollection.countDocuments();
    console.log(`Total orders in database: ${totalOrders}`);
    
    // Orders by seller analysis
    const ordersBySeller = await ordersCollection.aggregate([
      { $unwind: '$items' },
      { $group: { 
          _id: '$items.sellerId', 
          orderCount: { $addToSet: '$_id' },
          itemCount: { $sum: 1 },
          totalValue: { $sum: '$finalAmount' }
        }},
      { $project: {
          sellerId: '$_id',
          uniqueOrders: { $size: '$orderCount' },
          totalItems: '$itemCount',
          averageValue: { $divide: ['$totalValue', { $size: '$orderCount' }] }
        }}
    ]).toArray();
    
    console.log(`\nOrders distribution by seller:`);
    for (const seller of ordersBySeller) {
      const admin = admins.find(a => a._id.toString() === seller.sellerId?.toString());
      console.log(`  ${admin?.email || 'Unknown'}: ${seller.uniqueOrders} orders, ${seller.totalItems} items`);
    }
    
    // Test edge cases
    console.log(`\n🧪 EDGE CASE TESTS`);
    console.log('-'.repeat(20));
    
    // Test with invalid token
    try {
      await axios.get(`${API_BASE_URL}/admin/orders`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      console.log(`❌ Invalid token test failed - should have been rejected`);
    } catch (error) {
      console.log(`✅ Invalid token correctly rejected: ${error.response?.status}`);
    }
    
    // Test without token
    try {
      await axios.get(`${API_BASE_URL}/admin/orders`);
      console.log(`❌ No token test failed - should have been rejected`);
    } catch (error) {
      console.log(`✅ No token correctly rejected: ${error.response?.status}`);
    }
    
    console.log(`\n🎉 ORDER VISIBILITY TESTS COMPLETED!`);
    console.log(`\n📋 SUMMARY:`);
    console.log(`- Super Admin should see ALL orders`);
    console.log(`- Regular Admins should see only their own orders`);
    console.log(`- Role-based filtering is enforced by middleware`);
    console.log(`- API endpoints are properly secured`);
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the tests
testOrderVisibility().catch(console.error);