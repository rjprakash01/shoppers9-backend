const http = require('http');

// Test health endpoint first
function testHealth() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'shoppers9-alb-268030346.us-east-1.elb.amazonaws.com',
      port: 3000,
      path: '/health',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Health Check:');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
        console.log('---');
        resolve();
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Test admin login endpoint
function testAdminLogin() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: 'admin@shoppers9.com',
      password: 'admin123'
    });

    const options = {
      hostname: 'shoppers9-alb-268030346.us-east-1.elb.amazonaws.com',
      port: 3000,
      path: '/api/auth/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        console.log('Admin Login Test:');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${responseData}`);
        resolve();
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Run tests
async function runTests() {
  try {
    await testHealth();
    await testAdminLogin();
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTests();