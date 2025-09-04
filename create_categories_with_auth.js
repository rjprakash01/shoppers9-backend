const http = require('http');

// First get admin token
function getAdminToken() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'admin@shoppers9.com',
      password: 'admin123'
    });
    
    const options = {
      hostname: 'localhost',
      port: 5002,
      path: '/api/auth/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          resolve(response.data.accessToken);
        } else {
          reject(new Error(`Admin login failed: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// Create category with auth token
function createCategory(categoryData, token) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(categoryData);
    
    const options = {
      hostname: 'localhost',
      port: 5002,
      path: '/api/admin/categories',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Created category "${categoryData.name}" - Status: ${res.statusCode}`);
        if (res.statusCode === 201 || res.statusCode === 200) {
          console.log(`✓ Successfully added ${categoryData.name}`);
          resolve(data);
        } else {
          console.log(`Error response: ${data}`);
          console.log(`✗ Failed to add ${categoryData.name}: HTTP ${res.statusCode}: ${data}`);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      console.log(`✗ Failed to add ${categoryData.name}: ${err.message}`);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

const categories = [
  {
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
    slug: 'electronics',
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'Clothing',
    description: 'Fashion and apparel',
    slug: 'clothing',
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'Home & Garden',
    description: 'Home improvement and garden supplies',
    slug: 'home-garden',
    isActive: true,
    sortOrder: 3
  }
];

async function addAllCategories() {
  try {
    console.log('Getting admin token...');
    const token = await getAdminToken();
    console.log('✓ Got admin token');
    
    console.log('Adding sample categories...');
    
    for (const category of categories) {
      try {
        await createCategory(category, token);
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to create category ${category.name}:`, error.message);
      }
    }
    
    console.log('\nDone adding categories!');
  } catch (error) {
    console.error('Failed to get admin token:', error.message);
  }
}

addAllCategories();