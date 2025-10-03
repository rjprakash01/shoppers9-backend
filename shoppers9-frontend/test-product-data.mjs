// Test script to fetch product data and understand structure
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

async function testProductData() {
  try {
    console.log('=== TESTING PRODUCT API ===');
    
    // First, try to get all products
    console.log('\n1. Fetching all products...');
    const allProductsResponse = await fetch(`${API_BASE_URL}/products`);
    const allProductsData = await allProductsResponse.json();
    
    console.log('All products response status:', allProductsResponse.status);
    console.log('All products response structure:', Object.keys(allProductsData));
    
    if (allProductsData.data && allProductsData.data.products) {
      const products = allProductsData.data.products;
      console.log('Number of products found:', products.length);
      
      if (products.length > 0) {
        const firstProduct = products[0];
        console.log('\n=== FIRST PRODUCT STRUCTURE ===');
        console.log('Product ID:', firstProduct._id);
        console.log('Product name:', firstProduct.name);
        console.log('Product images:', firstProduct.images);
        console.log('Available colors:', firstProduct.availableColors);
        console.log('Variants:', firstProduct.variants);
        
        // Test getting single product
        console.log('\n2. Fetching single product...');
        const singleProductResponse = await fetch(`${API_BASE_URL}/products/${firstProduct._id}`);
        const singleProductData = await singleProductResponse.json();
        
        console.log('Single product response status:', singleProductResponse.status);
        console.log('Single product response structure:', Object.keys(singleProductData));
        
        if (singleProductData.data && singleProductData.data.product) {
          const product = singleProductData.data.product;
          console.log('\n=== SINGLE PRODUCT DETAILS ===');
          console.log('Product ID:', product._id);
          console.log('Product name:', product.name);
          console.log('Product images (count):', product.images?.length || 0);
          console.log('Product images:', product.images);
          
          console.log('\n=== AVAILABLE COLORS ===');
          if (product.availableColors && product.availableColors.length > 0) {
            product.availableColors.forEach((color, index) => {
              console.log(`Color ${index + 1}:`, {
                name: color.name,
                code: color.code,
                images: color.images || 'No color-specific images'
              });
            });
          } else {
            console.log('No available colors found');
          }
          
          console.log('\n=== VARIANTS ===');
          if (product.variants && product.variants.length > 0) {
            product.variants.forEach((variant, index) => {
              console.log(`Variant ${index + 1}:`, {
                size: variant.size,
                color: variant.color,
                images: variant.images || 'No variant-specific images',
                stock: variant.stock
              });
            });
          } else {
            console.log('No variants found');
          }
        }
      } else {
        console.log('No products found in database');
      }
    } else {
      console.log('Unexpected response structure:', allProductsData);
    }
    
  } catch (error) {
    console.error('Error testing product data:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n❌ Backend server is not running on port 5000');
    }
  }
}

testProductData();