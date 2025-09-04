const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function fixAllCategoryFilters() {
  try {
    console.log('🔧 Fixing category filters for ALL levels...');
    
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    const token = loginResponse.data.data?.accessToken || loginResponse.data.data?.token || loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('🔑 Token:', token ? 'Found' : 'Missing');
    
    if (!token) {
      console.log('❌ No token received. Login response:', JSON.stringify(loginResponse.data, null, 2));
      return;
    }
    
    // Get all categories
    const categoriesResponse = await axios.get(`${BASE_URL}/api/admin/categories?limit=100`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('📋 Categories response structure:', Object.keys(categoriesResponse.data));
    console.log('📋 Categories data structure:', Object.keys(categoriesResponse.data.data || {}));
    
    const categories = categoriesResponse.data.data?.categories || categoriesResponse.data.data?.data || categoriesResponse.data.data || [];
    console.log(`📋 Found ${categories.length} categories`);
    
    if (categories.length === 0) {
      console.log('❌ No categories found. Response:', JSON.stringify(categoriesResponse.data, null, 2));
      return;
    }
    
    // Get all filters
    const filtersResponse = await axios.get(`${BASE_URL}/api/admin/filters`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('🔍 Filters response structure:', Object.keys(filtersResponse.data));
    console.log('🔍 Filters data structure:', Object.keys(filtersResponse.data.data || {}));
    
    const filters = filtersResponse.data.data?.data || filtersResponse.data.data?.filters || filtersResponse.data.data || [];
    console.log(`🔍 Found ${filters.length} filters`);
    
    if (filters.length === 0) {
      console.log('❌ No filters found. Response:', JSON.stringify(filtersResponse.data, null, 2));
      return;
    }
    
    // Define filter assignments for each category level
    const filterAssignments = {
      // Level 1 categories
      'Men': ['color', 'size', 'fit', 'fabric'],
      'Women': ['color', 'size', 'fit', 'fabric', 'pattern'],
      'Household': ['color', 'fabric', 'pattern'],
      
      // Level 2 categories
      'Clothing': ['color', 'size', 'fit', 'fabric', 'pattern', 'sleeve_type'],
      'Footwear': ['color', 'size', 'fabric', 'occasion'],
      'Accessories': ['color', 'fabric', 'occasion'],
      'Furniture': ['color', 'fabric', 'pattern'],
      'Kitchenware': ['color', 'fabric', 'pattern'],
      
      // Level 3 categories
      'T-Shirts': ['color', 'size', 'fit', 'fabric', 'sleeve_type', 'pattern'],
      'Shirts': ['color', 'size', 'fit', 'fabric', 'sleeve_type', 'pattern', 'neck_type'],
      'Jeans': ['color', 'size', 'fit', 'fabric', 'waist_size'],
      'Trousers': ['color', 'size', 'fit', 'fabric', 'waist_size'],
      'Sneakers': ['color', 'size', 'fabric', 'occasion'],
      'Formal Shoes': ['color', 'size', 'fabric', 'occasion'],
      'Tops': ['color', 'size', 'fit', 'fabric', 'sleeve_type', 'pattern'],
      'Dresses': ['color', 'size', 'fit', 'fabric', 'sleeve_type', 'pattern'],
      'Heels': ['color', 'size', 'fabric', 'occasion'],
      'Flats': ['color', 'size', 'fabric', 'occasion'],
      'Chairs': ['color', 'fabric', 'pattern'],
      'Tables': ['color', 'fabric', 'pattern'],
      'Cookware': ['color', 'fabric', 'pattern'],
      'Storage': ['color', 'fabric', 'pattern']
    };
    
    // Process each category
    for (const category of categories) {
      const categoryName = category.name;
      const categoryId = category._id || category.id;
      const assignedFilters = filterAssignments[categoryName];
      
      if (!assignedFilters) {
        console.log(`⚠️  No filter assignment defined for: ${categoryName}`);
        continue;
      }
      
      if (!categoryId) {
        console.log(`❌ Category ID missing for: ${categoryName}`);
        console.log(`   Category structure:`, Object.keys(category));
        continue;
      }
      
      console.log(`\n🏷️  Processing: ${categoryName} (Level ${category.level}) - ID: ${categoryId}`);
      
      // Skip level 1 categories (filters can only be assigned to level 2 and 3)
      if (category.level === 1) {
        console.log(`  ⏭️  Skipping level 1 category: ${categoryName}`);
        continue;
      }
      
      // Clear existing filters first
      try {
        const existingFilters = await axios.get(`${BASE_URL}/api/admin/categories/${categoryId}/filters`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const currentFilters = existingFilters.data.data?.categoryFilters || existingFilters.data.data || [];
        
        // Remove existing filters
        for (const cf of currentFilters) {
          const filterId = cf.filter?._id || cf._id;
          if (filterId) {
            try {
              await axios.delete(`${BASE_URL}/api/admin/categories/${categoryId}/filters/${filterId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
            } catch (err) {
              // Ignore delete errors
            }
          }
        }
      } catch (err) {
        // Ignore if no existing filters
      }
      
      // Assign new filters
      for (const filterName of assignedFilters) {
          const filter = filters.find(f => f.name === filterName);
          
          if (!filter) {
            console.log(`  ❌ Filter not found: ${filterName}`);
            continue;
          }
          
          try {
             const assignResponse = await axios.post(`${BASE_URL}/api/admin/categories/${categoryId}/filters`, {
                filterId: filter.id || filter._id,
                isRequired: false,
                displayOrder: 1
              }, {
               headers: { 'Authorization': `Bearer ${token}` }
             });
             
             console.log(`  ✅ Successfully assigned ${filterName}`);
           } catch (err) {
             console.log(`  ❌ Failed to assign ${filterName}: ${err.response?.data?.message || err.message}`);
           }
      }
    }
    
    console.log('\n🎉 Filter assignment completed for all categories!');
    
    // Verify assignments
    console.log('\n📊 Verification:');
    for (const category of categories.slice(0, 10)) { // Check first 10 categories
      const categoryId = category._id || category.id;
      
      // Skip level 1 categories
      if (category.level === 1) {
        console.log(`  ${category.name} (Level ${category.level}): Skipped - Level 1 categories don't have filters`);
        continue;
      }
      
      try {
        const categoryFilters = await axios.get(`${BASE_URL}/api/admin/categories/${categoryId}/filters`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const filterData = categoryFilters.data.data;
        const filterCount = filterData?.categoryFilters?.length || filterData?.filters?.length || filterData?.length || 0;
        console.log(`  ${category.name} (Level ${category.level}): ${filterCount} filters assigned`);
        
        if (filterCount > 0 && filterData?.categoryFilters) {
          const filterNames = filterData.categoryFilters.map(cf => cf.filter?.name || cf.name).filter(Boolean);
          console.log(`    Filters: ${filterNames.join(', ')}`);
        }
      } catch (err) {
        console.log(`  ${category.name} (Level ${category.level}): Error checking filters - ${err.response?.data?.message || err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.error('Full error:', error);
  }
}

fixAllCategoryFilters();