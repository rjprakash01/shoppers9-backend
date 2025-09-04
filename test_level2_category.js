const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api/admin';
const AUTH_URL = 'http://localhost:5001/api/auth';

async function testLevel2CategoryCreation() {
  try {
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${AUTH_URL}/login`, {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('✅ Admin login successful');
    
    // Get existing categories to find a parent
    console.log('📋 Fetching existing categories...');
    const categoriesResponse = await axios.get(`${BASE_URL}/categories/tree`, { headers });
    const categories = categoriesResponse.data.data || categoriesResponse.data;
    
    console.log('Categories structure:', typeof categories, Array.isArray(categories));
    
    // Find a level 1 category to use as parent
    const level1Category = Array.isArray(categories) ? categories.find(cat => cat.level === 1) : null;
    if (!level1Category) {
      console.log('❌ No level 1 category found to use as parent');
      return;
    }
    
    const parentId = level1Category._id || level1Category.id;
    console.log(`📁 Using parent category: ${level1Category.name} (ID: ${parentId})`);
    
    // Test creating a level 2 subcategory
    const timestamp = Date.now();
    const categoryData = {
      name: `Subcategory-${timestamp}`,
      description: 'Test level 2 subcategory',
      parentCategory: parentId,
      level: 2,
      isActive: true,
      sortOrder: 1
    };
    
    console.log('🆕 Creating level 2 subcategory...');
    console.log('Category data:', categoryData);
    
    const createResponse = await axios.post(`${BASE_URL}/categories`, categoryData, { headers });
    
    if (createResponse.status === 201) {
      console.log('✅ Level 2 subcategory created successfully!');
      console.log('Created category:', createResponse.data);
      
      // Test creating another subcategory with the same name but different parent
      const anotherLevel1 = categories.find(cat => cat.level === 1 && (cat._id || cat.id) !== parentId);
      if (anotherLevel1) {
        console.log('🔄 Testing same name with different parent...');
        const anotherParentId = anotherLevel1._id || anotherLevel1.id;
        const sameNameData = {
          name: `Subcategory-${timestamp}`, // Same name
          description: 'Test same name different parent',
          parentCategory: anotherParentId, // Different parent
          level: 2,
          isActive: true,
          sortOrder: 1
        };
        
        const sameNameResponse = await axios.post(`${BASE_URL}/categories`, sameNameData, { headers });
        if (sameNameResponse.status === 201) {
          console.log('✅ Same name with different parent created successfully!');
          console.log('This confirms the compound index is working correctly.');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 400) {
      console.log('🔍 This is the 400 error we are trying to fix');
    }
  }
}

testLevel2CategoryCreation();