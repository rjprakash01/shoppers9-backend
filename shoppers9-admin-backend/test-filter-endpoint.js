const axios = require('axios');
const fs = require('fs');

async function testFilterEndpoint() {
  try {
    // Try to read token from the login response file
    let token = null;
    try {
      const tokenData = JSON.parse(fs.readFileSync('super_admin_login2.json', 'utf8'));
      token = tokenData.token;
      console.log('Using token from super_admin_login2.json');
    } catch (e) {
      console.log('No token file found, testing without auth');
    }
    
    const categoryId = '68b6467e61f41361ffcf4aad'; // Android Phones category
    const url = `http://localhost:5001/api/admin/categories/${categoryId}/filters`;
    
    console.log('Testing URL:', url);
    
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await axios.get(url, { headers });
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testFilterEndpoint();