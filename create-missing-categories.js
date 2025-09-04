const fs = require('fs');
const axios = require('axios');

// Read admin token (try multiple sources; fallback to runtime login later)
let token;
try {
  const tokenData = JSON.parse(fs.readFileSync('./shoppers9-admin-backend/admin_token.json', 'utf8'));
  token = tokenData.accessToken || tokenData.token;
} catch (e1) {
  try {
    const tokenData = JSON.parse(fs.readFileSync('./admin_login_token.json', 'utf8'));
    token = tokenData.accessToken || tokenData.token;
  } catch (e2) {
    token = null;
  }
}

const baseURL = 'http://localhost:5001';

// Category structure to create
const categoryStructure = {
  'Men': {
    'Clothing': ['T-Shirts', 'Shirts', 'Jeans', 'Trousers', 'Jackets'],
    'Footwear': ['Sneakers', 'Formal Shoes', 'Sandals', 'Boots'],
    'Accessories': ['Watches', 'Belts', 'Wallets', 'Sunglasses']
  },
  'Women': {
    'Clothing': ['Dresses', 'Tops', 'Jeans', 'Skirts', 'Jackets'],
    'Footwear': ['Heels', 'Flats', 'Sneakers', 'Sandals'],
    'Accessories': ['Handbags', 'Jewelry', 'Scarves', 'Sunglasses']
  },
  'Household': {
    'Kitchen': ['Cookware', 'Appliances', 'Utensils', 'Storage'],
    'Bedroom': ['Bedding', 'Pillows', 'Mattresses', 'Furniture'],
    'Living Room': ['Furniture', 'Decor', 'Lighting', 'Storage']
  }
};

async function createMissingCategories() {
  try {
    console.log('=== Creating Missing Category Structure ===\n');
    
    if (!token) {
      console.log('No admin token found locally. Attempting admin login...');
      try {
        const loginRes = await axios.post(`${baseURL}/api/auth/admin/login`, {
          email: 'admin@shoppers9.com',
          password: 'admin123'
        });
        token = loginRes.data?.data?.accessToken || loginRes.data?.accessToken;
        if (token) {
          try {
            fs.writeFileSync('./shoppers9-admin-backend/admin_token.json', JSON.stringify({ accessToken: token }, null, 2));
            console.log('Saved admin token to shoppers9-admin-backend/admin_token.json');
          } catch (werr) {
            console.log('Could not write admin token file:', werr.message);
          }
        }
      } catch (loginErr) {
        console.error('Admin login failed:', loginErr.response?.data?.message || loginErr.message);
        return;
      }
    }
    
    // 1. Get existing categories
    console.log('1. Fetching existing categories...');
    const categoriesResponse = await axios.get(`${baseURL}/api/categories/tree`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const existingCategories = categoriesResponse.data.data?.categories || categoriesResponse.data.data || categoriesResponse.data;
    console.log(`Found ${existingCategories.length} existing categories`);
    
    // Create a map of existing categories by name
    const existingCatMap = {};
    existingCategories.forEach(cat => {
      existingCatMap[cat.name] = cat;
    });
    
    // 2. Create level 2 and level 3 categories
    for (const [mainCatName, subCategories] of Object.entries(categoryStructure)) {
      let mainCategoryObj = existingCatMap[mainCatName];
      if (!mainCategoryObj) {
        console.log(`Main category '${mainCatName}' not found. Creating...`);
        try {
          const mainRes = await axios.post(`${baseURL}/api/admin/categories`, {
            name: mainCatName,
            description: `${mainCatName}`,
            level: 1,
            isActive: true
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          mainCategoryObj = mainRes.data?.data?.category || mainRes.data?.data || mainRes.data;
          console.log(`  ✅ Created main category: ${mainCatName} (${mainCategoryObj.id || mainCategoryObj._id})`);
          existingCatMap[mainCatName] = mainCategoryObj;
        } catch (err) {
          console.log(`  ❌ Failed to create main category '${mainCatName}': ${err.response?.data?.message || err.message}`);
          continue;
        }
      }
      
      console.log(`\n📁 Processing ${mainCatName} (${mainCategoryObj.id || mainCategoryObj._id})`);
      
      for (const [subCatName, subSubCategories] of Object.entries(subCategories)) {
        console.log(`  📂 Creating subcategory: ${subCatName}`);
        
        // Create level 2 category (subcategory)
        try {
          const subCatResponse = await axios.post(`${baseURL}/api/admin/categories`, {
            name: subCatName,
            description: `${subCatName} for ${mainCatName}`,
            parentCategory: (mainCategoryObj.id || mainCategoryObj._id),
            level: 2,
            isActive: true
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const subCategory = subCatResponse.data.data?.category || subCatResponse.data.data || subCatResponse.data;
          console.log(`    ✅ Created: ${subCatName} (${subCategory.id || subCategory._id})`);
          
          // Create level 3 categories (sub-subcategories)
          for (const subSubCatName of subSubCategories) {
            console.log(`    📄 Creating sub-subcategory: ${subSubCatName}`);
            
            try {
              const subSubCatResponse = await axios.post(`${baseURL}/api/admin/categories`, {
                name: subSubCatName,
                description: `${subSubCatName} in ${subCatName} for ${mainCatName}`,
                parentCategory: subCategory.id || subCategory._id,
                level: 3,
                isActive: true
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              const subSubCategory = subSubCatResponse.data.data?.category || subSubCatResponse.data.data || subSubCatResponse.data;
              console.log(`      ✅ Created: ${subSubCatName} (${subSubCategory.id || subSubCategory._id})`);
              
            } catch (subSubError) {
              console.log(`      ❌ Failed to create ${subSubCatName}: ${subSubError.response?.data?.message || subSubError.message}`);
            }
          }
          
        } catch (subError) {
          console.log(`    ❌ Failed to create ${subCatName}: ${subError.response?.data?.message || subError.message}`);
        }
      }
    }
    
    console.log('\n🎉 Category creation completed!');
    console.log('\n📋 Summary:');
    console.log('- Level 1 categories: Main categories (Men, Women, Household)');
    console.log('- Level 2 categories: Subcategories (Clothing, Footwear, etc.)');
    console.log('- Level 3 categories: Sub-subcategories (T-Shirts, Sneakers, etc.)');
    console.log('\n✨ Filters can now be assigned to level 3 categories!');
    
  } catch (error) {
    console.error('Error:', error.response?.data?.message || error.message);
  }
}

createMissingCategories();