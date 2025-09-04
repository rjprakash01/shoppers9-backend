const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testFilterResponse() {
  try {
    console.log('🔍 Testing Filter API Response...');
    
    // First, login to get token
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@shoppers9.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    
    // Test GET /api/admin/filters
    const filtersResponse = await axios.get(`${BASE_URL}/api/admin/filters`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n📊 Filters API Response Status:', filtersResponse.status);
    console.log('📊 Response Structure:');
    
    if (filtersResponse.data && filtersResponse.data.success && filtersResponse.data.data) {
      const filters = filtersResponse.data.data.filters;
      console.log(`\n🔍 Found ${filters.length} filters`);
      
      // Check first few filters for categoryLevels and categories
      filters.slice(0, 3).forEach((filter, index) => {
        console.log(`\n${index + 1}. Filter: ${filter.displayName || filter.name}`);
        console.log(`   - ID: ${filter._id}`);
        console.log(`   - Type: ${filter.type}`);
        console.log(`   - Data Type: ${filter.dataType}`);
        console.log(`   - Category Levels: ${JSON.stringify(filter.categoryLevels)}`);
        console.log(`   - Categories: ${JSON.stringify(filter.categories)}`);
        console.log(`   - Options Count: ${filter.options ? filter.options.length : 0}`);
        
        if (filter.categories && filter.categories.length > 0) {
          console.log(`   - Category Details:`);
          filter.categories.forEach((cat, catIndex) => {
            console.log(`     ${catIndex + 1}. ${cat.name || cat.displayName} (Level ${cat.level})`);
          });
        }
      });
    } else {
      console.log('❌ Unexpected response structure');
      console.log('Full response:', JSON.stringify(filtersResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testFilterResponse();