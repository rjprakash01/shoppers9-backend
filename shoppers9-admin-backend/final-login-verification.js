const axios = require('axios');
require('dotenv').config();

async function finalLoginVerification() {
  try {
    console.log('=== FINAL ADMIN LOGIN VERIFICATION ===');
    
    const API_BASE_URL = 'http://localhost:5003/api';
    console.log('Testing API at:', API_BASE_URL);
    
    // Test all admin types with their credentials
    const adminCredentials = [
      {
        type: 'Super Admin',
        email: 'superadmin@shoppers9.com',
        password: 'SuperAdmin@123',
        expectedRole: 'super_admin'
      },
      {
        type: 'Admin',
        email: 'admin@shoppers9.com',
        password: 'Admin@123',
        expectedRole: 'admin'
      },
      {
        type: 'Sub Admin',
        email: 'subadmin@shoppers9.com',
        password: 'SubAdmin@123',
        expectedRole: 'moderator'
      }
    ];
    
    let allTestsPassed = true;
    
    for (const cred of adminCredentials) {
      console.log(`\n🔐 Testing ${cred.type} Login:`);
      console.log(`   Email: ${cred.email}`);
      console.log(`   Password: ${cred.password}`);
      
      try {
        // Step 1: Login
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: cred.email,
          password: cred.password
        });
        
        if (!loginResponse.data.success) {
          console.log(`   ❌ Login failed: ${loginResponse.data.message}`);
          allTestsPassed = false;
          continue;
        }
        
        console.log(`   ✅ Login successful`);
        const token = loginResponse.data.data.accessToken;
        const user = loginResponse.data.data.user;
        
        console.log(`   📋 User Details:`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Name: ${user.firstName} ${user.lastName}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Role: ${user.primaryRole}`);
        console.log(`      Active: ${user.isActive}`);
        
        // Step 2: Verify token with /auth/me
        try {
          const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (meResponse.data.success) {
            console.log(`   ✅ Token verification successful`);
            console.log(`   📋 Verified Role: ${meResponse.data.data.user.role}`);
          } else {
            console.log(`   ❌ Token verification failed: ${meResponse.data.message}`);
            allTestsPassed = false;
          }
        } catch (authError) {
          console.log(`   ❌ Token verification error: ${authError.response?.data?.message || authError.message}`);
          allTestsPassed = false;
        }
        
        // Step 3: Test admin endpoint access
        try {
          const ordersResponse = await axios.get(`${API_BASE_URL}/admin/orders`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            params: {
              page: 1,
              limit: 5
            }
          });
          
          if (ordersResponse.data.success) {
            console.log(`   ✅ Admin endpoints accessible`);
            console.log(`   📊 Orders found: ${ordersResponse.data.data?.orders?.length || 0}`);
          } else {
            console.log(`   ❌ Admin endpoint access failed`);
            allTestsPassed = false;
          }
        } catch (adminError) {
          console.log(`   ❌ Admin endpoint error: ${adminError.response?.data?.message || adminError.message}`);
          allTestsPassed = false;
        }
        
      } catch (error) {
        console.log(`   ❌ Login request failed: ${error.response?.data?.message || error.message}`);
        allTestsPassed = false;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    if (allTestsPassed) {
      console.log('🎉 ALL ADMIN LOGIN TESTS PASSED!');
      console.log('✅ Super Admin can log in');
      console.log('✅ Admin can log in');
      console.log('✅ Sub Admin can log in');
      console.log('✅ All tokens work correctly');
      console.log('✅ All admin endpoints are accessible');
      console.log('\n🚀 Admin login system is fully functional!');
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('Please check the errors above.');
    }
    console.log('='.repeat(50));
    
    // Test demo credentials endpoint
    console.log('\n📋 Demo Credentials Available:');
    try {
      const demoResponse = await axios.get(`${API_BASE_URL}/auth/demo-credentials`);
      if (demoResponse.data.success) {
        const demo = demoResponse.data.data;
        console.log(`   Super Admin: ${demo.superAdmin.email} / ${demo.superAdmin.password}`);
        console.log(`   Admin: ${demo.admin.email} / ${demo.admin.password}`);
        console.log(`   Sub Admin: ${demo.subAdmin.email} / ${demo.subAdmin.password}`);
      }
    } catch (error) {
      console.log('   ❌ Could not fetch demo credentials');
    }
    
  } catch (error) {
    console.error('Verification error:', error.message);
  }
}

finalLoginVerification();