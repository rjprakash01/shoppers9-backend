const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
let authToken = '';

// Login function
async function login() {
  try {
    const testCredentials = {
      email: 'superadmin@shoppers9.com',
      password: 'SuperAdmin@123'
    };
    
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, testCredentials);
    
    if (response.data.success && (response.data.token || response.data.data?.accessToken)) {
      authToken = response.data.token || response.data.data.accessToken;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data || error.message);
    return false;
  }
}

// Helper function for authenticated requests
async function authRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: { Authorization: `Bearer ${authToken}` }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.log(`❌ Error ${method} ${endpoint}:`, error.response?.data || error.message);
    return null;
  }
}

// Get categories and filters
async function getCategoriesAndFilters() {
  console.log('\n📁 Fetching categories and filters...');
  
  const categoriesResponse = await authRequest('GET', '/admin/categories?limit=100');
  const filtersResponse = await authRequest('GET', '/admin/filters?limit=100');
  
  const categories = categoriesResponse?.data?.categories || [];
  const filters = filtersResponse?.data?.filters || [];
  
  console.log(`✅ Found ${categories.length} categories and ${filters.length} filters`);
  
  return { categories, filters };
}

// Create filter assignments
async function createFilterAssignments() {
  console.log('\n🔧 Creating filter assignments...');
  
  const { categories, filters } = await getCategoriesAndFilters();
  
  if (categories.length === 0 || filters.length === 0) {
    console.log('❌ No categories or filters found');
    return;
  }
  
  // Find T-SHIRT category (which had available filters)
  const tshirtCategory = categories.find(cat => cat.name === 'T-SHIRT');
  const menCategory = categories.find(cat => cat.name === 'Men');
  const clothingCategories = categories.filter(cat => cat.name === 'CLOTHING');
  
  console.log('\n🎯 Target categories:');
  console.log('   - T-SHIRT:', tshirtCategory ? `Found (ID: ${tshirtCategory.id})` : 'Not found');
  console.log('   - Men:', menCategory ? `Found (ID: ${menCategory.id})` : 'Not found');
  console.log('   - CLOTHING categories:', clothingCategories.length);
  
  // Get first few filters to assign
  const filtersToAssign = filters.slice(0, 3);
  console.log('\n🏷️  Filters to assign:');
  filtersToAssign.forEach(filter => {
    console.log(`   - ${filter.name} (${filter.displayName}) - ID: ${filter.id}`);
  });
  
  // Assign filters to T-SHIRT category
  if (tshirtCategory && filtersToAssign.length > 0) {
    console.log('\n🔗 Assigning filters to T-SHIRT category...');
    
    for (const filter of filtersToAssign) {
      const assignmentData = {
        filterId: filter.id,
        isRequired: false,
        sortOrder: 1
      };
      
      console.log(`   Assigning ${filter.name} to T-SHIRT...`);
      const result = await authRequest('POST', `/admin/categories/${tshirtCategory.id}/assign-filter`, assignmentData);
      
      if (result && result.success) {
        console.log(`   ✅ Successfully assigned ${filter.name}`);
      } else {
        console.log(`   ❌ Failed to assign ${filter.name}:`, result);
      }
    }
  }
  
  // Assign filters to Men category
  if (menCategory && filtersToAssign.length > 0) {
    console.log('\n🔗 Assigning filters to Men category...');
    
    for (const filter of filtersToAssign.slice(0, 2)) { // Assign first 2 filters
      const assignmentData = {
        filterId: filter.id,
        isRequired: true,
        sortOrder: 1
      };
      
      console.log(`   Assigning ${filter.name} to Men...`);
      const result = await authRequest('POST', `/admin/categories/${menCategory.id}/assign-filter`, assignmentData);
      
      if (result && result.success) {
        console.log(`   ✅ Successfully assigned ${filter.name}`);
      } else {
        console.log(`   ❌ Failed to assign ${filter.name}:`, result);
      }
    }
  }
  
  // Assign one filter to first CLOTHING category
  if (clothingCategories.length > 0 && filtersToAssign.length > 0) {
    const clothingCategory = clothingCategories[0];
    const filter = filtersToAssign[0];
    
    console.log('\n🔗 Assigning filter to CLOTHING category...');
    
    const assignmentData = {
      filterId: filter.id,
      isRequired: false,
      sortOrder: 1
    };
    
    console.log(`   Assigning ${filter.name} to ${clothingCategory.name}...`);
    const result = await authRequest('POST', `/admin/categories/${clothingCategory.id}/assign-filter`, assignmentData);
    
    if (result && result.success) {
      console.log(`   ✅ Successfully assigned ${filter.name}`);
    } else {
      console.log(`   ❌ Failed to assign ${filter.name}:`, result);
    }
  }
}

// Verify assignments
async function verifyAssignments() {
  console.log('\n🔍 Verifying filter assignments...');
  
  const { categories } = await getCategoriesAndFilters();
  
  const testCategories = categories.filter(cat => 
    ['T-SHIRT', 'Men', 'CLOTHING'].includes(cat.name)
  ).slice(0, 3);
  
  for (const category of testCategories) {
    console.log(`\n📋 ${category.name} (${category.id}):`);
    
    // Check available filters
    const availableResponse = await authRequest('GET', `/admin/categories/${category.id}/available-filters`);
    const availableCount = availableResponse?.data?.availableFilters?.length || 0;
    console.log(`   - Available filters: ${availableCount}`);
    
    // Check assigned filters
    const assignedResponse = await authRequest('GET', `/admin/categories/${category.id}/filter-assignments`);
    const assignedCount = assignedResponse?.data?.assignments?.length || 0;
    console.log(`   - Assigned filters: ${assignedCount}`);
    
    if (assignedCount > 0) {
      console.log(`   - Assigned filter details:`);
      assignedResponse.data.assignments.forEach((assignment, index) => {
        console.log(`     ${index + 1}. ${assignment.filter.name} (Required: ${assignment.isRequired})`);
      });
    }
  }
}

// Main function
async function main() {
  console.log('🚀 === CREATING FILTER ASSIGNMENTS ===\n');
  
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Login failed, stopping');
    return;
  }
  
  await createFilterAssignments();
  await verifyAssignments();
  
  console.log('\n✅ === FILTER ASSIGNMENT CREATION COMPLETE ===');
}

main().catch(console.error);