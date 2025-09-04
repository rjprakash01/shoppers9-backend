const axios = require('axios');

// Simulate the exact frontend flow
async function testFrontendFiltersFlow() {
  try {
    console.log('🔍 Testing Frontend Filters Flow...');
    
    // Step 1: Login (simulating frontend login)
    console.log('\n1. Logging in as super admin...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/admin/login', {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    
    // Step 2: Set up axios with token (simulating authService)
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 3: Fetch filters (exactly like frontend)
    console.log('\n2. Fetching filters with limit=100...');
    const filtersResponse = await axios.get('http://localhost:5001/api/admin/filters?limit=100', { headers });
    
    console.log('✅ Filters API Response:');
    console.log('- Status:', filtersResponse.status);
    console.log('- Success:', filtersResponse.data.success);
    console.log('- Response structure:', Object.keys(filtersResponse.data));
    console.log('- Data structure:', Object.keys(filtersResponse.data.data || {}));
    console.log('- Filters count:', filtersResponse.data.data?.filters?.length || 0);
    
    // Step 4: Process filters like frontend does
    let filterData = [];
    if (filtersResponse.data?.success && filtersResponse.data?.data?.filters && Array.isArray(filtersResponse.data.data.filters)) {
      filterData = filtersResponse.data.data.filters;
      console.log('✅ Using filtersResponse.data.data.filters');
    } else {
      console.log('❌ Unexpected filter response structure');
    }
    
    console.log('\n3. Processing filters...');
    console.log('- Raw filter data length:', filterData.length);
    
    // Map filter data like frontend does
    const mappedFilters = filterData.map((filter) => ({
      ...filter,
      _id: filter.id || filter._id // Handle both id and _id formats
    }));
    
    console.log('- Mapped filters length:', mappedFilters.length);
    console.log('- Active filters:', mappedFilters.filter(f => f.isActive).length);
    
    if (mappedFilters.length > 0) {
      console.log('\n4. Sample filters:');
      mappedFilters.slice(0, 3).forEach((filter, index) => {
        console.log(`${index + 1}. ${filter.displayName} (${filter.type}) - Active: ${filter.isActive} - ID: ${filter._id}`);
      });
    }
    
    // Step 5: Test categories too
    console.log('\n5. Testing categories...');
    const categoriesResponse = await axios.get('http://localhost:5001/api/admin/categories/tree', { headers });
    console.log('- Categories success:', categoriesResponse.data.success);
    console.log('- Categories count:', categoriesResponse.data.data?.length || 0);
    
    console.log('\n✅ Frontend flow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in frontend flow test:', error.response?.data || error.message);
  }
}

testFrontendFiltersFlow();