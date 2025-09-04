const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:4000';
const LOGIN_URL = `${BASE_URL}/api/auth/login`;
const CATEGORIES_URL = `${BASE_URL}/api/admin/categories/tree`;
const FILTERS_URL = `${BASE_URL}/api/admin/filters`;

// Admin credentials
const adminCredentials = {
  email: 'admin@shoppers9.com',
  password: 'admin123'
};

// Level 3 category IDs from the debug output
const level3CategoryIds = [
  '68b7158ef34225e75042e07d', // T-Shirts
  '68b7158ef34225e75042e082', // Jeans
  '68b7158ef34225e75042e087', // Heels
  '68b7158ef34225e75042e08c', // Flats
  '68b7158ff34225e75042e091', // Chairs
  '68b7158ff34225e75042e096', // Tables
  '68b7158ff34225e75042e09b', // Cookware
  '68b7158ff34225e75042e0a0'  // Storage
];

async function assignFiltersToLevel3Categories() {
  let token;
  let headers;
  
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(LOGIN_URL, adminCredentials);
    
    if (loginResponse.data && loginResponse.data.success) {
      token = loginResponse.data.data?.accessToken;
      headers = { 'Authorization': `Bearer ${token}` };
      console.log('✅ Login successful');
    } else {
      console.error('❌ Login failed');
      return;
    }
    
    // Get all available filters
    console.log('\n📋 Fetching available filters...');
    const filtersResponse = await axios.get(FILTERS_URL, { headers });
    const filters = filtersResponse.data.data?.filters || filtersResponse.data.data || [];
    
    console.log(`Found ${filters.length} filters:`);
    filters.forEach(filter => {
      console.log(`  - ${filter.displayName || filter.name} (${filter.id || filter._id})`);
    });
    
    if (filters.length === 0) {
      console.log('❌ No filters found!');
      return;
    }
    
    // Assign filters to each level 3 category
    console.log('\n🔧 Assigning filters to level 3 categories...');
    
    for (const categoryId of level3CategoryIds) {
      console.log(`\n📁 Processing category: ${categoryId}`);
      
      // Get category name first
      try {
        const categoryResponse = await axios.get(`${BASE_URL}/api/admin/categories/${categoryId}`, { headers });
        const categoryName = categoryResponse.data.data?.name || 'Unknown';
        console.log(`  Category name: ${categoryName}`);
        
        // Assign first 3-5 filters to this category
        const filtersToAssign = filters.slice(0, Math.min(5, filters.length));
        
        for (let i = 0; i < filtersToAssign.length; i++) {
          const filter = filtersToAssign[i];
          const filterId = filter.id || filter._id;
          
          try {
            const assignResponse = await axios.post(
              `${BASE_URL}/api/admin/categories/${categoryId}/filters`,
              {
                filterId: filterId,
                isRequired: i === 0, // Make first filter required
                sortOrder: i
              },
              { headers }
            );
            
            if (assignResponse.data.success) {
              console.log(`    ✅ Assigned filter: ${filter.displayName || filter.name}`);
            } else {
              console.log(`    ❌ Failed to assign filter: ${filter.displayName || filter.name} - ${assignResponse.data.message}`);
            }
          } catch (assignError) {
            const errorMsg = assignError.response?.data?.message || assignError.message;
            if (errorMsg.includes('already assigned')) {
              console.log(`    ⚠️  Filter already assigned: ${filter.displayName || filter.name}`);
            } else {
              console.log(`    ❌ Error assigning filter: ${filter.displayName || filter.name} - ${errorMsg}`);
            }
          }
        }
      } catch (categoryError) {
        console.log(`  ❌ Error processing category ${categoryId}:`, categoryError.response?.data?.message || categoryError.message);
      }
    }
    
    console.log('\n🎉 Filter assignment completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

assignFiltersToLevel3Categories();