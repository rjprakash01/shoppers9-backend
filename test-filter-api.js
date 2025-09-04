const axios = require('axios');

const testFilterAPI = async () => {
  try {
    console.log('🔍 Testing Filter API Endpoints...');
    
    // Step 1: Login to get auth token
    console.log('\n1. Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5002/api/admin/auth/login', {
      email: 'admin@shoppers9.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful, token received');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Test filters endpoint
    console.log('\n2. Testing /api/admin/filters endpoint...');
    const filtersResponse = await axios.get('http://localhost:5002/api/admin/filters', { headers });
    console.log('✅ Filters response status:', filtersResponse.status);
    console.log('📊 Filters data structure:', {
      success: filtersResponse.data.success,
      dataKeys: Object.keys(filtersResponse.data.data || {}),
      filtersCount: filtersResponse.data.data?.filters?.length || 0,
      pagination: filtersResponse.data.data?.pagination
    });
    
    if (filtersResponse.data.data?.filters?.length > 0) {
      console.log('📝 Sample filters:', filtersResponse.data.data.filters.slice(0, 3).map(f => ({
        id: f.id || f._id,
        name: f.name,
        displayName: f.displayName,
        isActive: f.isActive
      })));
    }
    
    // Step 3: Test categories endpoint
    console.log('\n3. Testing /api/admin/categories/tree endpoint...');
    const categoriesResponse = await axios.get('http://localhost:5002/api/admin/categories/tree', { headers });
    console.log('✅ Categories response status:', categoriesResponse.status);
    console.log('📊 Categories data structure:', {
      success: categoriesResponse.data.success,
      dataKeys: Object.keys(categoriesResponse.data.data || {}),
      isArray: Array.isArray(categoriesResponse.data.data),
      length: Array.isArray(categoriesResponse.data.data) ? categoriesResponse.data.data.length : 'Not array'
    });
    
    // Step 4: Find a level 2/3 category and test category filters
    const flattenCategories = (cats, level = 0) => {
      let result = [];
      cats.forEach(cat => {
        result.push({ ...cat, level: cat.level || level });
        if (cat.children && cat.children.length > 0) {
          result = result.concat(flattenCategories(cat.children, level + 1));
        }
      });
      return result;
    };
    
    const categoryTree = categoriesResponse.data.data;
    const flatCategories = flattenCategories(categoryTree);
    const level2or3Categories = flatCategories.filter(cat => cat.level === 2 || cat.level === 3);
    
    console.log('📋 Level 2/3 categories found:', level2or3Categories.length);
    
    if (level2or3Categories.length > 0) {
      const testCategory = level2or3Categories[0];
      console.log('\n4. Testing category filters for:', testCategory.name);
      
      const categoryFiltersResponse = await axios.get(
        `http://localhost:5002/api/admin/categories/${testCategory.id || testCategory._id}/filters`,
        { headers }
      );
      
      console.log('✅ Category filters response status:', categoryFiltersResponse.status);
      console.log('📊 Category filters data:', {
        success: categoryFiltersResponse.data.success,
        filtersCount: categoryFiltersResponse.data.data?.filters?.length || 0
      });
    }
    
    console.log('\n🎉 API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing API:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
};

testFilterAPI();