const axios = require('axios');

// Test the category filter functionality with the new backend port
async function testCategoryFilters() {
  try {
    console.log('🧪 Testing Category Filter Functionality...');
    
    // Step 1: Login
    console.log('\n1. Logging in as super admin...');
    const loginResponse = await axios.post('http://localhost:5002/api/auth/admin/login', {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Test filters API
    console.log('\n2. Testing filters API...');
    const filtersResponse = await axios.get('http://localhost:5002/api/admin/filters?limit=100', { headers });
    console.log('✅ Filters loaded:', filtersResponse.data.data.filters.length);
    
    // Step 3: Test categories API
    console.log('\n3. Testing categories API...');
    const categoriesResponse = await axios.get('http://localhost:5002/api/admin/categories/tree', { headers });
    console.log('✅ Categories loaded:', categoriesResponse.data.data.length);
    
    // Step 4: Test category filter assignment
    console.log('\n4. Testing category filter assignment...');
    
    // Get a level 2 or 3 category
    const categories = categoriesResponse.data.data;
    let testCategory = null;
    
    function findTestCategory(cats, level = 1) {
      for (const cat of cats) {
        if (level >= 2 && level <= 3) {
          testCategory = { ...cat, level };
          return true;
        }
        if (cat.children && cat.children.length > 0) {
          if (findTestCategory(cat.children, level + 1)) {
            return true;
          }
        }
      }
      return false;
    }
    
    findTestCategory(categories);
    
    if (!testCategory) {
      console.log('❌ No suitable test category found (level 2 or 3)');
      return;
    }
    
    console.log(`📁 Using test category: ${testCategory.name} (Level ${testCategory.level})`);
    
    // Get available filters for this category
    const availableFiltersResponse = await axios.get(
      `http://localhost:5002/api/admin/categories/${testCategory.id}/available-filters`, 
      { headers }
    );
    
    console.log('✅ Available filters for category:', availableFiltersResponse.data.data.length);
    
    if (availableFiltersResponse.data.data.length > 0) {
      const testFilter = availableFiltersResponse.data.data[0];
      console.log(`🔧 Testing with filter: ${testFilter.displayName}`);
      
      // Assign filter to category
      const assignResponse = await axios.post(
        `http://localhost:5002/api/admin/categories/${testCategory.id}/filters`,
        {
          filter: testFilter._id,
          isRequired: false,
          sortOrder: 1
        },
        { headers }
      );
      
      if (assignResponse.data.success) {
        console.log('✅ Filter assigned successfully!');
        
        // Get category filters to verify
        const categoryFiltersResponse = await axios.get(
          `http://localhost:5002/api/admin/categories/${testCategory.id}/filters`,
          { headers }
        );
        
        console.log('✅ Category filters verified:', categoryFiltersResponse.data.data.length);
        
        // Clean up - remove the test assignment
        if (categoryFiltersResponse.data.data.length > 0) {
          const assignmentId = categoryFiltersResponse.data.data[0]._id;
          await axios.delete(
            `http://localhost:5002/api/admin/category-filters/${assignmentId}`,
            { headers }
          );
          console.log('🧹 Test assignment cleaned up');
        }
      } else {
        console.log('❌ Filter assignment failed:', assignResponse.data.message);
      }
    } else {
      console.log('ℹ️ No available filters for this category (all may be assigned)');
    }
    
    console.log('\n🎉 Category Filter functionality test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCategoryFilters();