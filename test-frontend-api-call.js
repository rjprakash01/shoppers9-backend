// Test the exact API call that frontend makes
const axios = require('axios');

async function testFrontendAPICall() {
  try {
    console.log('🔍 Testing exact frontend API call with authentication...');
    
    // Step 1: Login to get token
    console.log('\n1. Logging in as super admin...');
    const loginResponse = await axios.post('http://localhost:4000/api/auth/admin/login', {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    
    // Set up headers for authenticated requests
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Get categories
    console.log('\n2. Fetching categories...');
    const categoriesResponse = await axios.get('http://localhost:4000/api/admin/categories', { headers });
    
    let categories = [];
    if (categoriesResponse.data?.success && categoriesResponse.data?.data?.categories) {
      categories = categoriesResponse.data.data.categories;
    } else if (categoriesResponse.data?.categories) {
      categories = categoriesResponse.data.categories;
    }
    
    console.log(`✅ Found ${categories.length} categories`);
    
    // Find a level 2 category (like "Clothing")
    const level2Category = categories.find(cat => cat.level === 2 && cat.name.toLowerCase().includes('clothing'));
    
    if (!level2Category) {
      console.log('❌ No level 2 "Clothing" category found');
      // Try any level 2 category
      const anyLevel2 = categories.find(cat => cat.level === 2);
      if (anyLevel2) {
        console.log(`Using alternative level 2 category: ${anyLevel2.name}`);
        testCategory = anyLevel2;
      } else {
        console.log('❌ No level 2 categories found at all');
        return;
      }
    } else {
      testCategory = level2Category;
    }
    
    console.log(`\n3. Testing category: ${testCategory.name} (Level ${testCategory.level})`);
    const categoryId = testCategory._id || testCategory.id;
    console.log(`Category ID: ${categoryId}`);
    
    // Step 3: Make the exact API call that frontend makes
    console.log(`\n4. Making authenticated API call: GET /api/admin/categories/${categoryId}/filters`);
    const filtersResponse = await axios.get(`http://localhost:4000/api/admin/categories/${categoryId}/filters`, { headers });
    
    console.log('\n5. Response Analysis:');
    console.log('Status:', filtersResponse.status);
    console.log('Response keys:', Object.keys(filtersResponse.data));
    
    if (filtersResponse.data.success) {
      console.log('✅ Success: true');
      console.log('Data keys:', Object.keys(filtersResponse.data.data || {}));
      
      if (filtersResponse.data.data && filtersResponse.data.data.filters) {
        const filters = filtersResponse.data.data.filters;
        console.log(`✅ Found ${filters.length} filters`);
        
        filters.forEach((categoryFilter, index) => {
          const filter = categoryFilter.filter;
          console.log(`\n  Filter ${index + 1}: ${filter.name}`);
          console.log(`    - Display Name: ${filter.displayName}`);
          console.log(`    - Type: ${filter.type}`);
          console.log(`    - Options Count: ${filter.options?.length || 0}`);
          
          if (filter.options && filter.options.length > 0) {
            console.log(`    - First 3 options: ${filter.options.slice(0, 3).map(opt => opt.displayValue).join(', ')}`);
          }
        });
        
        // Step 4: Test the frontend's processing logic
        console.log('\n6. Frontend Processing Simulation:');
        console.log('Frontend would check:');
        console.log('- response.success:', !!filtersResponse.data.success);
        console.log('- response.data:', !!filtersResponse.data.data);
        console.log('- Array.isArray(response.data.filters):', Array.isArray(filtersResponse.data.data.filters));
        
        if (filtersResponse.data.success && filtersResponse.data.data && Array.isArray(filtersResponse.data.data.filters)) {
          console.log('✅ Frontend would successfully process these filters');
        } else {
          console.log('❌ Frontend would fail to process filters');
        }
        
      } else {
        console.log('❌ No filters array found in response.data');
      }
    } else {
      console.log('❌ Success: false');
      console.log('Message:', filtersResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testFrontendAPICall();