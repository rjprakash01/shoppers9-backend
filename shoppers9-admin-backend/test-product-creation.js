const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testProductCreation() {
  try {
    // First, login to get admin token
    console.log('Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5002/api/auth/admin/login', {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token received');
    
    // Create a simple product
    console.log('Creating product...');
    const productData = {
      name: 'Test Product ' + Date.now(),
      description: 'This is a test product',
      price: '99.99',
      originalPrice: '149.99',
      category: '507f1f77bcf86cd799439011', // dummy category ID
      subCategory: 'Test Subcategory',
      brand: 'Test Brand',
      stock: '10',
      isActive: 'true',
      isFeatured: 'false',
      specifications: '{}',
      images: 'https://via.placeholder.com/300x300.png'
    };
    
    const response = await axios.post('http://localhost:5002/api/admin/products', productData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Product created successfully!');
    console.log('Product ID:', response.data.data._id);
    console.log('Product Name:', response.data.data.name);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testProductCreation();