const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function debugFilterIssue() {
  try {
    console.log('🔍 Debugging Filter Issue...');
    
    // Set base URL for axios
    axios.defaults.baseURL = API_BASE_URL;
    
    // Step 1: Login
    console.log('\n1. Logging in...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/admin/login', {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.data.accessToken;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // Step 2: Fetch categories
    console.log('\n2. Fetching categories...');
    const categoriesResponse = await axios.get('http://localhost:5001/api/admin/categories', { headers });
    
    console.log('Categories response:', {
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
    
    // Step 3: Find a level 3 category (T-Shirts)
    const findCategoryByName = (cats, name) => {
      for (const cat of cats) {
        if (cat.name === name) return cat;
        if (cat.children) {
          const found = findCategoryByName(cat.children, name);
          if (found) return found;
        }
      }
      return null;
    };
    
    const tshirtsCategory = findCategoryByName(allCategories, 'T-Shirts');
    if (!tshirtsCategory) {
      console.log('❌ T-Shirts category not found');
      console.log('Available categories:', allCategories.map(cat => `${cat.name} (Level ${cat.level})`));
      return;
    }
    
    console.log(`\n3. Found T-Shirts category:`);
    console.log(`   ID: ${tshirtsCategory.id}`);
    console.log(`   Level: ${tshirtsCategory.level}`);
    console.log(`   Parent: ${tshirtsCategory.parentCategory}`);
    
    // Step 4: Test filter fetching
    console.log('\n4. Fetching filters for T-Shirts...');
    const filtersResponse = await axios.get(`/admin/categories/${tshirtsCategory.id}/filters`, { headers });
    
    console.log('Filter response structure:');
    console.log('- Success:', filtersResponse.data.success);
    console.log('- Data keys:', Object.keys(filtersResponse.data.data || {}));
    console.log('- Filters count:', filtersResponse.data.data?.filters?.length || 0);
    
    if (filtersResponse.data.data?.filters?.length > 0) {
      console.log('\n5. Filter details:');
      filtersResponse.data.data.filters.forEach((cf, index) => {
        console.log(`   ${index + 1}. ${cf.filter?.displayName || 'Unknown'} (${cf.filter?.type || 'Unknown'})`);
        console.log(`      - Required: ${cf.isRequired}`);
        console.log(`      - Active: ${cf.isActive}`);
        console.log(`      - Filter Active: ${cf.filter?.isActive}`);
        console.log(`      - Options: ${cf.filter?.options?.length || 0}`);
      });
    } else {
      console.log('\n❌ No filters found for T-Shirts category');
      
      // Check if filters are assigned to parent categories
      console.log('\n6. Checking parent category filters...');
      if (tshirtsCategory.parentCategory) {
        const parentFiltersResponse = await axios.get(`http://localhost:5001/api/admin/categories/${tshirtsCategory.parentCategory}/filters`, { headers });
        console.log(`Parent category filters: ${parentFiltersResponse.data.data?.filters?.length || 0}`);
      }
      
      // Check available filters
      console.log('\n7. Checking available filters for T-Shirts...');
      const availableFiltersResponse = await axios.get(`http://localhost:5001/api/admin/categories/${tshirtsCategory.id}/available-filters`, { headers });
      console.log(`Available filters: ${availableFiltersResponse.data.data?.availableFilters?.length || 0}`);
      
      if (availableFiltersResponse.data.data?.availableFilters?.length > 0) {
        console.log('Available filters:');
        availableFiltersResponse.data.data.availableFilters.forEach((filter, index) => {
          console.log(`   ${index + 1}. ${filter.displayName} (${filter.type})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

debugFilterIssue();