import fetch from 'node-fetch';

// Check specific products mentioned by user for multiple colors
async function checkSpecificProducts() {
  try {
    console.log('🔍 Checking specific products for multiple colors...');
    
    // Products to check based on user mention
    const productNames = ['xgxgn', 'xgmxfg', 'dress03', 'dress', 'top', 'shirt', 'jean', 'sandal'];
    
    // Fetch all products
    const response = await fetch('http://localhost:5000/api/products?limit=50');
    const data = await response.json();
    console.log('📡 API Response structure:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
    
    let products = [];
    if (data.data && data.data.products) {
      products = data.data.products;
    } else if (data.products) {
      products = data.products;
    } else if (Array.isArray(data)) {
      products = data;
    } else {
      console.log('❌ Unexpected API response structure');
      return;
    }
    
    console.log(`📦 Found ${products.length} products to search through`);
    
    let foundProducts = [];
    
    // Search for products with names containing our search terms
    for (const product of products) {
      const productName = product.name.toLowerCase();
      
      // Check if product name contains any of our search terms
      const matchesSearch = productNames.some(searchTerm => 
        productName.includes(searchTerm.toLowerCase())
      );
      
      if (matchesSearch) {
        // Get detailed product info
        const productResponse = await fetch(`http://localhost:5000/api/products/${product._id}`);
        const productData = await productResponse.json();
        const detailedProduct = productData.data.product;
        
        foundProducts.push(detailedProduct);
        
        console.log(`\n🎯 FOUND MATCHING PRODUCT: ${detailedProduct.name}`);
        console.log(`📋 Product ID: ${detailedProduct._id}`);
        
        // Check available colors
        const colorCount = detailedProduct.availableColors?.length || 0;
        console.log(`🎨 Available Colors: ${colorCount}`);
        
        if (detailedProduct.availableColors && detailedProduct.availableColors.length > 0) {
          console.log('\n📸 AVAILABLE COLORS ANALYSIS:');
          detailedProduct.availableColors.forEach((color, index) => {
            console.log(`  Color ${index + 1}: ${color.name} (${color.code})`);
            console.log(`    - Images: ${color.images ? color.images.length : 0}`);
            if (color.images && color.images.length > 0) {
              console.log(`    - Image URLs:`);
              color.images.forEach((img, imgIndex) => {
                console.log(`      ${imgIndex + 1}. ${img}`);
              });
            }
          });
        }
        
        // Check variants
        const variantColors = new Set();
        if (detailedProduct.variants) {
          detailedProduct.variants.forEach(variant => {
            if (variant.color) variantColors.add(variant.color);
          });
        }
        
        console.log(`🔧 Variant Colors: ${variantColors.size} (${Array.from(variantColors).join(', ')})`);
        
        if (detailedProduct.variants && detailedProduct.variants.length > 0) {
          console.log('\n🔧 VARIANTS ANALYSIS:');
          detailedProduct.variants.forEach((variant, index) => {
            console.log(`  Variant ${index + 1}: ${variant.color} - Size ${variant.size}`);
            console.log(`    - Price: ₹${variant.price}`);
            console.log(`    - Images: ${variant.images ? variant.images.length : 0}`);
            if (variant.images && variant.images.length > 0) {
              console.log(`    - Image URLs:`);
              variant.images.forEach((img, imgIndex) => {
                console.log(`      ${imgIndex + 1}. ${img}`);
              });
            }
          });
        }
        
        // Check main product images
        console.log('\n📷 MAIN PRODUCT IMAGES:');
        console.log(`  - Count: ${detailedProduct.images ? detailedProduct.images.length : 0}`);
        if (detailedProduct.images && detailedProduct.images.length > 0) {
          console.log(`  - URLs:`);
          detailedProduct.images.forEach((img, imgIndex) => {
            console.log(`    ${imgIndex + 1}. ${img}`);
          });
        }
        
        console.log('\n' + '='.repeat(80));
      }
    }
    
    console.log(`\n🎯 SEARCH SUMMARY:`);
    console.log(`📊 Total products searched: ${products.length}`);
    console.log(`🎨 Matching products found: ${foundProducts.length}`);
    
    if (foundProducts.length === 0) {
      console.log('\n⚠️ No products found with the specified names. Let me list all product names:');
      
      console.log('\n📋 ALL PRODUCT NAMES:');
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} (ID: ${product._id})`);
      });
    } else {
      // Analyze which products have multiple colors
      const multiColorProducts = foundProducts.filter(product => {
        const colorCount = product.availableColors?.length || 0;
        const variantColors = new Set();
        if (product.variants) {
          product.variants.forEach(variant => {
            if (variant.color) variantColors.add(variant.color);
          });
        }
        return colorCount > 1 || variantColors.size > 1;
      });
      
      console.log(`\n🌈 MULTI-COLOR PRODUCTS: ${multiColorProducts.length}`);
      multiColorProducts.forEach(product => {
        console.log(`  - ${product.name} (${product.availableColors?.length || 0} colors)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSpecificProducts();