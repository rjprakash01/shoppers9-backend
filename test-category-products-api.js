const axios = require('axios');

// Test the category products API endpoint
async function testCategoryProductsAPI() {
  try {
    console.log('🔍 Testing category products API...');
    
    // First, let's get the category tree to find the Jeans category ID
    console.log('\n1. Getting category tree...');
    const categoriesResponse = await axios.get('http://localhost:4000/api/categories/tree');
    
    console.log('Categories response:', JSON.stringify(categoriesResponse.data, null, 2));
    
    let categories;
    if (categoriesResponse.data.success && categoriesResponse.data.data) {
      categories = categoriesResponse.data.data.categories || categoriesResponse.data.data;
    } else if (Array.isArray(categoriesResponse.data)) {
      categories = categoriesResponse.data;
    } else {
      categories = categoriesResponse.data;
    }
    
    console.log('Parsed categories:', categories);
    
    if (categories && Array.isArray(categories)) {
      // Find Men > Clothing > Jeans
      const menCategory = categories.find(cat => cat.name === 'Men');
      if (menCategory) {
        console.log('✅ Found Men category:', menCategory.id);
        
        const clothingCategory = menCategory.children.find(cat => cat.name === 'Clothing');
        if (clothingCategory) {
          console.log('✅ Found Clothing category:', clothingCategory.id);
          
          const jeansCategory = clothingCategory.children.find(cat => cat.name === 'Jeans');
          if (jeansCategory) {
            console.log('✅ Found Jeans category:', jeansCategory.id);
            
            // Now test the products API with this category ID
            console.log('\n2. Testing products API with Jeans category...');
            
            try {
              const productsResponse = await axios.get(`http://localhost:4000/api/admin/products/category/${jeansCategory.id}?page=1&limit=12`);
              
              console.log('✅ Products API Response Status:', productsResponse.status);
              console.log('✅ Products API Response Data:', JSON.stringify(productsResponse.data, null, 2));
              
              if (productsResponse.data.success && productsResponse.data.data.products) {
                console.log(`\n📊 Found ${productsResponse.data.data.products.length} products in Jeans category`);
                productsResponse.data.data.products.forEach((product, index) => {
                  console.log(`   ${index + 1}. ${product.name} (Category: ${product.category?.name || 'N/A'})`);
                });
              } else {
                console.log('❌ No products found or unexpected response format');
              }
              
            } catch (apiError) {
              console.error('❌ Error calling products API:', apiError.response?.status, apiError.response?.data || apiError.message);
            }
            
          } else {
            console.log('❌ Jeans category not found');
          }
        } else {
          console.log('❌ Clothing category not found');
        }
      } else {
        console.log('❌ Men category not found');
      }
    } else {
      console.log('❌ Failed to get categories:', categoriesResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCategoryProductsAPI();