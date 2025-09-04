const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function debugProductFormFilters() {
  try {
    console.log('🔍 Debugging ProductForm Filter Options Issue...');
    
    // Step 1: Login
    console.log('\n1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.token || loginResponse.data.data?.token || loginResponse.data.data?.accessToken;
    if (!token) {
      console.log('❌ No token received in login response');
      console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful, token received');
    
    // Step 2: Get categories to find a level 3 category
    console.log('\n2. Getting categories...');
    const categoriesResponse = await axios.get(`${BASE_URL}/api/admin/categories`, { headers });
    const categories = categoriesResponse.data.data.categories;
    
    // Find a level 3 category (T-Shirts)
    const level3Category = categories.find(cat => cat.level === 3 && cat.name === 'T-Shirts');
    if (!level3Category) {
      console.log('❌ No T-Shirts category found');
      console.log('Available level 3 categories:');
      categories.filter(cat => cat.level === 3).forEach(cat => {
        console.log(`  - ${cat.name} (${cat._id || cat.id})`);
      });
      return;
    }
    
    const categoryId = level3Category._id || level3Category.id;
    console.log(`✅ Found level 3 category: ${level3Category.name} (${categoryId})`);
    
    // Step 3: Test the exact API call that ProductForm makes
    console.log('\n3. Testing ProductForm API call...');
    console.log(`📡 GET ${BASE_URL}/api/admin/categories/${categoryId}/filters`);
    
    const filtersResponse = await axios.get(
      `${BASE_URL}/api/admin/categories/${categoryId}/filters`,
      { headers }
    );
    
    console.log('✅ API Response received');
    console.log('📊 Response structure:', {
      success: filtersResponse.data.success,
      hasData: !!filtersResponse.data.data,
      hasFilters: !!filtersResponse.data.data?.filters,
      filtersCount: filtersResponse.data.data?.filters?.length || 0
    });
    
    // Step 4: Analyze the response structure in detail
    console.log('\n4. Analyzing response structure...');
    const responseData = filtersResponse.data;
    
    if (responseData.data && responseData.data.filters) {
      console.log(`📊 Found ${responseData.data.filters.length} filters`);
      
      responseData.data.filters.forEach((categoryFilter, index) => {
        console.log(`\n📋 Filter ${index + 1}:`);
        console.log(`  - CategoryFilter ID: ${categoryFilter._id}`);
        console.log(`  - Is Required: ${categoryFilter.isRequired}`);
        console.log(`  - Is Active: ${categoryFilter.isActive}`);
        
        if (categoryFilter.filter) {
          const filter = categoryFilter.filter;
          console.log(`  - Filter Name: ${filter.name}`);
          console.log(`  - Filter Display Name: ${filter.displayName}`);
          console.log(`  - Filter Type: ${filter.type}`);
          console.log(`  - Filter Data Type: ${filter.dataType}`);
          console.log(`  - Has Options: ${!!filter.options}`);
          
          if (filter.options) {
            console.log(`  - Options Count: ${filter.options.length}`);
            console.log(`  - First 3 Options:`);
            filter.options.slice(0, 3).forEach((option, optIndex) => {
              console.log(`    ${optIndex + 1}. ${option.displayValue} (ID: ${option._id})`);
              console.log(`       Raw option:`, JSON.stringify(option, null, 4));
            });
            if (filter.options.length > 3) {
              console.log(`    ... and ${filter.options.length - 3} more`);
            }
          } else {
            console.log(`  - ❌ NO OPTIONS FOUND!`);
          }
        } else {
          console.log(`  - ❌ NO FILTER OBJECT FOUND!`);
        }
      });
    } else {
      console.log('❌ No filters found in response');
    }
    
    // Step 5: Test the ProductForm logic simulation
    console.log('\n5. Simulating ProductForm logic...');
    
    let filters = [];
    if (responseData && responseData.data && responseData.data.filters) {
      filters = responseData.data.filters;
      console.log('✅ ProductForm: Using response.data.filters format');
    } else if (responseData && responseData.data && Array.isArray(responseData.data)) {
      filters = responseData.data;
      console.log('✅ ProductForm: Using response.data format (direct array)');
    } else if (responseData && Array.isArray(responseData)) {
      filters = responseData;
      console.log('✅ ProductForm: Using direct response format');
    } else {
      console.warn('❌ ProductForm: Unexpected filters response format:', responseData);
      filters = [];
    }
    
    console.log(`🔍 ProductForm: Processed filters count: ${filters.length}`);
    
    // Step 6: Check if filters have options
    console.log('\n6. Checking filter options availability...');
    filters.forEach((categoryFilter, index) => {
      if (categoryFilter && categoryFilter.filter) {
        const filter = categoryFilter.filter;
        const hasOptions = filter.options && filter.options.length > 0;
        console.log(`📋 Filter ${index + 1} (${filter.displayName}): ${hasOptions ? '✅ HAS OPTIONS' : '❌ NO OPTIONS'} (${filter.options?.length || 0} options)`);
        
        if (hasOptions) {
          console.log(`   First option: ${filter.options[0].displayValue}`);
        }
      } else {
        console.log(`📋 Filter ${index + 1}: ❌ INVALID STRUCTURE`);
      }
    });
    
    console.log('\n🎉 Debug completed!');
    
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

debugProductFormFilters();