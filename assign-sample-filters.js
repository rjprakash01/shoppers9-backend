const axios = require('axios');

async function assignSampleFilters() {
  try {
    console.log('🔍 Assigning sample filters to categories...');
    
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
    
    const level2Categories = categories.data.data.categories.filter(cat => cat.level === 2);
    const level3Categories = categories.data.data.categories.filter(cat => cat.level === 3);
    
    // Assign filters to Men's Clothing (Level 2)
    const mensClothing = level2Categories.find(cat => cat.name === 'Clothing' && cat.slug.includes('men'));
    if (mensClothing) {
      console.log(`\n🧥 Assigning filters to: ${mensClothing.name} (Level 2)`);
      
      const availableFilters = await axios.get(`http://localhost:5001/api/admin/categories/${mensClothing.id}/available-filters`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Assign relevant filters for men's clothing
      const relevantFilters = availableFilters.data.data.availableFilters.filter(f => 
        ['size', 'color', 'fit', 'fabric', 'pattern'].includes(f.name)
      ).slice(0, 5);
      
      for (let i = 0; i < relevantFilters.length; i++) {
        const filter = relevantFilters[i];
        try {
          await axios.post(`http://localhost:5001/api/admin/categories/${mensClothing.id}/filters`, {
            filterId: filter._id || filter.id,
            isRequired: i < 2, // Make first 2 required
            sortOrder: i
          }, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log(`  ✅ Assigned: ${filter.displayName}`);
        } catch (err) {
          if (!err.response?.data?.message?.includes('already assigned')) {
            console.log(`  ❌ Failed: ${filter.displayName} - ${err.response?.data?.message || err.message}`);
          }
        }
      }
    }
    
    // Assign filters to T-Shirts (Level 3)
    const tshirts = level3Categories.find(cat => cat.name === 'T-Shirts');
    if (tshirts) {
      console.log(`\n👕 Assigning filters to: ${tshirts.name} (Level 3)`);
      
      const availableFilters = await axios.get(`http://localhost:5001/api/admin/categories/${tshirts.id}/available-filters`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Assign relevant filters for t-shirts
      const relevantFilters = availableFilters.data.data.availableFilters.filter(f => 
        ['size', 'color', 'fit', 'sleeve_type', 'neck_collar_type'].includes(f.name)
      ).slice(0, 4);
      
      for (let i = 0; i < relevantFilters.length; i++) {
        const filter = relevantFilters[i];
        try {
          await axios.post(`http://localhost:5001/api/admin/categories/${tshirts.id}/filters`, {
            filterId: filter._id || filter.id,
            isRequired: i === 0, // Make size required
            sortOrder: i
          }, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log(`  ✅ Assigned: ${filter.displayName}`);
        } catch (err) {
          if (!err.response?.data?.message?.includes('already assigned')) {
            console.log(`  ❌ Failed: ${filter.displayName} - ${err.response?.data?.message || err.message}`);
          }
        }
      }
    }
    
    // Assign filters to Women's Footwear (Level 2)
    const womensFootwear = level2Categories.find(cat => cat.name === 'Footwear' && cat.slug.includes('women'));
    if (womensFootwear) {
      console.log(`\n👠 Assigning filters to: ${womensFootwear.name} (Level 2)`);
      
      const availableFilters = await axios.get(`http://localhost:5001/api/admin/categories/${womensFootwear.id}/available-filters`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Assign relevant filters for women's footwear
      const relevantFilters = availableFilters.data.data.availableFilters.filter(f => 
        ['shoe_size_women', 'color', 'shoe_type', 'material', 'sole_type'].includes(f.name)
      ).slice(0, 4);
      
      for (let i = 0; i < relevantFilters.length; i++) {
        const filter = relevantFilters[i];
        try {
          await axios.post(`http://localhost:5001/api/admin/categories/${womensFootwear.id}/filters`, {
            filterId: filter._id || filter.id,
            isRequired: i === 0, // Make shoe size required
            sortOrder: i
          }, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log(`  ✅ Assigned: ${filter.displayName}`);
        } catch (err) {
          if (!err.response?.data?.message?.includes('already assigned')) {
            console.log(`  ❌ Failed: ${filter.displayName} - ${err.response?.data?.message || err.message}`);
          }
        }
      }
    }
    
    console.log('\n🎉 Sample filter assignments completed!');
    
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
}

assignSampleFilters();