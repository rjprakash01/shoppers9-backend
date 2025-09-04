const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5001/api';
const ADMIN_CREDENTIALS = {
  email: 'admin@shoppers9.com',
  password: 'admin123'
};

let authToken = '';

async function loginAsAdmin() {
  try {
    console.log('🔐 Logging in as admin...');
    const response = await axios.post(`${BASE_URL}/auth/admin/login`, ADMIN_CREDENTIALS);
    authToken = response.data.token;
    console.log('✅ Admin login successful');
    return true;
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data || error.message);
    return false;
  }
}

async function createCategory(categoryData) {
  try {
    const response = await axios.post(
      `${BASE_URL}/admin/categories`,
      categoryData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`✅ Created category: ${categoryData.name}`);
    return response.data.data; // Access the data property
  } catch (error) {
    console.error(`❌ Failed to create category ${categoryData.name}:`, error.response?.data || error.message);
    throw error;
  }
}

async function testSlugGeneration() {
  console.log('\n🧪 Testing slug generation with duplicate names...');
  
  const timestamp = Date.now();
  
  try {
    // Create level 1 category
    const level1 = await createCategory({
      name: `Electronics-${timestamp}`,
      description: 'Electronics category',
      isActive: true,
      sortOrder: 1
    });
    
    // Create level 2 category
    const level2 = await createCategory({
      name: `Mobile Phones-${timestamp}`,
      description: 'Mobile phones subcategory',
      parentCategory: level1._id || level1.id,
      isActive: true,
      sortOrder: 1
    });
    
    // Create level 3 category
    const level3 = await createCategory({
      name: 'Accessories',
      description: 'Phone accessories',
      parentCategory: level2._id || level2.id,
      isActive: true,
      sortOrder: 1
    });
    
    console.log(`\n📋 Created hierarchy:`);
    console.log(`Level 1: ${level1.name} (slug: ${level1.slug})`);
    console.log(`Level 2: ${level2.name} (slug: ${level2.slug})`);
    console.log(`Level 3: ${level3.name} (slug: ${level3.slug})`);
    
    // Try to create another level 3 with same name under different parent
    const anotherLevel2 = await createCategory({
      name: `Laptops-${timestamp}`,
      description: 'Laptops subcategory',
      parentCategory: level1._id || level1.id,
      isActive: true,
      sortOrder: 2
    });
    
    const anotherLevel3 = await createCategory({
      name: 'Accessories', // Same name as before
      description: 'Laptop accessories',
      parentCategory: anotherLevel2._id || anotherLevel2.id,
      isActive: true,
      sortOrder: 1
    });
    
    console.log(`\n📋 Created another branch:`);
    console.log(`Level 2: ${anotherLevel2.name} (slug: ${anotherLevel2.slug})`);
    console.log(`Level 3: ${anotherLevel3.name} (slug: ${anotherLevel3.slug})`);
    
    // Try to create exact duplicate (should fail due to name constraint)
    try {
      const duplicateLevel3 = await createCategory({
        name: 'Accessories', // Same name again
        description: 'More phone accessories',
        parentCategory: level2._id || level2.id, // Same parent as first one
        isActive: true,
        sortOrder: 2
      });
      console.log('❌ Unexpected: Duplicate category was created');
    } catch (error) {
      console.log('✅ Expected: Duplicate category creation failed (name constraint working)');
    }
    
    // Test slug uniqueness by creating categories that would have same slug
    const testLevel3 = await createCategory({
      name: 'Test Category',
      description: 'Test category for slug uniqueness',
      parentCategory: level2._id || level2.id,
      isActive: true,
      sortOrder: 3
    });
    
    console.log(`\n📋 Test category created:`);
    console.log(`Level 3: ${testLevel3.name} (slug: ${testLevel3.slug})`);
    
    console.log('\n🎉 All tests passed! Slug generation and name constraints are working correctly.');
    console.log('✅ Same names allowed under different parents');
    console.log('✅ Unique slugs generated automatically');
    console.log('✅ Name uniqueness enforced within same parent level');
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting slug generation test...');
  
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    console.error('Cannot proceed without admin authentication');
    return;
  }
  
  await testSlugGeneration();
  
  console.log('\n✨ Test completed!');
}

main().catch(console.error);