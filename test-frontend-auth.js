const axios = require('axios');

async function testFrontendAuth() {
  try {
    console.log('🔐 Testing frontend authentication flow...');
    
    // Step 1: Login
    console.log('\n1. Attempting login...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/admin/login', {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    console.log('Token preview:', token.substring(0, 20) + '...');
    
    // Step 2: Test filters API with authentication
    console.log('\n2. Testing filters API with auth...');
    const filtersResponse = await axios.get('http://localhost:5001/api/admin/filters', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n📊 Filters API Response:');
    console.log('Status:', filtersResponse.status);
    console.log('Success:', filtersResponse.data.success);
    console.log('Response structure:', Object.keys(filtersResponse.data));
    
    if (filtersResponse.data.data) {
      console.log('Data structure:', Object.keys(filtersResponse.data.data));
      console.log('Total filters:', filtersResponse.data.data.pagination?.total || 0);
      console.log('Filters returned:', filtersResponse.data.data.filters?.length || 0);
      
      if (filtersResponse.data.data.filters?.length > 0) {
        console.log('\n📋 Sample filters:');
        filtersResponse.data.data.filters.slice(0, 3).forEach((filter, index) => {
          console.log(`${index + 1}. ${filter.name} (${filter.displayName}) - Active: ${filter.isActive}`);
        });
      }
    }
    
    // Step 3: Test categories API
    console.log('\n3. Testing categories tree API...');
    const categoriesResponse = await axios.get('http://localhost:5001/api/admin/categories/tree', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n📊 Categories API Response:');
    console.log('Status:', categoriesResponse.status);
    console.log('Success:', categoriesResponse.data.success);
    console.log('Response structure:', Object.keys(categoriesResponse.data));
    
    if (categoriesResponse.data.data) {
      console.log('Data structure:', Object.keys(categoriesResponse.data.data));
      if (categoriesResponse.data.data.categories) {
        console.log('Categories count:', categoriesResponse.data.data.categories.length);
        
        // Count level 3 categories
        const level3Categories = [];
        function countLevel3(categories, level = 1) {
          categories.forEach(cat => {
            if (level === 3) {
              level3Categories.push(cat);
            }
            if (cat.children && cat.children.length > 0) {
              countLevel3(cat.children, level + 1);
            }
          });
        }
        
        countLevel3(categoriesResponse.data.data.categories);
        console.log('Level 3 categories found:', level3Categories.length);
        
        if (level3Categories.length > 0) {
          console.log('\n📋 Sample level 3 categories:');
          level3Categories.slice(0, 3).forEach((cat, index) => {
            console.log(`${index + 1}. ${cat.name} (${cat.displayName})`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testFrontendAuth();