const mongoose = require('mongoose');
const axios = require('axios');

// Test the fixed filter options endpoint
async function testFilterOptionsEndpoint() {
  try {
    console.log('Testing filter options endpoint...');
    
    // Test the endpoint that was previously returning 500 errors
    const response = await axios.get('http://localhost:5000/api/admin/products/category/676d85d3ad0ebd2037c0d442/available-filter-options');
    
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Number of filters:', response.data.data.length);
    
    // Show details of each filter and its options
    response.data.data.forEach((categoryFilter, index) => {
      console.log(`\nFilter ${index + 1}:`);
      console.log('  Name:', categoryFilter.filter.name);
      console.log('  Display Name:', categoryFilter.filter.displayName);
      console.log('  Options Count:', categoryFilter.filter.options.length);
      
      if (categoryFilter.filter.options.length > 0) {
        console.log('  Options:');
        categoryFilter.filter.options.forEach(option => {
          console.log(`    - ${option.displayValue} (${option.value})`);
        });
      } else {
        console.log('  No options available');
      }
    });
    
    console.log('\n✅ Filter options endpoint is working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing endpoint:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Error:', error.response?.data?.error);
  }
}

testFilterOptionsEndpoint();