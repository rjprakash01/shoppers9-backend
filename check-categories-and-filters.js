const axios = require('axios');

async function checkData() {
  try {
    console.log('🔍 Checking categories and filters...');
    
    // Login
    const login = await axios.post('http://localhost:5001/api/auth/admin/login', {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    const token = login.data.data.accessToken;
    console.log('✅ Login successful');
    
    // Get categories
    const categories = await axios.get('http://localhost:5001/api/admin/categories?limit=100', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('\n=== CATEGORIES BY LEVEL ===');
    const categoriesByLevel = {};
    categories.data.data.categories.forEach(cat => {
      if (!categoriesByLevel[cat.level]) categoriesByLevel[cat.level] = [];
      categoriesByLevel[cat.level].push({
        name: cat.name,
        displayName: cat.name, // Use name field as displayName
        id: cat.id
      });
    });
    
    Object.keys(categoriesByLevel).forEach(level => {
      console.log(`Level ${level}: ${categoriesByLevel[level].length} categories`);
      if (level === '3') {
        console.log('Level 3 categories:');
        categoriesByLevel[level].slice(0, 5).forEach(cat => {
          console.log(`  - ${cat.displayName} (${cat.id})`);
        });
      }
    });
    
    // Get filters
    const filters = await axios.get('http://localhost:5001/api/admin/filters', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('\n=== FILTERS ===');
    const filterList = filters.data.data?.filters || filters.data.data || filters.data;
    console.log('Total filters:', filterList?.length || 0);
    
    if (filterList?.length > 0) {
      console.log('Sample filters:');
      filterList.slice(0, 5).forEach(f => {
        console.log(`  - ${f.displayName} (${f.name}) - Type: ${f.type}`);
      });
    } else {
      console.log('❌ No filters found!');
      console.log('Debug - filters response structure:', Object.keys(filters.data));
    }
    
    // Check if there are any category-filter assignments
    if (categoriesByLevel['3'] && categoriesByLevel['3'].length > 0) {
      const sampleCategory = categoriesByLevel['3'][0];
      console.log(`\n=== CHECKING FILTERS FOR SAMPLE LEVEL 3 CATEGORY ===`);
      console.log(`Category: ${sampleCategory.displayName}`);
      
      try {
        const categoryFilters = await axios.get(`http://localhost:5001/api/admin/categories/${sampleCategory.id}/filters`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const assignedCount = categoryFilters.data.data?.categoryFilters?.length || categoryFilters.data.data?.length || 0;
        console.log('Assigned filters:', assignedCount);
        
        if (assignedCount > 0) {
          console.log('Sample assigned filters:');
          const filterList = categoryFilters.data.data?.categoryFilters || categoryFilters.data.data || [];
          filterList.slice(0, 3).forEach(cf => {
            const filter = cf.filter || cf;
            console.log(`  - ${filter.displayName || filter.name} (Required: ${cf.isRequired || false})`);
          });
        }
      } catch (err) {
        console.log('Error checking category filters:', err.response?.data?.message || err.message);
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
}

checkData();