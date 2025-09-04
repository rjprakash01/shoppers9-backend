const axios = require('axios');
const fs = require('fs');

async function getFreshToken() {
  try {
    console.log('🔐 Logging in to get fresh token...');
    
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'admin@shoppers9.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
    
    // Save token to file
    fs.writeFileSync('fresh_token.json', JSON.stringify(loginResponse.data, null, 2));
    console.log('💾 Token saved to fresh_token.json');
    
    return loginResponse.data.data.accessToken;
    
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return null;
  }
}

async function testCategoryFilters() {
  try {
    // Get fresh token
    const token = await getFreshToken();
    if (!token) {
      console.log('❌ Could not get token');
      return;
    }

    // First, get categories to find a level 2 or 3 category
    console.log('\n🔍 Fetching categories...');
    const categoriesResponse = await axios.get('http://localhost:4000/api/admin/categories', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Full categories response:', JSON.stringify(categoriesResponse.data, null, 2));
    const categories = categoriesResponse.data?.data || categoriesResponse.data || [];
    console.log(`📊 Found ${Array.isArray(categories) ? categories.length : 'non-array'} categories`);
    
    if (!Array.isArray(categories)) {
      console.log('❌ Categories is not an array:', typeof categories);
      return;
    }
    
    console.log('Categories structure:', JSON.stringify(categories.slice(0, 2), null, 2));
    
    // Find a level 2 or 3 category for testing
    const level2And3Categories = categories.filter(cat => cat.level === 2 || cat.level === 3);
    
    console.log(`Found ${level2And3Categories.length} level 2/3 categories:`);
    level2And3Categories.forEach(cat => {
      console.log(`- ${cat.name} (Level ${cat.level}, ID: ${cat.id || cat._id})`);
    });

    if (level2And3Categories.length === 0) {
      console.log('❌ No level 2/3 categories found!');
      return;
    }

    // Test with the first level 2/3 category
    const testCategory = level2And3Categories[0];
    const categoryId = testCategory.id || testCategory._id;
    
    console.log(`\n🔍 Testing category filters for: ${testCategory.name} (${categoryId})`);
    
    const response = await axios.get(`http://localhost:4000/api/admin/categories/${categoryId}/filters`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n📊 API Response Status:', response.status);
    console.log('📊 API Response Structure:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check if filters have options
    if (response.data && response.data.success && response.data.data && response.data.data.filters) {
      const filters = response.data.data.filters;
      console.log(`\n🔍 Found ${filters.length} filters:`);
      
      filters.forEach((categoryFilter, index) => {
        console.log(`\n${index + 1}. Filter: ${categoryFilter.filter?.displayName || 'Unknown'}`);
        console.log(`   - Type: ${categoryFilter.filter?.type || 'Unknown'}`);
        console.log(`   - Data Type: ${categoryFilter.filter?.dataType || 'Unknown'}`);
        console.log(`   - Required: ${categoryFilter.isRequired ? 'Yes' : 'No'}`);
        
        if (categoryFilter.filter && categoryFilter.filter.options) {
          console.log(`   - Options: ${categoryFilter.filter.options.length}`);
          categoryFilter.filter.options.forEach((option, optIndex) => {
            console.log(`     ${optIndex + 1}. ${option.displayValue} (${option.value})`);
          });
        } else {
          console.log(`   - Options: None or not populated`);
        }
      });
    } else {
      console.log('❌ Unexpected response structure');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testCategoryFilters();