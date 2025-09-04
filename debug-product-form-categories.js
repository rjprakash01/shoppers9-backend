const axios = require('axios');

async function debugProductFormCategories() {
  console.log('🔍 Debugging ProductForm category loading...');
  
  try {
    // Step 1: Login
    console.log('\n1. Logging in...');
    const loginResponse = await axios.post('http://localhost:5002/api/auth/admin/login', {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }
    
    console.log('✅ Login successful');
    const token = loginResponse.data.data.accessToken;
    
    // Step 2: Fetch categories (exact same call as ProductForm)
    console.log('\n2. Fetching categories...');
    const categoriesResponse = await axios.get('http://localhost:5002/api/admin/categories', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Categories response status:', categoriesResponse.status);
    
    // Parse categories using the same logic as ProductForm
    let allCategories = [];
    if (categoriesResponse.data && categoriesResponse.data.success && categoriesResponse.data.data && Array.isArray(categoriesResponse.data.data.categories)) {
      allCategories = categoriesResponse.data.data.categories;
      console.log('✅ Using categoriesResponse.data.data.categories');
    }
    
    console.log(`\n📊 Found ${allCategories.length} total categories`);
    
    // Show detailed structure of first few categories
    console.log('\n🔍 Detailed category structure:');
    allCategories.slice(0, 5).forEach((cat, index) => {
      console.log(`\n${index + 1}. ${cat.name}:`);
      console.log(`   - ID: ${cat.id || cat._id}`);
      console.log(`   - Level: ${cat.level}`);
      console.log(`   - Parent type: ${typeof cat.parentCategory}`);
      console.log(`   - Parent value:`, cat.parentCategory);
      if (cat.parentCategory && typeof cat.parentCategory === 'object') {
        console.log(`   - Parent ID: ${cat.parentCategory.id || cat.parentCategory._id}`);
        console.log(`   - Parent name: ${cat.parentCategory.name}`);
      }
      console.log(`   - Active: ${cat.isActive}`);
    });
    
    // Test the correct hierarchy logic
    const level1 = allCategories.filter(cat => cat.level === 1);
    console.log(`\n📈 Found ${level1.length} main categories`);
    
    if (level1.length > 0) {
      const mainCat = level1[0];
      const mainCatId = mainCat.id || mainCat._id;
      console.log(`\n🔗 Testing hierarchy for "${mainCat.name}" (${mainCatId}):`);
      
      // Test different ways to match parent category
      console.log('\n🧪 Testing parent matching strategies:');
      
      // Strategy 1: Direct string comparison (current ProductForm logic)
      const subCats1 = allCategories.filter(cat => cat.level === 2 && cat.parentCategory === mainCatId);
      console.log(`Strategy 1 (direct string): ${subCats1.length} subcategories`);
      
      // Strategy 2: Object ID comparison
      const subCats2 = allCategories.filter(cat => {
        if (cat.level !== 2) return false;
        if (typeof cat.parentCategory === 'string') {
          return cat.parentCategory === mainCatId;
        } else if (cat.parentCategory && typeof cat.parentCategory === 'object') {
          return (cat.parentCategory.id || cat.parentCategory._id) === mainCatId;
        }
        return false;
      });
      console.log(`Strategy 2 (object ID): ${subCats2.length} subcategories`);
      
      if (subCats2.length > 0) {
        console.log('\n✅ Found subcategories using Strategy 2:');
        subCats2.forEach(subCat => {
          const subCatId = subCat.id || subCat._id;
          console.log(`  - ${subCat.name} (${subCatId})`);
          
          // Test sub-subcategories
          const subSubCats = allCategories.filter(cat => {
            if (cat.level !== 3) return false;
            if (typeof cat.parentCategory === 'string') {
              return cat.parentCategory === subCatId;
            } else if (cat.parentCategory && typeof cat.parentCategory === 'object') {
              return (cat.parentCategory.id || cat.parentCategory._id) === subCatId;
            }
            return false;
          });
          
          subSubCats.forEach(subSubCat => {
            console.log(`    - ${subSubCat.name} (${subSubCat.id || subSubCat._id})`);
          });
        });
        
        // Test filter fetching
        const testSubCat = subCats2[0];
        const testSubCatId = testSubCat.id || testSubCat._id;
        console.log(`\n🔍 Testing filters for "${testSubCat.name}" (${testSubCatId}):`);
        
        try {
          const filtersResponse = await axios.get(`http://localhost:5002/api/admin/categories/${testSubCatId}/filters`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (filtersResponse.data?.data?.filters?.length > 0) {
            console.log(`✅ Found ${filtersResponse.data.data.filters.length} filters:`);
            filtersResponse.data.data.filters.forEach(filter => {
              console.log(`  - ${filter.filter.displayName} (${filter.filter.type})`);
            });
          } else {
            console.log('ℹ️ No filters assigned to this category');
          }
        } catch (filterError) {
          console.log('❌ Filter fetching error:', {
            message: filterError.message,
            status: filterError.response?.status,
            data: filterError.response?.data
          });
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
  
  console.log('\n🎉 Debug completed!');
}

debugProductFormCategories();