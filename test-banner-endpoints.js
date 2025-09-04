const axios = require('axios');

async function testBannerEndpoints() {
  try {
    console.log('Testing banner endpoints...');
    
    // First, login to get admin token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'admin@shoppers9.com',
      password: 'admin123'
    });
    
    console.log('Login response status:', loginResponse.status);
    const token = loginResponse.data.data?.accessToken || loginResponse.data.accessToken || loginResponse.data.token;
    
    if (!token) {
      console.error('No token found in response:', loginResponse.data);
      return;
    }
    
    console.log('✅ Login successful, token received');
    
    // Test banner endpoints
    console.log('\n2. Testing GET /api/admin/banners...');
    const bannersResponse = await axios.get('http://localhost:4000/api/admin/banners', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Banners endpoint working!');
    console.log('Response status:', bannersResponse.status);
    console.log('Response data:', JSON.stringify(bannersResponse.data, null, 2));
    
    // Test active banners endpoint
    console.log('\n3. Testing GET /api/admin/banners/active...');
    const activeBannersResponse = await axios.get('http://localhost:4000/api/admin/banners/active', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Active banners endpoint working!');
    console.log('Response status:', activeBannersResponse.status);
    console.log('Response data:', JSON.stringify(activeBannersResponse.data, null, 2));
    
    console.log('\n🎉 All banner endpoints are working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing banner endpoints:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testBannerEndpoints();