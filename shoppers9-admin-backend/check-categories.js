const axios = require('axios');
const fs = require('fs');

async function checkCategories() {
  try {
    // Read the saved token
    const tokenData = JSON.parse(fs.readFileSync('admin_token.json', 'utf8'));
    const token = tokenData.token;
    
    console.log('Fetching category tree...');
    
    // Get category tree
    const response = await axios.get('http://localhost:5001/api/categories/tree', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Category tree response:', JSON.stringify(response.data, null, 2));
    
    // Find level 3 categories
    const findLevel3Categories = (categories, level3Cats = []) => {
      categories.forEach(cat => {
        if (cat.level === 3) {
          level3Cats.push(cat);
        }
        if (cat.children && cat.children.length > 0) {
          findLevel3Categories(cat.children, level3Cats);
        }
      });
      return level3Cats;
    };
    
    const level3Categories = findLevel3Categories(response.data.data || response.data || []);
    
    console.log('\n=== Level 3 Categories ===');
    level3Categories.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat.id || cat._id})`);
    });
    
    // Test filter endpoint with first level 3 category
    if (level3Categories.length > 0) {
      const testCategoryId = level3Categories[0].id || level3Categories[0]._id;
      console.log(`\nTesting filters for category: ${level3Categories[0].name} (${testCategoryId})`);
      
      if (!testCategoryId) {
        console.log('No valid category ID found!');
        return;
      }
      
      const filterResponse = await axios.get(
        `http://localhost:5001/api/admin/categories/${testCategoryId}/filters`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('\n=== Filter API Response ===');
      console.log('Status:', filterResponse.status);
      console.log('Data:', JSON.stringify(filterResponse.data, null, 2));
    } else {
      console.log('No level 3 categories found!');
    }
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

checkCategories();