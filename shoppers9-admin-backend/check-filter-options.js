const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');

async function checkFilterOptions() {
  try {
    // Login as super admin to get proper token
    console.log('Logging in as super admin...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/admin/login', {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });

    const token = loginResponse.data.data.accessToken;
    console.log('Super admin login successful');

    // First, let's get all filters to see their structure
    console.log('\nGetting all filters...');
    const filtersResponse = await axios.get('http://localhost:5001/api/admin/filters', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Filters Response:');
    console.log(JSON.stringify(filtersResponse.data, null, 2));

    // Check if we have any filters and get their options
    if (filtersResponse.data.data && filtersResponse.data.data.length > 0) {
      const firstFilter = filtersResponse.data.data[0];
      console.log(`\nChecking options for filter: ${firstFilter.name}`);
      
      try {
        const filterOptionsResponse = await axios.get(`http://localhost:5001/api/admin/filters/${firstFilter.id}/options`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Filter Options Response:');
        console.log(JSON.stringify(filterOptionsResponse.data, null, 2));
      } catch (error) {
        console.log('Error getting filter options:', error.response?.data || error.message);
      }
    }

    // Create sample filter options if needed
    console.log('\nCreating sample filter options if needed...');
    if (filtersResponse.data.data && filtersResponse.data.data.length > 0) {
      const colorFilter = filtersResponse.data.data.find(f => f.name === 'color');
      const sizeFilter = filtersResponse.data.data.find(f => f.name === 'size');
      
      if (colorFilter) {
        console.log('Creating color options...');
        const colorOptions = [
          { filter: colorFilter.id, value: 'red', displayValue: 'Red', colorCode: '#FF0000' },
          { filter: colorFilter.id, value: 'blue', displayValue: 'Blue', colorCode: '#0000FF' },
          { filter: colorFilter.id, value: 'green', displayValue: 'Green', colorCode: '#00FF00' },
          { filter: colorFilter.id, value: 'black', displayValue: 'Black', colorCode: '#000000' },
          { filter: colorFilter.id, value: 'white', displayValue: 'White', colorCode: '#FFFFFF' }
        ];

        for (const option of colorOptions) {
          try {
            const createResponse = await axios.post('http://localhost:5001/api/admin/filter-options', option, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            console.log(`Created color option: ${option.displayValue}`);
          } catch (error) {
            console.log(`Error creating color option ${option.displayValue}:`, error.response?.data || error.message);
          }
        }
      }

      if (sizeFilter) {
        console.log('Creating size options...');
        const sizeOptions = [
          { filter: sizeFilter.id, value: 'xs', displayValue: 'XS' },
          { filter: sizeFilter.id, value: 's', displayValue: 'S' },
          { filter: sizeFilter.id, value: 'm', displayValue: 'M' },
          { filter: sizeFilter.id, value: 'l', displayValue: 'L' },
          { filter: sizeFilter.id, value: 'xl', displayValue: 'XL' },
          { filter: sizeFilter.id, value: 'xxl', displayValue: 'XXL' }
        ];

        for (const option of sizeOptions) {
          try {
            const createResponse = await axios.post('http://localhost:5001/api/admin/filter-options', option, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            console.log(`Created size option: ${option.displayValue}`);
          } catch (error) {
            console.log(`Error creating size option ${option.displayValue}:`, error.response?.data || error.message);
          }
        }
      }
    }

    // Now test the category filter endpoint again
    console.log('\nTesting category filter endpoint with T-Shirts category...');
    const categoryFilterResponse = await axios.get('http://localhost:5001/api/admin/categories/68b606f476e0c80c06f6ac4f/filters', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Category Filter Response:');
    console.log(JSON.stringify(categoryFilterResponse.data, null, 2));

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkFilterOptions();