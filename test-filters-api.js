const axios = require('axios');

const testFiltersAPI = async () => {
  try {
    console.log('🔐 Testing admin login...');
    const loginRes = await axios.post('http://localhost:5002/api/admin/auth/login', {
      email: 'admin@shoppers9.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful:', !!loginRes.data.accessToken);
    const token = loginRes.data.accessToken;
    
    console.log('\n🔍 Testing filters API...');
    const filtersRes = await axios.get('http://localhost:5002/api/admin/filters', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Filters API response:', filtersRes.data.success);
    console.log('📊 Filters count:', filtersRes.data.data?.filters?.length || 0);
    
    if (filtersRes.data.data?.filters?.length > 0) {
      console.log('\n📋 Sample filters:');
      filtersRes.data.data.filters.slice(0, 5).forEach(filter => {
        console.log(`   - ${filter.displayName} (${filter.name}) - Active: ${filter.isActive}`);
      });
    }
    
    console.log('\n🔍 Testing categories API...');
    const categoriesRes = await axios.get('http://localhost:5002/api/admin/categories/tree', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Categories API response:', categoriesRes.data.success);
    console.log('📊 Categories count:', categoriesRes.data.data?.length || 0);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

testFiltersAPI();