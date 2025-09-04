const axios = require('axios');

async function testFrontendAuth() {
  try {
    console.log('🔐 Testing banner endpoints and authentication...');
    
    // Step 1: Login
    console.log('\n1. Attempting admin login...');
    const loginResponse = await axios.post('http://localhost:4000/api/auth/admin/login', {
      email: 'admin@shoppers9.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.accessToken;
    const user = loginResponse.data.data.user;
    console.log('✅ Login successful');
    console.log('User:', user.name, '- Role:', user.role);
    
    // Step 2: Test banner endpoints
    console.log('\n2. Testing banner endpoints...');
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Get all banners
    const bannersResponse = await axios.get('http://localhost:4000/api/admin/banners', {
      headers: authHeaders
    });
    
    console.log('✅ GET /api/admin/banners - Status:', bannersResponse.status);
    console.log('Banners found:', bannersResponse.data.data.banners.length);
    
    // Get active banners
    const activeBannersResponse = await axios.get('http://localhost:4000/api/admin/banners/active', {
      headers: authHeaders
    });
    
    console.log('✅ GET /api/admin/banners/active - Status:', activeBannersResponse.status);
    console.log('Active banners:', activeBannersResponse.data.data.length);
    
    // Step 3: Create a test banner
    console.log('\n3. Creating a test banner...');
    
    const testBanner = {
      title: 'Welcome to Shoppers9',
      subtitle: 'Best deals on electronics',
      description: 'Discover amazing products at unbeatable prices',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
      link: '/products',
      buttonText: 'Shop Now',
      isActive: true,
      order: 1,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const createResponse = await axios.post('http://localhost:4000/api/admin/banners', testBanner, {
      headers: authHeaders
    });
    
    console.log('✅ POST /api/admin/banners - Status:', createResponse.status);
    console.log('Create response:', JSON.stringify(createResponse.data, null, 2));
    
    const bannerId = createResponse.data.data?._id || createResponse.data.data?.id;
    console.log('Created banner ID:', bannerId);
    
    if (!bannerId) {
      console.log('❌ No banner ID returned, skipping status toggle test');
      return;
    }
    
    // Step 4: Test banner status toggle
    console.log('\n4. Testing banner status toggle...');
    
    const toggleResponse = await axios.put(`http://localhost:4000/api/admin/banners/${bannerId}/status`, {
      isActive: false
    }, {
      headers: authHeaders
    });
    
    console.log('✅ PUT /api/admin/banners/:id/status - Status:', toggleResponse.status);
    console.log('Banner status updated to:', toggleResponse.data.data.isActive);
    
    // Step 5: Get updated banner list
    console.log('\n5. Verifying banner creation...');
    const updatedBannersResponse = await axios.get('http://localhost:4000/api/admin/banners', {
      headers: authHeaders
    });
    
    console.log('✅ Updated banner count:', updatedBannersResponse.data.data.banners.length);
    
    console.log('\n🎉 All banner endpoints are working correctly!');
    console.log('\n📋 Summary:');
    console.log('- Authentication: ✅ Working');
    console.log('- Get banners: ✅ Working');
    console.log('- Get active banners: ✅ Working');
    console.log('- Create banner: ✅ Working');
    console.log('- Update banner status: ✅ Working');
    
    console.log('\n🔗 Frontend should now work at: http://localhost:5174');
    console.log('📝 Login credentials: admin@shoppers9.com / admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      console.log('\n💡 This suggests an authentication issue.');
      console.log('Make sure to log in to the admin frontend first.');
    }
  }
}

testFrontendAuth();