const axios = require('axios');

// Test the login API exactly as the frontend would call it with CORS
async function testFrontendLoginWithCORS() {
  try {
    console.log('Testing frontend login API call with CORS...');
    
    const response = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      withCredentials: true
    });
    
    console.log('✅ Status:', response.status);
    console.log('✅ Login successful!');
    console.log('Token:', response.data.token.substring(0, 50) + '...');
    console.log('User:', response.data.user.name, '-', response.data.user.email);
    console.log('Role:', response.data.user.role);
    
  } catch (error) {
    console.error('❌ Full error object:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
      console.error('❌ Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('❌ Request was made but no response received');
      console.error('❌ Request:', error.request);
    } else {
      console.error('❌ Error setting up request:', error.message);
    }
  }
}

testFrontendLoginWithCORS();