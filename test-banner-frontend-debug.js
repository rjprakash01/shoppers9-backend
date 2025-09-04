const axios = require('axios');

async function testBannerFrontendDebug() {
  console.log('🔍 Debugging Banner Frontend Issue...');
  
  try {
    // Test 1: Check if backend is accessible
    console.log('\n1. Testing backend health...');
    const healthRes = await axios.get('http://localhost:4000/health');
    console.log('✅ Backend health:', healthRes.data.message);
    
    // Test 2: Test admin login
    console.log('\n2. Testing admin login...');
    const loginRes = await axios.post('http://localhost:4000/api/auth/admin/login', {
      email: 'admin@shoppers9.com',
      password: 'admin123'
    });
    const token = loginRes.data.data.accessToken;
    console.log('✅ Admin login successful');
    console.log('   Token preview:', token.substring(0, 30) + '...');
    
    // Test 3: Test banner API with correct headers
    console.log('\n3. Testing banner API...');
    const bannersRes = await axios.get('http://localhost:4000/api/admin/banners', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Banner API response:');
    console.log('   Success:', bannersRes.data.success);
    console.log('   Message:', bannersRes.data.message);
    console.log('   Total banners:', bannersRes.data.data.pagination.total);
    console.log('   Banners in response:', bannersRes.data.data.banners.length);
    
    // Test 4: Check first banner structure
    if (bannersRes.data.data.banners.length > 0) {
      const firstBanner = bannersRes.data.data.banners[0];
      console.log('\n4. First banner structure:');
      console.log('   ID:', firstBanner.id);
      console.log('   Title:', firstBanner.title);
      console.log('   Display Type:', firstBanner.displayType || 'Not set');
      console.log('   Category ID:', firstBanner.categoryId || 'None');
      console.log('   Active:', firstBanner.isActive);
    }
    
    // Test 5: Test CORS and frontend URL
    console.log('\n5. Testing CORS configuration...');
    try {
      const corsTest = await axios.get('http://localhost:4000/api/admin/banners', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Origin': 'http://localhost:5173'
        }
      });
      console.log('✅ CORS test passed');
    } catch (corsError) {
      console.log('❌ CORS test failed:', corsError.message);
    }
    
    console.log('\n🎉 All backend tests passed! The issue might be in the frontend.');
    console.log('\n💡 Suggestions:');
    console.log('   1. Check browser console for JavaScript errors');
    console.log('   2. Verify localStorage has adminToken');
    console.log('   3. Check network tab for failed requests');
    console.log('   4. Ensure frontend is using correct API base URL');
    
  } catch (error) {
    console.log('\n❌ Error during testing:');
    console.log('   Message:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
}

testBannerFrontendDebug();