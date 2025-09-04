const axios = require('axios');

async function debugAvailableFilters() {
  try {
    console.log('🔍 Debugging available filters API...');
    
    // Login
    const login = await axios.post('http://localhost:5001/api/auth/admin/login', {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    const token = login.data.data.accessToken;
    console.log('✅ Login successful');
    
    // Get a level 2 category
    const categories = await axios.get('http://localhost:5001/api/admin/categories?limit=100', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const level2Category = categories.data.data.categories.find(cat => cat.level === 2);
    console.log(`\nTesting with category: ${level2Category.name} (${level2Category.id})`);
    
    // Get available filters for this category
    const availableFilters = await axios.get(`http://localhost:5001/api/admin/categories/${level2Category.id}/available-filters`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('\nAvailable filters response structure:', Object.keys(availableFilters.data));
    console.log('Available filters data structure:', Object.keys(availableFilters.data.data));
    console.log('\nFirst 3 available filters:');
    
    const filters = availableFilters.data.data.availableFilters;
    filters.slice(0, 3).forEach((filter, index) => {
      console.log(`${index + 1}. Filter:`, {
        id: filter._id || filter.id,
        name: filter.name,
        displayName: filter.displayName,
        type: filter.type
      });
    });
    
    // Test with the first filter
    if (filters.length > 0) {
      const testFilter = filters[0];
      const filterId = testFilter._id || testFilter.id;
      
      console.log(`\n🧪 Testing assignment with filter ID: ${filterId}`);
      
      try {
        const assignment = await axios.post(`http://localhost:5001/api/admin/categories/${level2Category.id}/filters`, {
          filterId: filterId,
          isRequired: false,
          sortOrder: 0
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Assignment successful:', assignment.data);
      } catch (assignErr) {
        console.log('❌ Assignment failed:', assignErr.response?.data || assignErr.message);
        
        // Let's also check if the filter exists in the filters endpoint
        const allFilters = await axios.get('http://localhost:5001/api/admin/filters', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const filterList = allFilters.data.data.filters || allFilters.data.data || allFilters.data;
        const foundFilter = filterList.find(f => (f._id || f.id) === filterId);
        
        console.log('Filter exists in main filters list:', !!foundFilter);
        if (foundFilter) {
          console.log('Found filter details:', {
            id: foundFilter._id || foundFilter.id,
            name: foundFilter.name,
            displayName: foundFilter.displayName
          });
        }
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
}

debugAvailableFilters();