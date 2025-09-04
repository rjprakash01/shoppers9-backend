const axios = require('axios');
const fs = require('fs');

async function testCategoriesAPI() {
  try {
    // Read token from file
    const tokenData = JSON.parse(fs.readFileSync('fresh_token.json', 'utf8'));
    const token = tokenData.data.accessToken;
    
    console.log('🔍 Testing categories API...');
    
    // Test categories endpoint
    const response = await axios.get('http://localhost:4000/api/admin/categories', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Categories API Response:');
    console.log('Status:', response.status);
    console.log('Data structure:', JSON.stringify(response.data, null, 2));
    
    // Check if we have categories
    const categories = response.data?.data?.categories || response.data?.categories || response.data?.data || response.data || [];
    if (Array.isArray(categories) && categories.length > 0) {
      console.log(`\n📊 Found ${categories.length} categories`);
      
      // Find a level 2 or 3 category
      const testCategory = categories.find(cat => cat.level === 2 || cat.level === 3);
      if (testCategory) {
        console.log(`\n🎯 Testing filters for category: ${testCategory.name} (Level ${testCategory.level})`);
        
        // Test category filters endpoint
        const categoryId = testCategory._id || testCategory.id;
        console.log(`Testing URL: http://localhost:4000/api/admin/categories/${categoryId}/filters`);
        const filtersResponse = await axios.get(`http://localhost:4000/api/admin/categories/${categoryId}/filters`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('\n🔧 Category Filters Response:');
        console.log('Status:', filtersResponse.status);
        console.log('Data:', JSON.stringify(filtersResponse.data, null, 2));
      } else {
        console.log('\n⚠️ No level 2 or 3 categories found for testing');
      }
    } else {
      console.log('\n❌ No categories found or invalid response structure');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testCategoriesAPI();