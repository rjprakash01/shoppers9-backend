const axios = require('axios');
require('dotenv').config();

const createMockShirtProducts = async () => {
  try {
    console.log('🔍 Creating 5 mock shirt products...');
    
    // Step 1: Login to get auth token
    console.log('\n1. Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:4000/api/auth/admin/login', {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123'
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Get available filters for Shirts category
    const shirtsCategory = '68b7158df34225e75042e05f';
    console.log('\n2. Getting available filters for Shirts category...');
    
    const filtersResponse = await axios.get(`http://localhost:4000/api/admin/categories/${shirtsCategory}/filters`, { headers });
    console.log('✅ Filters retrieved:', filtersResponse.data.data?.filters?.length || 0);
    
    const availableFilters = filtersResponse.data.data?.filters || [];
    
    // Step 3: Get all filter options
    const allFiltersResponse = await axios.get('http://localhost:4000/api/admin/filters', { headers });
    const allFilters = allFiltersResponse.data.data?.filters || allFiltersResponse.data.data?.data || [];
    
    // Create a map of filter options
    const filterOptionsMap = {};
    for (const filter of allFilters) {
      if (filter.options && filter.options.length > 0) {
        filterOptionsMap[filter._id] = filter.options;
      }
    }
    
    // Step 4: Define mock product data
    const mockProducts = [
      {
        name: 'Classic Cotton Formal Shirt',
        description: 'A timeless formal shirt made from premium cotton fabric. Perfect for office wear and formal occasions.',
        brand: 'StyleCraft',
        images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500'],
        variants: [{
          color: 'White',
          colorCode: '#FFFFFF',
          sizes: [{
            size: 'M',
            price: 1299,
            originalPrice: 1599,
            discount: 19,
            stock: 25
          }],
          images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500']
        }],
        specifications: {
          fabric: 'Cotton',
          fit: 'Regular Fit',
          washCare: 'Machine Wash'
        },
        tags: ['formal', 'cotton', 'office wear']
      },
      {
        name: 'Casual Denim Shirt',
        description: 'Comfortable casual denim shirt perfect for weekend outings and casual meetings.',
        brand: 'UrbanStyle',
        images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500'],
        variants: [{
          color: 'Blue',
          colorCode: '#0066CC',
          sizes: [{
            size: 'L',
            price: 999,
            originalPrice: 1299,
            discount: 23,
            stock: 30
          }],
          images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500']
        }],
        specifications: {
          fabric: 'Denim',
          fit: 'Slim Fit',
          washCare: 'Machine Wash'
        },
        tags: ['casual', 'denim', 'weekend']
      },
      {
        name: 'Linen Summer Shirt',
        description: 'Breathable linen shirt ideal for summer weather. Lightweight and comfortable for all-day wear.',
        brand: 'SummerBreeze',
        images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500'],
        variants: [{
          color: 'Beige',
          colorCode: '#F5F5DC',
          sizes: [{
            size: 'XL',
            price: 1499,
            originalPrice: 1899,
            discount: 21,
            stock: 20
          }],
          images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500']
        }],
        specifications: {
          fabric: 'Linen',
          fit: 'Relaxed Fit',
          washCare: 'Hand Wash'
        },
        tags: ['summer', 'linen', 'breathable']
      },
      {
        name: 'Checkered Casual Shirt',
        description: 'Trendy checkered pattern shirt perfect for casual outings and social gatherings.',
        brand: 'TrendSetters',
        images: ['https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=500'],
        variants: [{
          color: 'Red',
          colorCode: '#FF0000',
          sizes: [{
            size: 'S',
            price: 899,
            originalPrice: 1199,
            discount: 25,
            stock: 35
          }],
          images: ['https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=500']
        }],
        specifications: {
          fabric: 'Cotton Blend',
          fit: 'Slim Fit',
          washCare: 'Machine Wash'
        },
        tags: ['checkered', 'casual', 'trendy']
      },
      {
        name: 'Premium Silk Dress Shirt',
        description: 'Luxurious silk dress shirt for special occasions and formal events. Elegant and sophisticated.',
        brand: 'LuxuryLine',
        images: ['https://images.unsplash.com/photo-1564859228273-274232fdb516?w=500'],
        variants: [{
          color: 'Black',
          colorCode: '#000000',
          sizes: [{
            size: 'M',
            price: 2499,
            originalPrice: 2999,
            discount: 17,
            stock: 15
          }],
          images: ['https://images.unsplash.com/photo-1564859228273-274232fdb516?w=500']
        }],
        specifications: {
          fabric: 'Silk',
          fit: 'Regular Fit',
          washCare: 'Dry Clean Only'
        },
        tags: ['silk', 'luxury', 'formal']
      }
    ];
    
    // Step 5: Create products with random filter values
    console.log('\n3. Creating products...');
    
    for (let i = 0; i < mockProducts.length; i++) {
      const productData = mockProducts[i];
      
      try {
        // Add category information
        productData.category = shirtsCategory;
        productData.subCategory = shirtsCategory;
        productData.isActive = true;
        
        // Generate random filter values
        const filterValues = [];
        for (const categoryFilter of availableFilters) {
          const filterId = categoryFilter.filter._id || categoryFilter.filter;
          const filterOptions = filterOptionsMap[filterId];
          
          if (filterOptions && filterOptions.length > 0) {
            // Pick a random option
            const randomOption = filterOptions[Math.floor(Math.random() * filterOptions.length)];
            filterValues.push({
              filterId: filterId,
              filterOptionId: randomOption._id
            });
          }
        }
        
        productData.filterValues = filterValues;
        
        console.log(`\n📦 Creating product ${i + 1}: ${productData.name}`);
        console.log(`   Filters applied: ${filterValues.length}`);
        
        const response = await axios.post('http://localhost:4000/api/admin/products', productData, { headers });
        
        if (response.data.success) {
          console.log(`   ✅ Created successfully - ID: ${response.data.data._id}`);
        } else {
          console.log(`   ❌ Failed: ${response.data.message}`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error creating product ${i + 1}:`, {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      }
    }
    
    console.log('\n🎉 Mock product creation completed!');
    
  } catch (error) {
    console.error('❌ Error in main process:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
};

createMockShirtProducts();