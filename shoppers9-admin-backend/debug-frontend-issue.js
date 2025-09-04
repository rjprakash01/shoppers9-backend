const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing backend API connectivity...');
    
    // Test 1: Health check
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5001/health');
    console.log('Health check status:', healthResponse.status);
    console.log('Health check response:', healthResponse.data);
    
    // Test 2: Admin login
    console.log('\n2. Testing admin login...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/admin/login', {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    console.log('Login status:', loginResponse.status);
    console.log('Login response:', loginResponse.data);
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.accessToken || loginResponse.data.data.token;
      console.log('Login successful! Token received.');
      
      // Test 3: Get categories with auth
      console.log('\n3. Testing categories endpoint with auth...');
      const categoriesResponse = await axios.get('http://localhost:5001/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Categories status:', categoriesResponse.status);
      console.log('Categories response:', categoriesResponse.data);
    }
    
  } catch (error) {
    console.error('Error during API test:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Full response:', error.response?.data);
  }
}

testAPI();