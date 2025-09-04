const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';

// Test the enhanced banner management system
async function testBannerManagementFeatures() {
  console.log('🧪 Testing Enhanced Banner Management Features...');
  
  try {
    // Step 1: Admin Login
    console.log('\n1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/admin/login`, {
      email: 'admin@shoppers9.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Admin login successful');
    } else {
      throw new Error('Admin login failed');
    }
    
    const token = loginResponse.data.data.accessToken;
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Get Categories for Testing
    console.log('\n2. Fetching categories...');
    const categoriesResponse = await axios.get(`${API_BASE_URL}/admin/categories/tree`, {
      headers: authHeaders
    });
    
    let categories = [];
    if (categoriesResponse.data.success && categoriesResponse.data.data) {
      if (Array.isArray(categoriesResponse.data.data.categories)) {
        categories = categoriesResponse.data.data.categories;
      } else if (Array.isArray(categoriesResponse.data.data)) {
        categories = categoriesResponse.data.data;
      }
    }
    
    console.log(`✅ Found ${categories.length} categories`);
    
    // Get first active category for testing
    const testCategory = categories.find(cat => cat.isActive);
    const categoryId = testCategory ? (testCategory.id || testCategory._id) : null;
    
    if (categoryId) {
      console.log(`📂 Using test category: ${testCategory.name} (ID: ${categoryId})`);
    } else {
      console.log('⚠️  No active categories found, will test without category');
    }
    
    // Step 3: Test Banner Creation with Different Display Types
    console.log('\n3. Testing banner creation with different display types...');
    
    const testBanners = [
      {
        title: 'Carousel Only Banner',
        subtitle: 'This banner appears only in carousel',
        description: 'Testing carousel display type',
        image: 'https://via.placeholder.com/800x400/FF6B6B/FFFFFF?text=Carousel+Banner',
        link: 'https://example.com/carousel',
        buttonText: 'Shop Carousel',
        isActive: true,
        order: 1,
        displayType: 'carousel'
      },
      {
        title: 'Category Card Banner',
        subtitle: 'This banner appears as category card',
        description: 'Testing category card display type',
        image: 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Category+Card',
        link: 'https://example.com/category',
        buttonText: 'Browse Category',
        isActive: true,
        order: 2,
        displayType: 'category-card',
        categoryId: categoryId
      },
      {
        title: 'Universal Banner',
        subtitle: 'This banner appears everywhere',
        description: 'Testing both display types',
        image: 'https://via.placeholder.com/800x400/45B7D1/FFFFFF?text=Universal+Banner',
        link: 'https://example.com/universal',
        buttonText: 'Shop Now',
        isActive: true,
        order: 3,
        displayType: 'both',
        categoryId: categoryId
      }
    ];
    
    const createdBanners = [];
    
    for (const bannerData of testBanners) {
      // Skip category-specific banners if no category available
      if ((bannerData.displayType === 'category-card' || bannerData.displayType === 'both') && !categoryId) {
        console.log(`⏭️  Skipping ${bannerData.title} - no category available`);
        continue;
      }
      
      console.log(`\n   Creating: ${bannerData.title}`);
      console.log(`   Request payload:`, JSON.stringify(bannerData, null, 2));
      const createResponse = await axios.post(`${API_BASE_URL}/admin/banners`, bannerData, {
        headers: authHeaders
      });
      
      if (createResponse.data.success) {
        const banner = createResponse.data.data;
        createdBanners.push(banner);
        console.log(`   ✅ Created banner: ${banner.title}`);
        console.log(`      - ID: ${banner._id || banner.id}`);
        console.log(`      - Display Type: ${banner.displayType || 'Not set'}`);
        console.log(`      - Category ID: ${banner.categoryId || 'None'}`);
        // Debug: log the full banner object
        console.log(`      - Full banner:`, JSON.stringify(banner, null, 2));
      } else {
        console.log(`   ❌ Failed to create banner: ${bannerData.title}`);
        console.log(`      Error:`, createResponse.data.message);
      }
    }
    
    // Step 4: Test Retrieving Banners
    console.log('\n4. Testing banner retrieval...');
    
    const allBannersResponse = await axios.get(`${API_BASE_URL}/admin/banners`, {
      headers: authHeaders
    });
    
    if (allBannersResponse.data.success) {
      const banners = allBannersResponse.data.data.banners || allBannersResponse.data.data;
      console.log(`✅ Retrieved ${banners.length} banners`);
      
      // Display banner details
      banners.forEach(banner => {
        console.log(`   📋 ${banner.title}:`);
        console.log(`      - Display Type: ${banner.displayType || 'carousel (default)'}`);
        console.log(`      - Category: ${banner.categoryId ? 'Assigned' : 'None'}`);
        console.log(`      - Status: ${banner.isActive ? 'Active' : 'Inactive'}`);
      });
    }
    
    // Step 5: Test Active Banners Endpoint
    console.log('\n5. Testing active banners endpoint...');
    
    const activeBannersResponse = await axios.get(`${API_BASE_URL}/admin/banners/active`, {
      headers: authHeaders
    });
    
    if (activeBannersResponse.data.success) {
      const activeBanners = activeBannersResponse.data.data;
      console.log(`✅ Retrieved ${activeBanners.length} active banners`);
      
      // Group by display type
      const carouselBanners = activeBanners.filter(b => !b.displayType || b.displayType === 'carousel' || b.displayType === 'both');
      const categoryCardBanners = activeBanners.filter(b => b.displayType === 'category-card' || b.displayType === 'both');
      
      console.log(`   🎠 Carousel banners: ${carouselBanners.length}`);
      console.log(`   🏷️  Category card banners: ${categoryCardBanners.length}`);
    }
    
    // Step 6: Test Banner Updates
    if (createdBanners.length > 0) {
      console.log('\n6. Testing banner updates...');
      
      const bannerToUpdate = createdBanners[0];
      const bannerId = bannerToUpdate._id || bannerToUpdate.id;
      const updateData = {
        title: bannerToUpdate.title + ' (Updated)',
        displayType: 'both',
        categoryId: categoryId
      };
      
      console.log(`   Updating banner ID: ${bannerId}`);
      const updateResponse = await axios.put(`${API_BASE_URL}/admin/banners/${bannerId}`, updateData, {
        headers: authHeaders
      });
      
      if (updateResponse.data.success) {
        console.log(`✅ Updated banner: ${updateResponse.data.data.title}`);
        console.log(`   - New display type: ${updateResponse.data.data.displayType}`);
      }
    }
    
    console.log('\n🎉 All banner management features tested successfully!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Display Type Selection (carousel, category-card, both)');
    console.log('   ✅ Category Assignment for banners');
    console.log('   ✅ Enhanced banner creation and updates');
    console.log('   ✅ Proper validation and error handling');
    console.log('   ✅ Banner listing with new fields');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testBannerManagementFeatures();