const axios = require('axios');

// Test the exact same API calls that ProductForm makes
async function debugProductFormFilters() {
  try {
    console.log('🔍 Debugging ProductForm filter fetching...');
    
    // Step 1: Login to get token
    console.log('\n1. Logging in...');
    const loginResponse = await axios.post('http://localhost:5002/api/auth/admin/login', {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.data.accessToken;
    const headers = { 'Authorization': `Bearer ${token}` };
    console.log('✅ Login successful');
    
    // Step 2: Fetch categories (same as ProductForm)
    console.log('\n2. Fetching categories...');
    const categoriesResponse = await axios.get('http://localhost:5002/api/admin/categories', { headers });
    
    console.log('Categories response structure:', {
      success: categoriesResponse.data.success,
      dataKeys: Object.keys(categoriesResponse.data.data || {}),
      hasCategories: !!categoriesResponse.data.data?.categories
    });
    
    // Handle different response formats (same logic as ProductForm)
    let allCategories = [];
    if (categoriesResponse.data && categoriesResponse.data.success && categoriesResponse.data.data && Array.isArray(categoriesResponse.data.data.categories)) {
      allCategories = categoriesResponse.data.data.categories;
      console.log('✅ Using categoriesResponse.data.data.categories');
    } else if (categoriesResponse.data && categoriesResponse.data.success && Array.isArray(categoriesResponse.data.data)) {
      allCategories = categoriesResponse.data.data;
      console.log('✅ Using categoriesResponse.data.data');
    } else if (Array.isArray(categoriesResponse.data)) {
      allCategories = categoriesResponse.data;
      console.log('✅ Using categoriesResponse.data');
    } else {
      console.warn('❌ Unexpected categories response format:', categoriesResponse.data);
      allCategories = [];
    }
    
    console.log(`Found ${allCategories.length} categories`);
    
    // Step 3: Find T-Shirts category
    const tshirtsCategory = allCategories.find(cat => cat.name === 'T-Shirts');
    if (!tshirtsCategory) {
      console.log('❌ T-Shirts category not found!');
      console.log('Available categories:', allCategories.map(cat => `${cat.name} (${cat._id})`));
      return;
    }
    
    console.log('\n3. Found T-Shirts category:');
    console.log('Full category object:', JSON.stringify(tshirtsCategory, null, 2));
    console.log('Category keys:', Object.keys(tshirtsCategory));
    console.log('ID fields:', {
      _id: tshirtsCategory._id,
      id: tshirtsCategory.id
    });
    
    // Step 4: Test filter fetching (exact same call as ProductForm)
    console.log('\n4. Fetching filters for T-Shirts category...');
    const categoryId = tshirtsCategory.id || tshirtsCategory._id;
    console.log('Using categoryId:', categoryId);
    
    const filtersResponse = await axios.get(`http://localhost:5002/api/admin/categories/${categoryId}/filters`, { headers });
    
    console.log('\n📊 Filters Response Analysis:');
    console.log('Status:', filtersResponse.status);
    console.log('Response structure:', {
      success: filtersResponse.data?.success,
      dataKeys: Object.keys(filtersResponse.data?.data || {}),
      hasFilters: !!filtersResponse.data?.data?.filters,
      filtersCount: filtersResponse.data?.data?.filters?.length || 0
    });
    
    // Handle different response formats (same logic as ProductForm)
    let filters = [];
    if (filtersResponse.data && filtersResponse.data.success && filtersResponse.data.data && Array.isArray(filtersResponse.data.data.filters)) {
      filters = filtersResponse.data.data.filters;
      console.log('✅ Using filtersResponse.data.data.filters');
    } else if (filtersResponse.data && filtersResponse.data.success && Array.isArray(filtersResponse.data.data)) {
      filters = filtersResponse.data.data;
      console.log('✅ Using filtersResponse.data.data');
    } else if (Array.isArray(filtersResponse.data)) {
      filters = filtersResponse.data;
      console.log('✅ Using filtersResponse.data');
    } else {
      console.warn('❌ Unexpected filters response format:', filtersResponse.data);
      filters = [];
    }
    
    console.log(`\n📋 Found ${filters.length} filters:`);
    filters.forEach((filter, index) => {
      console.log(`${index + 1}. ${filter.filter?.displayName || filter.displayName} (${filter.filter?.name || filter.name})`);
      console.log(`   - Type: ${filter.filter?.type || filter.type}`);
      console.log(`   - Active: ${filter.filter?.isActive || filter.isActive}`);
      console.log(`   - Options: ${filter.filter?.options?.length || filter.options?.length || 0}`);
    });
    
    // Step 5: Test filter options fetching
    console.log('\n5. Fetching filter options...');
    try {
      const optionsResponse = await axios.get(`http://localhost:5002/api/admin/products/category/${categoryId}/available-filter-options`, { headers });
      console.log('Filter options response:', {
        success: optionsResponse.data?.success,
        dataKeys: Object.keys(optionsResponse.data?.data || {})
      });
    } catch (optionsError) {
      console.log('❌ Filter options error:', optionsError.response?.data || optionsError.message);
    }
    
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