const axios = require('axios');

// Test authentication status
async function testAuthStatus() {
  try {
    console.log('🔍 Testing authentication status...');
    
    // Test without token first
    console.log('\n1. Testing without token...');
    try {
      const response = await axios.get('http://localhost:4000/api/admin/products?page=1&limit=1');
      console.log('✅ Request succeeded without token (unexpected):', response.status);
    } catch (error) {
      console.log('❌ Request failed without token (expected):', error.response?.status, error.response?.data?.message);
    }
    
    // Test with a dummy token
    console.log('\n2. Testing with dummy token...');
    try {
      const response = await axios.get('http://localhost:4000/api/admin/products?page=1&limit=1', {
        headers: {
          'Authorization': 'Bearer dummy-token'
        }
      });
      console.log('✅ Request succeeded with dummy token (unexpected):', response.status);
    } catch (error) {
      console.log('❌ Request failed with dummy token (expected):', error.response?.status, error.response?.data?.message);
    }
    
    // Try to login and get a real token
    console.log('\n3. Attempting to login...');
    try {
      const loginResponse = await axios.post('http://localhost:4000/api/auth/admin/login', {
        email: 'admin@shoppers9.com',
        password: 'admin123'
      });
      
      if (loginResponse.data.success) {
        const token = loginResponse.data.data.accessToken;
        console.log('✅ Login successful, token received');
        
        // Test with real token
        console.log('\n4. Testing with real token...');
        try {
          const response = await axios.get('http://localhost:4000/api/admin/products/category/68b8b953a212a6a843476429?page=1&limit=12', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('✅ Products API with real token succeeded:', response.status);
          console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
          
        } catch (error) {
          console.log('❌ Products API with real token failed:', error.response?.status, error.response?.data);
        }
        
      } else {
        console.log('❌ Login failed:', loginResponse.data.message);
      }
      
    } catch (error) {
      console.log('❌ Login request failed:', error.response?.status, error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAuthStatus();