const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:4000';
const LOGIN_URL = `${BASE_URL}/api/auth/login`;
const CATEGORIES_URL = `${BASE_URL}/api/admin/categories/tree`;

// Admin credentials to try (from auth controller mock authentication)
const adminCredentials = {
  email: 'admin@shoppers9.com',
  password: 'admin123'
};

const alternativeCredentials = [
  { email: 'superadmin@shoppers9.com', password: 'superadmin123' },
  { phoneNumber: '9999999999', password: 'admin123' }
];

async function debugLevel3Filters() {
  let token;
  let headers;
  
  // Try to login with different credentials
  const credentialsToTry = [adminCredentials, ...alternativeCredentials];
  
  for (const credentials of credentialsToTry) {
    try {
      console.log(`🔐 Trying login with: ${credentials.email}`);
      const loginResponse = await axios.post(LOGIN_URL, credentials);
      
      if (loginResponse.data && loginResponse.data.success) {
        token = loginResponse.data.data?.accessToken || loginResponse.data.data?.token || loginResponse.data.token;
        headers = { 'Authorization': `Bearer ${token}` };
        console.log('✅ Login successful');
        break;
      }
    } catch (loginError) {
      console.log(`❌ Login failed for ${credentials.email}:`, loginError.response?.data?.message || loginError.message);
    }
  }
  
  if (!token) {
    console.error('❌ All login attempts failed');
    return;
  }
  
  try {
    
    // Get all categories
    console.log('\n📁 Fetching categories...');
    const categoriesResponse = await axios.get(CATEGORIES_URL, { headers });
    const categories = categoriesResponse.data.data || categoriesResponse.data;
    
    // Flatten categories to find level 3
    const flattenCategories = (cats, result = []) => {
      cats.forEach(cat => {
        result.push(cat);
        if (cat.children && cat.children.length > 0) {
          flattenCategories(cat.children, result);
        }
      });
      return result;
    };
    
    const allCategories = flattenCategories(categories);
    const level3Categories = allCategories.filter(cat => cat.level === 3);
    
    console.log(`\n🎯 Found ${level3Categories.length} level 3 categories:`);
    level3Categories.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id || cat._id})`);
    });
    
    if (level3Categories.length === 0) {
      console.log('❌ No level 3 categories found!');
      return;
    }
    
    // Test filters for each level 3 category
    console.log('\n🔍 Testing filters for each level 3 category...');
    
    for (const category of level3Categories) {
      const categoryId = category.id || category._id;
      console.log(`\n📋 Category: ${category.name} (${categoryId})`);
      
      try {
        const filtersResponse = await axios.get(
          `${BASE_URL}/api/admin/categories/${categoryId}/filters`,
          { headers }
        );
        
        console.log('  ✅ API Response Status:', filtersResponse.status);
        console.log('  📊 Response Structure:', {
          success: filtersResponse.data.success,
          hasData: !!filtersResponse.data.data,
          hasFilters: !!filtersResponse.data.data?.filters,
          filtersCount: filtersResponse.data.data?.filters?.length || 0
        });
        
        const filters = filtersResponse.data.data?.filters || [];
        if (filters.length > 0) {
          console.log('  🎯 Assigned Filters:');
          filters.forEach((categoryFilter, index) => {
            const filter = categoryFilter.filter;
            console.log(`    ${index + 1}. ${filter?.displayName || filter?.name} (${filter?.type})`);
            console.log(`       Options: ${filter?.options?.length || 0}`);
          });
        } else {
          console.log('  ⚠️  No filters assigned to this category');
        }
        
      } catch (error) {
        console.log('  ❌ Error:', error.response?.data?.message || error.message);
      }
    }
    
    // Check if there are any filters available to assign
    console.log('\n🔧 Checking available filters...');
    const filtersResponse = await axios.get(`${BASE_URL}/api/admin/filters`, { headers });
    const allFilters = filtersResponse.data.data?.data || filtersResponse.data.data?.filters || filtersResponse.data.data || [];
    console.log(`📊 Total filters in system: ${allFilters.length}`);
    
    if (allFilters.length > 0) {
      console.log('Available filters:');
      allFilters.slice(0, 5).forEach(filter => {
        console.log(`  - ${filter.displayName} (${filter.name}) - ${filter.type}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error details:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    console.error('Full error:', error);
  }
}

debugLevel3Filters();