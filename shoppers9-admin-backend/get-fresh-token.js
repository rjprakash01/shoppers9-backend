const axios = require('axios');

async function getFreshToken() {
  try {
    console.log('Attempting to login and get fresh token...');
    
    const response = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin1@shoppers9.com',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Login response:', response.data);
    
    if (response.data.success && response.data.data.accessToken) {
      console.log('\nFresh token obtained:');
      console.log(response.data.data.accessToken);
      
      // Test the token with categories endpoint
      console.log('\nTesting token with categories endpoint...');
      
      const categoriesResponse = await axios.get('http://localhost:5001/api/admin/categories/tree', {
        headers: {
          'Authorization': `Bearer ${response.data.data.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Categories response:', categoriesResponse.data);
    } else {
      console.log('Login failed:', response.data);
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

getFreshToken();