const axios = require('axios');

async function testCategoryAPI() {
  try {
    console.log('Testing category creation...');
    
    // Create a test category
    const createResponse = await axios.post('http://localhost:5001/api/admin/categories', {
      name: 'Test Category',
      description: 'A test category',
      level: 1,
      isActive: true,
      sortOrder: 1
    });
    
    console.log('Create response:', JSON.stringify(createResponse.data, null, 2));
    
    // Fetch category tree
    const treeResponse = await axios.get('http://localhost:5001/api/admin/categories/tree');
    console.log('Tree response:', JSON.stringify(treeResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testCategoryAPI();