const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testProductFormFilterOptions() {
  try {
    console.log('🔍 Testing ProductForm Filter Options Issue...');
    
    // First, login to get token
    console.log('\n1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Get categories to find level 2 and 3 categories
    console.log('\n2. Getting categories...');
    const categoriesResponse = await axios.get(`${BASE_URL}/api/admin/categories?limit=100`, { headers });
    console.log('✅ Categories response received');
    
    if (categoriesResponse.data.success && categoriesResponse.data.data.categories.length > 0) {
      const categories = categoriesResponse.data.data.categories;
      
      // Find level 2 and 3 categories
      const level2Categories = categories.filter(cat => cat.level === 2);
      const level3Categories = categories.filter(cat => cat.level === 3);
      
      console.log(`\n📊 Found ${level2Categories.length} level 2 categories and ${level3Categories.length} level 3 categories`);
      
      // Test with a level 3 category first
      if (level3Categories.length > 0) {
        const testCategory = level3Categories[0];
        const categoryId = testCategory._id || testCategory.id;
        console.log(`\n3. Testing with Level 3 category: ${testCategory.name} (${categoryId})`);
        
        // Test category filters endpoint
        console.log('\n3a. Testing category filters endpoint');
        try {
          const categoryFiltersResponse = await axios.get(`${BASE_URL}/api/admin/categories/${categoryId}/filters`, { headers });
          console.log('✅ Category filters success:', {
            success: categoryFiltersResponse.data.success,
            filtersCount: categoryFiltersResponse.data.data?.filters?.length || 0
          });
          
          if (categoryFiltersResponse.data.data?.filters?.length > 0) {
            const firstFilter = categoryFiltersResponse.data.data.filters[0];
            console.log('📊 First filter:', {
              name: firstFilter.filter?.name,
              displayName: firstFilter.filter?.displayName,
              optionsCount: firstFilter.filter?.options?.length || 0
            });
          }
        } catch (error) {
          console.log('❌ Category filters failed:', error.response?.data || error.message);
        }
        
        // Test available filter options endpoint (the one ProductForm uses)
         console.log('\n3b. Testing available filter options endpoint (ProductForm endpoint)');
         try {
           const availableOptionsResponse = await axios.get(`${BASE_URL}/api/admin/products/category/${categoryId}/available-filter-options`, { headers });
          console.log('✅ Available filter options success:', {
            success: availableOptionsResponse.data.success,
            filtersCount: availableOptionsResponse.data.data?.length || 0
          });
          
          if (availableOptionsResponse.data.data?.length > 0) {
            availableOptionsResponse.data.data.forEach((categoryFilter, index) => {
              console.log(`📊 Filter ${index + 1}:`, {
                name: categoryFilter.filter?.name,
                displayName: categoryFilter.filter?.displayName,
                optionsCount: categoryFilter.filter?.options?.length || 0,
                isRequired: categoryFilter.isRequired
              });
              
              // Show first few options
              if (categoryFilter.filter?.options?.length > 0) {
                console.log('   Options:', categoryFilter.filter.options.slice(0, 3).map(opt => opt.displayValue));
                if (categoryFilter.filter.options.length > 3) {
                  console.log(`   ... and ${categoryFilter.filter.options.length - 3} more`);
                }
              }
            });
          } else {
            console.log('❌ No filter options found for this category');
          }
        } catch (error) {
          console.log('❌ Available filter options failed:', error.response?.data || error.message);
        }
      }
      
      // Also test with a level 2 category
       if (level2Categories.length > 0) {
         const testCategory = level2Categories[0];
         const categoryId = testCategory._id || testCategory.id;
         console.log(`\n4. Testing with Level 2 category: ${testCategory.name} (${categoryId})`);
         
         try {
           const availableOptionsResponse = await axios.get(`${BASE_URL}/api/admin/products/category/${categoryId}/available-filter-options`, { headers });
          console.log('✅ Level 2 available filter options:', {
            success: availableOptionsResponse.data.success,
            filtersCount: availableOptionsResponse.data.data?.length || 0
          });
          
          if (availableOptionsResponse.data.data?.length > 0) {
            availableOptionsResponse.data.data.forEach((categoryFilter, index) => {
              console.log(`📊 Filter ${index + 1}:`, {
                name: categoryFilter.filter?.name,
                displayName: categoryFilter.filter?.displayName,
                optionsCount: categoryFilter.filter?.options?.length || 0
              });
            });
          }
        } catch (error) {
          console.log('❌ Level 2 available filter options failed:', error.response?.data || error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testProductFormFilterOptions();