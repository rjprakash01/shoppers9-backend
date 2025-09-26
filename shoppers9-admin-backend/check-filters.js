const axios = require('axios');

async function checkFilters() {
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:5001/api/admin/auth/login', {
      email: 'superadmin@shoppers9.com',
      password: 'SuperAdmin@123'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    
    // Get all filters
    const filtersResponse = await axios.get('http://localhost:5001/api/admin/filters', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('🔍 Total filters:', filtersResponse.data.data.filters.length);
    
    // Check categoryLevels configuration
    const filters = filtersResponse.data.data.filters;
    const filtersWithLevels = filters.filter(f => f.categoryLevels && f.categoryLevels.length > 0);
    const activeFiltersWithLevels = filters.filter(f => f.isActive && f.categoryLevels && f.categoryLevels.length > 0);
    
    console.log('\nFilter categoryLevels analysis:');
    console.log(`- Total filters: ${filters.length}`);
    console.log(`- Filters with categoryLevels: ${filtersWithLevels.length}`);
    console.log(`- Active filters with categoryLevels: ${activeFiltersWithLevels.length}`);
    
    console.log('\nFilters with categoryLevels:');
    filtersWithLevels.forEach(filter => {
      console.log(`- ${filter.name}: levels=${JSON.stringify(filter.categoryLevels)}, active=${filter.isActive}`);
    });
    
    if (activeFiltersWithLevels.length === 0) {
      console.log('\n❌ ISSUE FOUND: No active filters have categoryLevels configured!');
      console.log('This is why no filters are showing when categories are selected.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkFilters();