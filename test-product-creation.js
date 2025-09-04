const axios = require('axios');

// Test login and get valid token
async function login() {
  try {
    console.log('Logging in to get valid token...');
    
    const loginData = {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    };
    
    const response = await axios.post('http://localhost:5001/api/auth/admin/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful');
    console.log('Token received:', response.data.token ? 'Yes' : 'No');
    return response.data.token;
    
  } catch (error) {
    console.log('❌ Login failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
    return null;
  }
}

// Test product creation
async function testProductCreation(token) {
  try {
    console.log('Testing product creation...');
    
    const productData = {
      name: 'Test Product',
      description: 'Test Description',
      category: 'Electronics',
      price: 99.99,
      brand: 'TestBrand',
      stock: 10
    };
    
    const response = await axios.post('http://localhost:5001/api/admin/products', productData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Product created successfully:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error creating product:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Test health endpoint
async function testHealth() {
  try {
    const response = await axios.get('http://localhost:5001/health');
    console.log('✅ Health check passed:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
}

async function runTests() {
  await testHealth();
  console.log('\n---\n');
  
  const token = await login();
  if (token) {
    console.log('\n---\n');
    await testProductCreation(token);
  }
}

runTests();