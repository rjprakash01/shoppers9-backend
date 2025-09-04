const axios = require('axios');
const fs = require('fs');

async function getAdminToken() {
  try {
    console.log('Logging in as admin...');
    
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@shoppers9.com',
      password: 'admin123'
    });
    
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
    
    // Extract token from response
    const token = loginResponse.data.data?.accessToken || loginResponse.data.accessToken || loginResponse.data.token;
    
    if (!token) {
      console.error('No token found in response');
      return;
    }
    
    console.log('Token:', token);
    
    // Save token to file
    fs.writeFileSync('admin_token.json', JSON.stringify({
      token: token,
      user: loginResponse.data.data?.user || loginResponse.data.user
    }, null, 2));
    
    console.log('Token saved to admin_token.json');
    
    // Now test the filter endpoint
    const categoryId = '68b6467e61f41361ffcf4aad';
    const filterResponse = await axios.get(
      `http://localhost:5001/api/admin/categories/${categoryId}/filters`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log('\n=== Filter API Response ===');
    console.log('Status:', filterResponse.status);
    console.log('Data:', JSON.stringify(filterResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

getAdminToken();