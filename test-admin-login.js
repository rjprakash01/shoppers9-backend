const axios = require('axios');

// Test admin login and banner creation through admin panel flow
async function testAdminPanelFlow() {
  const baseURL = 'http://localhost:5001';
  
  try {
    console.log('🔧 Setting up test admin...');
    await axios.post(`${baseURL}/api/create-test-admin`);
    console.log('✅ Test admin ready');
    
    console.log('\n🔐 Testing admin login...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@shoppers9.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('   User:', loginResponse.data.data.user.name);
    console.log('   Role:', loginResponse.data.data.user.role);
    console.log('   Token received:', !!loginResponse.data.data.accessToken);
    
    const token = loginResponse.data.data.accessToken;
    
    console.log('\n📋 Testing banner list retrieval...');
    const bannersResponse = await axios.get(`${baseURL}/api/admin/banners`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Banner list retrieved successfully!');
    console.log('   Total banners:', bannersResponse.data.data.pagination.total);
    
    console.log('\n🎯 Admin panel authentication flow is working correctly!');
    console.log('\n📝 To use the admin panel:');
    console.log('   1. Go to: http://localhost:5173/login');
    console.log('   2. Email: admin@shoppers9.com');
    console.log('   3. Password: admin123');
    console.log('   4. After login, go to: http://localhost:5173/banners');
    console.log('   5. Click "Add Banner" to create new banners');
    
  } catch (error) {
    console.log('❌ Error in admin panel flow:');
    console.log('   Error:', error.response?.data || error.message);
  }
}

testAdminPanelFlow();