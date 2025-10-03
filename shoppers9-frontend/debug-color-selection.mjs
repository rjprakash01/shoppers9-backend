import fetch from 'node-fetch';

// Test the product data structure to understand variant pricing
async function testProductVariants() {
  try {
    console.log('🔍 Testing product variant data structure...');
    
    // Fetch all products
    const response = await fetch('http://localhost:5000/api/products');
    const data = await response.json();
    const products = data.data.products;
    
    console.log(`📦 Found ${products.length} products`);
    
    // Look for products with multiple colors or variants
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      // Get detailed product info
      const productResponse = await fetch(`http://localhost:5000/api/products/${product._id}`);
      const productData = await productResponse.json();
      const detailedProduct = productData.data.product;
      
      console.log(`\n🎯 PRODUCT ${i + 1}: ${detailedProduct.name}`);
      console.log('💰 Base Price:', detailedProduct.price);
      console.log('💰 Original Price:', detailedProduct.originalPrice);
      
      console.log('🎨 Available Colors:', detailedProduct.availableColors?.length || 0);
      if (detailedProduct.availableColors) {
        detailedProduct.availableColors.forEach((color, index) => {
          console.log(`  ${index + 1}. ${color.name} (${color.code})`);
        });
      }
      
      console.log('🔧 Variants:', detailedProduct.variants?.length || 0);
      if (detailedProduct.variants && detailedProduct.variants.length > 0) {
        detailedProduct.variants.forEach((variant, index) => {
          console.log(`  ${index + 1}. ${variant.color}-${variant.size}: ₹${variant.price} (Stock: ${variant.stock})`);
        });
        
        // Check if variants have different prices
        const uniquePrices = [...new Set(detailedProduct.variants.map(v => v.price))];
        console.log('🔢 Unique variant prices:', uniquePrices);
        
        if (uniquePrices.length > 1) {
          console.log('✅ THIS PRODUCT HAS VARIANTS WITH DIFFERENT PRICES!');
          console.log('🎯 This is a good test case for color-based pricing');
          break; // Found a good test case
        } else {
          console.log('⚠️ All variants have the same price:', uniquePrices[0]);
        }
      }
      
      // Stop after checking first few products
      if (i >= 3) break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testProductVariants();