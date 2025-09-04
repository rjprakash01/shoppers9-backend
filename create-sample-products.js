const axios = require('axios');
const mongoose = require('mongoose');

async function createSampleProducts() {
  try {
    console.log('🔍 Creating sample products...');
    
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
    
    // Step 2: Get categories
    console.log('\n2. Getting categories...');
    const categoriesResponse = await axios.get('http://localhost:4000/api/admin/categories', { headers });
    const categories = categoriesResponse.data.data?.categories || categoriesResponse.data.data || [];
    console.log(`✅ Found ${categories.length} categories`);
    
    // Debug: Log first category structure
    if (categories.length > 0) {
      console.log('First category structure:', JSON.stringify(categories[0], null, 2));
    }
    
    // Find a suitable category (preferably level 3)
    const level3Categories = categories.filter(cat => cat.level === 3);
    const targetCategory = level3Categories.length > 0 ? level3Categories[0] : categories[0];
    
    if (!targetCategory) {
      console.error('❌ No categories found');
      return;
    }
    
    console.log(`Using category: ${targetCategory.name} (ID: ${targetCategory._id || targetCategory.id})`);
    
    // Step 3: Create sample products
    const sampleProducts = [
      {
        name: 'Classic Cotton T-Shirt',
        description: 'Comfortable cotton t-shirt perfect for everyday wear',
        brand: 'ComfortWear',
        variants: [{
          color: 'Blue',
          colorCode: '#0066CC',
          sizes: [{
            size: 'M',
            price: 899,
            originalPrice: 1199,
            discount: 25,
            stock: 50,
            sku: 'CTT-BLU-M-001'
          }],
          images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500']
        }],
        specifications: {
          fabric: 'Cotton',
          fit: 'Regular Fit',
          washCare: 'Machine Wash'
        },
        tags: ['cotton', 'casual', 'comfortable']
      },
      {
        name: 'Premium Dress Shirt',
        description: 'Elegant dress shirt for formal occasions',
        brand: 'FormalLine',
        variants: [{
          color: 'White',
          colorCode: '#FFFFFF',
          sizes: [{
            size: 'L',
            price: 1599,
            originalPrice: 1999,
            discount: 20,
            stock: 30,
            sku: 'PDS-WHT-L-001'
          }],
          images: ['https://images.unsplash.com/photo-1564859228273-274232fdb516?w=500']
        }],
        specifications: {
          fabric: 'Cotton Blend',
          fit: 'Slim Fit',
          washCare: 'Dry Clean'
        },
        tags: ['formal', 'premium', 'elegant']
      },
      {
        name: 'Casual Denim Jeans',
        description: 'Comfortable denim jeans for casual wear',
        brand: 'DenimCo',
        variants: [{
          color: 'Blue',
          colorCode: '#1E3A8A',
          sizes: [{
            size: '32',
            price: 2499,
            originalPrice: 2999,
            discount: 17,
            stock: 25,
            sku: 'CDJ-BLU-32-001'
          }],
          images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=500']
        }],
        specifications: {
          fabric: 'Denim',
          fit: 'Regular Fit',
          washCare: 'Machine Wash'
        },
        tags: ['denim', 'casual', 'comfortable']
      },
      {
        name: 'Sports Sneakers',
        description: 'Comfortable sports sneakers for active lifestyle',
        brand: 'SportMax',
        variants: [{
          color: 'Black',
          colorCode: '#000000',
          sizes: [{
            size: '9',
            price: 3999,
            originalPrice: 4999,
            discount: 20,
            stock: 40,
            sku: 'SS-BLK-9-001'
          }],
          images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500']
        }],
        specifications: {
          material: 'Synthetic',
          sole: 'Rubber',
          type: 'Sports'
        },
        tags: ['sports', 'sneakers', 'comfortable']
      },
      {
        name: 'Elegant Handbag',
        description: 'Stylish handbag perfect for any occasion',
        brand: 'LuxBags',
        variants: [{
          color: 'Brown',
          colorCode: '#8B4513',
          sizes: [{
            size: 'One Size',
            price: 4999,
            originalPrice: 6999,
            discount: 29,
            stock: 15,
            sku: 'EH-BRN-OS-001'
          }],
          images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500']
        }],
        specifications: {
          material: 'Leather',
          type: 'Handbag',
          closure: 'Zipper'
        },
        tags: ['handbag', 'elegant', 'leather']
      }
    ];
    
    console.log(`\n3. Creating ${sampleProducts.length} products...`);
    
    for (let i = 0; i < sampleProducts.length; i++) {
      const productTemplate = sampleProducts[i];
      
      try {
        // Extract first variant and size data for flat structure expected by controller
        const firstVariant = productTemplate.variants[0];
        const firstSize = firstVariant.sizes[0];
        
        const productData = {
          name: productTemplate.name,
          description: productTemplate.description,
          brand: productTemplate.brand,
          category: targetCategory._id || targetCategory.id,
          subCategory: targetCategory._id || targetCategory.id,
          // Flatten variant data to top level as expected by controller
          color: firstVariant.color,
          colorCode: firstVariant.colorCode,
          size: firstSize.size,
          price: firstSize.price,
          originalPrice: firstSize.originalPrice,
          stock: firstSize.stock,
          images: firstVariant.images,
          specifications: productTemplate.specifications,
          tags: productTemplate.tags,
          isActive: true
        };
        
        console.log(`\n📦 Creating product ${i + 1}: ${productData.name}`);
        
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
    
    console.log('\n🎉 Sample product creation completed!');
    
  } catch (error) {
    console.error('❌ Error in main process:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
};

createSampleProducts();