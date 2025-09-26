const axios = require('axios');
const jwt = require('jsonwebtoken');

// Script to assign filters to the Men category
async function assignFiltersToMenCategory() {
  try {
    console.log('🎯 Assigning filters to Men category...');
    
    // Create a test JWT token for authentication
    const createTestToken = () => {
      const payload = {
        id: '68ca49d2922b49ad4f20395e', // Valid super admin user ID
        email: 'superadmin@shoppers9.com',
        primaryRole: 'super_admin'
      };
      
      return jwt.sign(payload, 'your-super-secret-jwt-key-for-admin-backend', { expiresIn: '1h' });
    };
    
    const token = createTestToken();
    
    // Create axios instance
    const api = axios.create({
      baseURL: 'http://localhost:5001/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Get Men category
    console.log('📂 Step 1: Finding Men category...');
    const categoriesResponse = await api.get('/admin/categories?page=1&limit=10');
    const menCategory = categoriesResponse.data.data.categories.find(cat => cat.name === 'Men');
    
    if (!menCategory) {
      console.log('❌ Men category not found');
      return;
    }
    
    const categoryId = menCategory.id || menCategory._id;
    console.log('✅ Found Men category:', menCategory.name, '(ID:', categoryId, ')');
    
    // Get available filters
    console.log('\n🔍 Step 2: Getting available filters...');
    const availableFiltersResponse = await api.get(`/admin/categories/${categoryId}/available-filters`);
    const availableFilters = availableFiltersResponse.data.data?.availableFilters || [];
    
    console.log('✅ Available filters count:', availableFilters.length);
    
    if (availableFilters.length === 0) {
      console.log('❌ No available filters to assign');
      return;
    }
    
    // Select relevant filters for Men's clothing
    const relevantFilterNames = [
      'Color',
      'Brand Cloths',
      'Material',
      'Fit Type Cloths',
      'Season Cloths',
      'Style Cloths',
      'Price Range'
    ];
    
    const filtersToAssign = availableFilters.filter(filter => 
      relevantFilterNames.some(name => 
        filter.name.toLowerCase().includes(name.toLowerCase()) ||
        filter.displayName.toLowerCase().includes(name.toLowerCase())
      )
    );
    
    console.log('\n🎯 Step 3: Assigning relevant filters...');
    console.log('Filters to assign:', filtersToAssign.length);
    
    let assignedCount = 0;
    
    for (let i = 0; i < filtersToAssign.length; i++) {
      const filter = filtersToAssign[i];
      
      try {
        console.log(`\n📌 Assigning filter ${i + 1}/${filtersToAssign.length}: ${filter.displayName} (${filter.name})`);
        
        console.log('  Filter details:', {
          id: filter._id,
          name: filter.name,
          displayName: filter.displayName
        });
        
        const assignmentData = {
          filterId: filter._id,
          isRequired: false, // Make optional by default
          sortOrder: i + 1
        };
        
        const assignResponse = await api.post(
          `/admin/categories/${categoryId}/filter-assignments`,
          assignmentData
        );
        
        if (assignResponse.data.success) {
          console.log('  ✅ Successfully assigned');
          assignedCount++;
        } else {
          console.log('  ❌ Assignment failed:', assignResponse.data.message);
        }
        
      } catch (error) {
        console.log('  ❌ Assignment error:', error.response?.data?.message || error.message);
      }
    }
    
    console.log(`\n🎉 Assignment complete! Successfully assigned ${assignedCount}/${filtersToAssign.length} filters`);
    
    // Verify assignments
    console.log('\n🔍 Step 4: Verifying assignments...');
    const verifyResponse = await api.get(`/admin/categories/${categoryId}/filter-assignments`);
    const assignments = verifyResponse.data.data?.assignments || [];
    
    console.log('✅ Verification complete:');
    console.log('  Total assigned filters:', assignments.length);
    
    if (assignments.length > 0) {
      console.log('\n📋 Assigned filters:');
      assignments.forEach((assignment, index) => {
        console.log(`  ${index + 1}. ${assignment.filter?.displayName || assignment.filter?.name} (Required: ${assignment.isRequired})`);
      });
      
      console.log('\n🎯 SUCCESS! Filters are now assigned to the Men category.');
      console.log('💡 You can now test the product form - filters should appear when selecting the Men category!');
    }
    
  } catch (error) {
    console.error('❌ Script Error:');
    console.error('  Status:', error.response?.status);
    console.error('  Data:', error.response?.data);
    console.error('  Message:', error.message);
  }
}

// Run the script
assignFiltersToMenCategory();