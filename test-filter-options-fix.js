const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testFilterOptionsFix() {
  try {
    console.log('🧪 Testing Filter Options Fix...');
    
    // Step 1: Login
    console.log('\n1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful');
    
    // Step 2: Get categories
    console.log('\n2. Getting categories...');
    const categoriesResponse = await axios.get(`${BASE_URL}/api/admin/categories`, { headers });
    const categories = categoriesResponse.data.data.categories;
    
    // Find T-Shirts category (level 3)
    const tshirtsCategory = categories.find(cat => cat.level === 3 && cat.name === 'T-Shirts');
    if (!tshirtsCategory) {
      console.log('❌ T-Shirts category not found');
      return;
    }
    
    const categoryId = tshirtsCategory._id || tshirtsCategory.id;
    console.log(`✅ Found T-Shirts category: ${categoryId}`);
    
    // Step 3: Test category filters endpoint
    console.log('\n3. Testing category filters endpoint...');
    const filtersResponse = await axios.get(
      `${BASE_URL}/api/admin/categories/${categoryId}/filters`,
      { headers }
    );
    
    console.log('✅ Filters endpoint working');
    const filters = filtersResponse.data.data.filters;
    console.log(`📊 Found ${filters.length} filters`);
    
    // Step 4: Verify filter options structure
    console.log('\n4. Verifying filter options structure...');
    let allOptionsHaveIds = true;
    let totalOptions = 0;
    
    filters.forEach((categoryFilter, index) => {
      const filter = categoryFilter.filter;
      console.log(`\n📋 Filter ${index + 1}: ${filter.displayName}`);
      console.log(`   - Type: ${filter.type}`);
      console.log(`   - Options count: ${filter.options?.length || 0}`);
      
      if (filter.options && filter.options.length > 0) {
        filter.options.forEach((option, optIndex) => {
          const hasId = !!(option._id || option.id);
          const optionId = option._id || option.id;
          
          if (!hasId) {
            allOptionsHaveIds = false;
            console.log(`   ❌ Option ${optIndex + 1} (${option.displayValue}) missing ID`);
          } else {
            if (optIndex < 3) { // Show first 3 options
              console.log(`   ✅ Option ${optIndex + 1}: ${option.displayValue} (ID: ${optionId})`);
            }
          }
          totalOptions++;
        });
        
        if (filter.options.length > 3) {
          console.log(`   ... and ${filter.options.length - 3} more options`);
        }
      } else {
        console.log(`   ❌ No options found for this filter`);
        allOptionsHaveIds = false;
      }
    });
    
    // Step 5: Summary
    console.log('\n🎯 Test Results Summary:');
    console.log(`   - Filters found: ${filters.length}`);
    console.log(`   - Total options: ${totalOptions}`);
    console.log(`   - All options have IDs: ${allOptionsHaveIds ? '✅ YES' : '❌ NO'}`);
    
    if (allOptionsHaveIds && totalOptions > 0) {
      console.log('\n🎉 SUCCESS: Filter options fix is working!');
      console.log('   - ProductForm should now display filter options in dropdowns');
      console.log('   - Users can select filter values when creating/editing products');
    } else {
      console.log('\n❌ ISSUE: Filter options still have problems');
      if (totalOptions === 0) {
        console.log('   - No filter options found');
      }
      if (!allOptionsHaveIds) {
        console.log('   - Some options are missing IDs');
      }
    }
    
    // Step 6: Test a specific filter option selection
    console.log('\n6. Testing filter option selection simulation...');
    const colorFilter = filters.find(cf => cf.filter.name === 'color');
    if (colorFilter && colorFilter.filter.options && colorFilter.filter.options.length > 0) {
      const firstOption = colorFilter.filter.options[0];
      const optionId = firstOption._id || firstOption.id;
      
      console.log(`✅ Color filter found with ${colorFilter.filter.options.length} options`);
      console.log(`✅ First option: ${firstOption.displayValue} (ID: ${optionId})`);
      console.log(`✅ ProductForm can use this option ID for form submission`);
    } else {
      console.log(`❌ Color filter not found or has no options`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testFilterOptionsFix();