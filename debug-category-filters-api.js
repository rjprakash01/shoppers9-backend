const axios = require('axios');

// Debug the category filters API endpoint
async function debugCategoryFiltersAPI() {
  try {
    console.log('🔍 Debugging Category Filters API...');
    
    // Step 1: Login to get token
    console.log('\n1. Logging in...');
    const loginResponse = await axios.post('http://localhost:4000/api/auth/admin/login', {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.data.accessToken;
    const headers = { 'Authorization': `Bearer ${token}` };
    console.log('✅ Login successful');
    
    // Step 2: Get categories
    console.log('\n2. Fetching categories...');
    const categoriesResponse = await axios.get('http://localhost:4000/api/admin/categories/tree', { headers });
    
    let allCategories = [];
    function flattenCategories(cats, currentLevel = 1) {
      cats.forEach(cat => {
        // Add the category with its proper level
        const categoryWithLevel = {
          ...cat,
          level: cat.level || currentLevel,
          id: cat.id || cat._id
        };
        allCategories.push(categoryWithLevel);
        
        if (cat.children && cat.children.length > 0) {
          flattenCategories(cat.children, currentLevel + 1);
        }
      });
    }
    
    if (categoriesResponse.data && categoriesResponse.data.success && categoriesResponse.data.data && Array.isArray(categoriesResponse.data.data)) {
      flattenCategories(categoriesResponse.data.data);
    }
    
    console.log(`Found ${allCategories.length} categories`);
    
    // Show all categories and their levels
    console.log('\nAll categories:');
    allCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (Level ${cat.level}) - ID: ${cat.id}`);
    });
    
    // Show tree structure
    console.log('\nCategory Tree Structure:');
    console.log(JSON.stringify(categoriesResponse.data.data, null, 2));
    
    // Step 3: Find a level 2 or 3 category to test
    const testCategory = allCategories.find(cat => cat.level === 2 || cat.level === 3);
    if (!testCategory) {
      console.log('\n❌ No level 2 or 3 categories found!');
      console.log('Let\'s test with any available category...');
      
      const anyCategory = allCategories[0];
      if (!anyCategory) {
        console.log('❌ No categories found at all!');
        return;
      }
      
      console.log(`\n3. Testing with category: ${anyCategory.name} (Level ${anyCategory.level})`);
      console.log('Category ID:', anyCategory.id);
      
      // Test the filters endpoint anyway
      const categoryId = anyCategory.id;
      const filtersUrl = `http://localhost:4000/api/admin/categories/${categoryId}/filters`;
      console.log('URL:', filtersUrl);
      
      try {
        const filtersResponse = await axios.get(filtersUrl, { headers });
        console.log('✅ API Response (even for level 1):');
        console.log('Status:', filtersResponse.status);
        console.log('Response:', filtersResponse.data);
      } catch (filtersError) {
        console.log('❌ Expected error for level 1 category:', filtersError.response?.data?.message);
      }
      
      return;
    }
    
    console.log(`\n3. Testing with category: ${testCategory.name} (Level ${testCategory.level})`);
    console.log('Category ID:', testCategory.id);
    
    // Step 4: Test the filters endpoint
    console.log('\n4. Testing filters endpoint...');
    const categoryId = testCategory.id;
    const filtersUrl = `http://localhost:4000/api/admin/categories/${categoryId}/filters`;
    console.log('URL:', filtersUrl);
    
    try {
      const filtersResponse = await axios.get(filtersUrl, { headers });
      console.log('✅ Filters API Response:');
      console.log('Status:', filtersResponse.status);
      console.log('Success:', filtersResponse.data.success);
      console.log('Data structure:', {
        hasCategory: !!filtersResponse.data.data?.category,
        hasFilters: !!filtersResponse.data.data?.filters,
        filtersCount: filtersResponse.data.data?.filters?.length || 0,
        hasPagination: !!filtersResponse.data.data?.pagination
      });
      
      if (filtersResponse.data.data?.filters?.length > 0) {
        console.log('\n📋 Filter details:');
        filtersResponse.data.data.filters.forEach((categoryFilter, index) => {
          console.log(`${index + 1}. Filter:`, {
            id: categoryFilter.id || categoryFilter._id,
            filterName: categoryFilter.filter?.name,
            filterDisplayName: categoryFilter.filter?.displayName,
            filterType: categoryFilter.filter?.type,
            isRequired: categoryFilter.isRequired,
            isActive: categoryFilter.isActive,
            hasOptions: !!categoryFilter.filter?.options,
            optionsCount: categoryFilter.filter?.options?.length || 0
          });
          
          if (categoryFilter.filter?.options?.length > 0) {
            console.log('   Options:', categoryFilter.filter.options.map(opt => opt.displayValue || opt.value));
          }
        });
      } else {
        console.log('\n⚠️ No filters found for this category');
        
        // Let's check if there are any filters assigned to this category in the database
        console.log('\n5. Checking if filters exist in database...');
        
        // Check available filters
        const availableFiltersUrl = `http://localhost:4000/api/admin/categories/${categoryId}/available-filters`;
        try {
          const availableResponse = await axios.get(availableFiltersUrl, { headers });
          console.log('Available filters count:', availableResponse.data.data?.availableFilters?.length || 0);
          
          if (availableResponse.data.data?.availableFilters?.length > 0) {
            console.log('\n💡 Available filters that can be assigned:');
            availableResponse.data.data.availableFilters.slice(0, 5).forEach((filter, index) => {
              console.log(`${index + 1}. ${filter.displayName} (${filter.type})`);
            });
            
            // Let's assign a filter to test
            console.log('\n6. Assigning a test filter...');
            const testFilter = availableResponse.data.data.availableFilters[0];
            const assignUrl = `http://localhost:4000/api/admin/categories/${categoryId}/filters`;
            
            try {
              const assignResponse = await axios.post(assignUrl, {
                filterId: testFilter.id,
                isRequired: false,
                sortOrder: 0
              }, { headers });
              
              console.log('✅ Filter assigned successfully!');
              
              // Test the filters endpoint again
              console.log('\n7. Testing filters endpoint again...');
              const filtersResponse2 = await axios.get(filtersUrl, { headers });
              console.log('Filters count after assignment:', filtersResponse2.data.data?.filters?.length || 0);
              
            } catch (assignError) {
              console.log('❌ Error assigning filter:', assignError.response?.data || assignError.message);
            }
          }
        } catch (availableError) {
          console.log('❌ Error fetching available filters:', availableError.response?.data || availableError.message);
        }
      }
      
    } catch (filtersError) {
      console.log('❌ Error fetching filters:', filtersError.response?.data || filtersError.message);
    }
    
  } catch (error) {
    console.error('❌ Error in debug script:');
    console.error('Error message:', error.message);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Full error:', error);
  }
}

debugCategoryFiltersAPI();