const axios = require('axios');

async function getTokenOnly() {
  try {
    const response = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin1@shoppers9.com',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success && response.data.data.accessToken) {
      console.log(response.data.data.accessToken);
    } else {
      console.error('Login failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

getTokenOnly();