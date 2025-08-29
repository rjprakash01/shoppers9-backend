const http = require('http');

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

function createCategory(categoryData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(categoryData);
    
    const options = {
      hostname: 'localhost',
      port: 5002,
      path: '/api/categories',
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
        console.log(`Created category "${categoryData.name}" - Status: ${res.statusCode}`);
        if (res.statusCode === 201 || res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log('Response:', response);
            resolve(response);
          } catch (e) {
            console.log('Raw response:', data);
            resolve(data);
          }
        } else {
          console.log('Error response:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error(`Problem with request: ${e.message}`);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function addAllCategories() {
  console.log('Adding sample categories...');
  
  for (const category of categories) {
    try {
      await createCategory(category);
      console.log(`✓ Successfully added ${category.name}`);
    } catch (error) {
      console.error(`✗ Failed to add ${category.name}:`, error.message);
    }
  }
  
  console.log('\nDone adding categories!');
}

addAllCategories();