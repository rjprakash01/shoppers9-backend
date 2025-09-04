// Test the complete frontend workflow for filters
const axios = require('axios');

async function testFrontendWorkflow() {
  try {
    console.log('🔍 Testing complete frontend workflow for filters...');
    
    // Step 1: Login
    console.log('\n1. Logging in as super admin...');
    const loginResponse = await axios.post('http://localhost:4000/api/auth/admin/login', {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Get category tree (like frontend does)
    console.log('\n2. Fetching category tree...');
    const categoryTreeResponse = await axios.get('http://localhost:4000/api/admin/categories/tree', { headers });
    
    console.log('Category tree response structure:', {
      success: categoryTreeResponse.data?.success,
      hasData: !!categoryTreeResponse.data?.data,
      dataKeys: Object.keys(categoryTreeResponse.data?.data || {})
    });
    
    // Step 3: Get all categories (like ProductForm does)
    console.log('\n3. Fetching all categories...');
    const categoriesResponse = await axios.get('http://localhost:4000/api/admin/categories', { headers });
    
    let categories = [];
    if (categoriesResponse.data?.success && categoriesResponse.data?.data?.categories) {
      categories = categoriesResponse.data.data.categories;
    } else if (categoriesResponse.data?.categories) {
      categories = categoriesResponse.data.categories;
    }
    
    console.log(`✅ Found ${categories.length} categories`);
    
    // Step 4: Simulate category selection workflow
    console.log('\n4. Simulating category selection workflow...');
    
    // Find level 1 category (Main category)
    const level1Categories = categories.filter(cat => cat.level === 1);
    console.log(`Found ${level1Categories.length} level 1 categories:`, level1Categories.map(c => c.name));
    
    if (level1Categories.length === 0) {
      console.log('❌ No level 1 categories found');
      return;
    }
    
    const mainCategory = level1Categories[0];
    console.log(`\nSelected main category: ${mainCategory.name}`);
    
    // Find level 2 categories under this main category
    const level2Categories = categories.filter(cat => {
      if (cat.level !== 2) return false;
      const parentId = cat.parentCategory?._id || cat.parentCategory?.id || cat.parentCategory;
      const mainCategoryId = mainCategory._id || mainCategory.id;
      return parentId === mainCategoryId;
    });
    
    console.log(`Found ${level2Categories.length} level 2 categories under ${mainCategory.name}:`, level2Categories.map(c => c.name));
    
    if (level2Categories.length === 0) {
      console.log('❌ No level 2 categories found under main category');
      return;
    }
    
    const subCategory = level2Categories[0];
    console.log(`\nSelected sub category: ${subCategory.name}`);
    
    // Step 5: Test filters for level 2 category (this is where filters should appear)
    console.log('\n5. Testing filters for level 2 category...');
    const subCategoryId = subCategory._id || subCategory.id;
    console.log(`Fetching filters for category ID: ${subCategoryId}`);
    
    const filtersResponse = await axios.get(`http://localhost:4000/api/admin/categories/${subCategoryId}/filters`, { headers });
    
    console.log('\n6. Filter Response Analysis:');
    console.log('Status:', filtersResponse.status);
    console.log('Success:', filtersResponse.data?.success);
    
    if (filtersResponse.data?.success && filtersResponse.data?.data?.filters) {
      const filters = filtersResponse.data.data.filters;
      console.log(`✅ Found ${filters.length} filters for ${subCategory.name}`);
      
      filters.forEach((categoryFilter, index) => {
        const filter = categoryFilter.filter;
        console.log(`\n  Filter ${index + 1}: ${filter.name}`);
        console.log(`    - Display Name: ${filter.displayName}`);
        console.log(`    - Type: ${filter.type}`);
        console.log(`    - Required: ${categoryFilter.isRequired}`);
        console.log(`    - Active: ${categoryFilter.isActive}`);
        console.log(`    - Options: ${filter.options?.length || 0}`);
        
        if (filter.options && filter.options.length > 0) {
          console.log(`    - Sample options: ${filter.options.slice(0, 3).map(opt => opt.displayValue).join(', ')}`);
        }
      });
      
      console.log('\n7. Frontend Processing Check:');
      console.log('✅ Frontend should successfully display these filters in the Product Form');
      
    } else {
      console.log('❌ No filters found for level 2 category');
      console.log('Response:', JSON.stringify(filtersResponse.data, null, 2));
    }
    
    // Step 6: Test level 3 categories if they exist
    const level3Categories = categories.filter(cat => {
      if (cat.level !== 3) return false;
      const parentId = cat.parentCategory?._id || cat.parentCategory?.id || cat.parentCategory;
      const subCategoryId = subCategory._id || subCategory.id;
      return parentId === subCategoryId;
    });
    
    if (level3Categories.length > 0) {
      console.log(`\n8. Testing level 3 category filters...`);
      const level3Category = level3Categories[0];
      console.log(`Selected level 3 category: ${level3Category.name}`);
      
      const level3CategoryId = level3Category._id || level3Category.id;
      const level3FiltersResponse = await axios.get(`http://localhost:4000/api/admin/categories/${level3CategoryId}/filters`, { headers });
      
      if (level3FiltersResponse.data?.success && level3FiltersResponse.data?.data?.filters) {
        const level3Filters = level3FiltersResponse.data.data.filters;
        console.log(`✅ Found ${level3Filters.length} filters for level 3 category ${level3Category.name}`);
      } else {
        console.log(`❌ No filters found for level 3 category ${level3Category.name}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in workflow test:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testFrontendWorkflow();