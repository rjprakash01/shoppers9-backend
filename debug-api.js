const axios = require('axios');

async function debugAPI() {
  try {
    console.log('🔍 Debugging API responses...');
    
    // Login
    console.log('\n1. Testing login...');
    const login = await axios.post('http://localhost:5001/api/auth/admin/login', {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    console.log('Login response structure:', Object.keys(login.data));
    console.log('Login data:', JSON.stringify(login.data, null, 2));
    
    const token = login.data.data?.accessToken || login.data.accessToken;
    if (!token) {
      console.log('❌ No token found in login response');
      return;
    }
    console.log('✅ Token obtained');
    
    // Test filters endpoint
    console.log('\n2. Testing filters endpoint...');
    try {
      const filters = await axios.get('http://localhost:5001/api/admin/filters', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Filters response structure:', Object.keys(filters.data));
      console.log('Filters data:', JSON.stringify(filters.data, null, 2));
    } catch (err) {
      console.log('❌ Filters endpoint error:', err.response?.data || err.message);
    }
    
    // Test categories endpoint
    console.log('\n3. Testing categories endpoint...');
    try {
      const categories = await axios.get('http://localhost:5001/api/admin/categories?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Categories response structure:', Object.keys(categories.data));
      console.log('Categories data sample:', JSON.stringify(categories.data, null, 2));
    } catch (err) {
      console.log('❌ Categories endpoint error:', err.response?.data || err.message);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
}

debugAPI();