const axios = require('axios');

async function testFilterAssignment() {
  try {
    console.log('🔍 Testing filter assignment to categories...');
    
    // Login
    const login = await axios.post('http://localhost:5001/api/auth/admin/login', {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    const token = login.data.data.accessToken;
    console.log('✅ Login successful');
    
    // Get level 2 and 3 categories
    const categories = await axios.get('http://localhost:5001/api/admin/categories?limit=100', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const level2Categories = categories.data.data.categories.filter(cat => cat.level === 2);
    const level3Categories = categories.data.data.categories.filter(cat => cat.level === 3);
    
    console.log(`\nFound ${level2Categories.length} level 2 categories and ${level3Categories.length} level 3 categories`);
    
    // Get available filters
    const filters = await axios.get('http://localhost:5001/api/admin/filters', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const filterList = filters.data.data.filters || filters.data.data || filters.data;
    console.log(`Found ${filterList.length} filters`);
    
    if (level2Categories.length > 0 && filterList.length > 0) {
      // Test assigning filters to a level 2 category (Men's Clothing)
      const testCategory = level2Categories.find(cat => cat.name === 'Clothing') || level2Categories[0];
      console.log(`\n🧪 Testing filter assignment to: ${testCategory.name} (Level ${testCategory.level})`);
      
      // Get available filters for this category
      try {
        const availableFilters = await axios.get(`http://localhost:5001/api/admin/categories/${testCategory.id}/available-filters`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`Available filters for ${testCategory.name}:`, availableFilters.data.data.availableFilters.length);
        
        if (availableFilters.data.data.availableFilters.length > 0) {
          // Assign first 3 filters to this category
          const filtersToAssign = availableFilters.data.data.availableFilters.slice(0, 3);
          
          for (let i = 0; i < filtersToAssign.length; i++) {
            const filter = filtersToAssign[i];
            console.log(`\nAssigning filter: ${filter.displayName} to ${testCategory.name}`);
            
            try {
              const assignment = await axios.post(`http://localhost:5001/api/admin/categories/${testCategory.id}/filters`, {
                filterId: filter._id,
                isRequired: i === 0, // Make first filter required
                sortOrder: i
              }, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              console.log(`✅ Successfully assigned ${filter.displayName}`);
            } catch (assignErr) {
              console.log(`❌ Failed to assign ${filter.displayName}:`, assignErr.response?.data?.message || assignErr.message);
            }
          }
          
          // Check assigned filters
          const assignedFilters = await axios.get(`http://localhost:5001/api/admin/categories/${testCategory.id}/filters`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log(`\n✅ ${testCategory.name} now has ${assignedFilters.data.data.categoryFilters.length} assigned filters`);
        }
      } catch (err) {
        console.log('❌ Error getting available filters:', err.response?.data?.message || err.message);
      }
    }
    
    // Test with a level 3 category too
    if (level3Categories.length > 0 && filterList.length > 0) {
      const testCategory = level3Categories.find(cat => cat.name === 'T-Shirts') || level3Categories[0];
      console.log(`\n🧪 Testing filter assignment to: ${testCategory.name} (Level ${testCategory.level})`);
      
      try {
        const availableFilters = await axios.get(`http://localhost:5001/api/admin/categories/${testCategory.id}/available-filters`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`Available filters for ${testCategory.name}:`, availableFilters.data.data.availableFilters.length);
        
        if (availableFilters.data.data.availableFilters.length > 0) {
          // Assign 2 filters to this category
          const filtersToAssign = availableFilters.data.data.availableFilters.slice(0, 2);
          
          for (let i = 0; i < filtersToAssign.length; i++) {
            const filter = filtersToAssign[i];
            console.log(`\nAssigning filter: ${filter.displayName} to ${testCategory.name}`);
            
            try {
              const assignment = await axios.post(`http://localhost:5001/api/admin/categories/${testCategory.id}/filters`, {
                filterId: filter._id,
                isRequired: false,
                sortOrder: i
              }, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              console.log(`✅ Successfully assigned ${filter.displayName}`);
            } catch (assignErr) {
              console.log(`❌ Failed to assign ${filter.displayName}:`, assignErr.response?.data?.message || assignErr.message);
            }
          }
          
          // Check assigned filters
          const assignedFilters = await axios.get(`http://localhost:5001/api/admin/categories/${testCategory.id}/filters`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log(`\n✅ ${testCategory.name} now has ${assignedFilters.data.data.categoryFilters.length} assigned filters`);
        }
      } catch (err) {
        console.log('❌ Error with level 3 category:', err.response?.data?.message || err.message);
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
}

testFilterAssignment();