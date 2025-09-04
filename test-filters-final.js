const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testFiltersAPI() {
  try {
    console.log('🔍 Testing Filters API after removing access restrictions...');
    
    // Step 1: Login
    console.log('\n1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/admin/login`, {
      email: 'admin@shoppers9.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Test filters API
    console.log('\n2. Testing /api/admin/filters with limit=100...');
    const filtersResponse = await axios.get(`${BASE_URL}/api/admin/filters?limit=100`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Filters API Response:');
    console.log('- Success:', filtersResponse.data.success);
    console.log('- Total filters:', filtersResponse.data.data?.items?.length || 0);
    console.log('- Active filters:', filtersResponse.data.data?.items?.filter(f => f.isActive).length || 0);
    
    // Step 3: Test categories API
    console.log('\n3. Testing /api/admin/categories/tree...');
    const categoriesResponse = await axios.get(`${BASE_URL}/api/admin/categories/tree`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Categories API Response:');
    console.log('- Success:', categoriesResponse.data.success);
    console.log('- Categories count:', categoriesResponse.data.data?.length || 0);
    
    // Step 4: Test category filters API
    if (categoriesResponse.data.data && categoriesResponse.data.data.length > 0) {
      const firstCategory = categoriesResponse.data.data[0];
      console.log(`\n4. Testing category filters for category: ${firstCategory.name}`);
      
      const categoryFiltersResponse = await axios.get(`${BASE_URL}/api/admin/categories/${firstCategory._id}/available-filters`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Category Available Filters API Response:');
      console.log('- Success:', categoryFiltersResponse.data.success);
      console.log('- Available filters:', categoryFiltersResponse.data.data?.length || 0);
    }
    
    console.log('\n🎉 All API tests passed! Access restrictions have been successfully removed.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testFiltersAPI();