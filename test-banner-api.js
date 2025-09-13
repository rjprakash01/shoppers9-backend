const axios = require('axios');

// Test banner creation API with authentication
async function testBannerCreation() {
  const baseURL = 'http://localhost:5001';
  const bannerURL = `${baseURL}/api/admin/banners`;
  
  try {
    // Step 1: Create test admin
    console.log('🔧 Creating test admin...');
    await axios.post(`${baseURL}/api/create-test-admin`);
    console.log('✅ Test admin created/verified');
    
    // Step 2: Login to get token
    console.log('\n🔐 Logging in to get authentication token...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@shoppers9.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful, token obtained');
    
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // Test data for carousel banner
    const carouselBanner = {
      title: 'Test Carousel Banner',
      subtitle: 'Amazing Products Await',
      description: 'Discover our latest collection of premium products',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjNjY3ZWVhIi8+Cjx0ZXh0IHg9IjYwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5UZXN0IEJhbm5lcjwvdGV4dD4KPC9zdmc+',
      link: '/products',
      buttonText: 'Shop Now',
      displayType: 'carousel',
      isActive: true,
      order: 1
    };
    
    // Test data for price range banner
    const priceRangeBanner = {
      title: 'Test Price Range Banner',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZmY2YjM1Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5QcmljZSBSYW5nZTwvdGV4dD4KPC9zdmc+',
      displayType: 'price-range',
      priceRange: {
        label: 'Under ₹99',
        maxPrice: 99,
        color: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'
      },
      isActive: true,
      order: 2
    };
    
    // Step 3: Test carousel banner creation
    console.log('\n🎠 Testing Carousel Banner Creation...');
    try {
      const carouselResponse = await axios.post(bannerURL, carouselBanner, {
        headers: authHeaders,
        timeout: 10000
      });
      console.log('✅ Carousel Banner Created Successfully!');
      console.log('   Banner ID:', carouselResponse.data.data._id);
      console.log('   Title:', carouselResponse.data.data.title);
      console.log('   Display Type:', carouselResponse.data.data.displayType);
    } catch (error) {
      console.log('❌ Carousel Banner Creation Failed:');
      console.log('   Error:', error.response?.data || error.message);
    }
    
    // Step 4: Test price range banner creation
    console.log('\n💰 Testing Price Range Banner Creation...');
    try {
      const priceRangeResponse = await axios.post(bannerURL, priceRangeBanner, {
        headers: authHeaders,
        timeout: 10000
      });
      console.log('✅ Price Range Banner Created Successfully!');
      console.log('   Banner ID:', priceRangeResponse.data.data._id);
      console.log('   Title:', priceRangeResponse.data.data.title);
      console.log('   Display Type:', priceRangeResponse.data.data.displayType);
      console.log('   Price Range:', priceRangeResponse.data.data.priceRange);
    } catch (error) {
      console.log('❌ Price Range Banner Creation Failed:');
      console.log('   Error:', error.response?.data || error.message);
    }
    
    // Step 5: Test getting all banners
    console.log('\n📋 Testing Get All Banners...');
    try {
      const getAllResponse = await axios.get(bannerURL, {
        headers: authHeaders,
        timeout: 10000
      });
      console.log('✅ Get All Banners Success!');
      console.log('   Total Banners:', getAllResponse.data.data.pagination.total);
      console.log('   Banners on Page:', getAllResponse.data.data.banners.length);
      
      // Show banner details
      getAllResponse.data.data.banners.forEach((banner, index) => {
        console.log(`   ${index + 1}. ${banner.title} (${banner.displayType})`);
      });
    } catch (error) {
      console.log('❌ Get All Banners Failed:');
      console.log('   Error:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 Banner API testing completed!');
    
  } catch (error) {
    console.log('❌ Test Setup Failed:');
    console.log('   Error:', error.response?.data || error.message);
  }
}

testBannerCreation();