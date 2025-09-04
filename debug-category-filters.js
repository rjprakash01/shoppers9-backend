const axios = require('axios');

async function debugCategoryFilters() {
  try {
    console.log('🔍 Debugging category filters API response...');
    
    // Login
    const loginResponse = await axios.post('http://localhost:5001/api/admin/auth/login', {
      email: 'admin@shoppers9.com',
      password: 'admin123'
    });
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Get T-Shirts category
    const categoriesResponse = await axios.get('http://localhost:5001/api/admin/categories?level=3', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const tshirtsCategory = categoriesResponse.data.data.data.find(cat => cat.name === 'T-Shirts');
    if (!tshirtsCategory) {
      console.log('❌ T-Shirts category not found');
      return;
    }
    
    console.log('\n📋 T-Shirts Category Info:');
    console.log('ID:', tshirtsCategory._id);
    console.log('Name:', tshirtsCategory.name);
    console.log('Level:', tshirtsCategory.level);
    
    // Get category filters
    console.log('\n🔍 Fetching category filters...');
    const categoryFiltersResponse = await axios.get(`http://localhost:5001/api/admin/categories/${tshirtsCategory._id}/filters`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('\n📊 Raw API Response:');
    console.log('Status:', categoryFiltersResponse.status);
    console.log('Response structure:', Object.keys(categoryFiltersResponse.data));
    console.log('Data structure:', Object.keys(categoryFiltersResponse.data.data || {}));
    console.log('Full response:', JSON.stringify(categoryFiltersResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugCategoryFilters();