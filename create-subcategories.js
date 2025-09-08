const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:5001';

async function getToken() {
  // Try to get existing token from fresh_token.json
  try {
    if (fs.existsSync('shoppers9-admin-backend/fresh_token.json')) {
      const data = JSON.parse(fs.readFileSync('shoppers9-admin-backend/fresh_token.json', 'utf8'));
      if (data && data.data && data.data.accessToken) {
        return data.data.accessToken;
      }
    }
  } catch {}

  // Try admin_token.json
  try {
    if (fs.existsSync('admin_token.json')) {
      const data = JSON.parse(fs.readFileSync('admin_token.json', 'utf8'));
      if (data && (data.token || data.accessToken)) {
        return data.token || data.accessToken;
      }
    }
  } catch {}

  throw new Error('No valid token found');
}

async function createSubcategories() {
  try {
    const token = await getToken();
    const headers = { Authorization: `Bearer ${token}` };

    // Get existing categories
    const categoriesResp = await axios.get(`${BASE_URL}/api/admin/categories`, { headers });
    const categories = categoriesResp.data?.data?.categories || [];
    
    // Find MEN category
    const menCategory = categories.find(cat => cat.name === 'MEN');
    if (!menCategory) {
      console.log('MEN category not found');
      return;
    }

    console.log('Found MEN category:', menCategory.name, 'ID:', menCategory.id);

    // Create subcategories for MEN
    const subcategories = [
      {
        name: 'CLOTHING',
        description: 'Men\'s clothing items',
        slug: 'clothing',
        parentCategory: menCategory.id,
        level: 2,
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'FOOTWEAR',
        description: 'Men\'s footwear',
        slug: 'footwear',
        parentCategory: menCategory.id,
        level: 2,
        isActive: true,
        sortOrder: 2
      }
    ];

    for (const subcategory of subcategories) {
      try {
        console.log(`Creating subcategory: ${subcategory.name}`);
        const response = await axios.post(`${BASE_URL}/api/admin/categories`, subcategory, { headers });
        console.log(`✅ Created: ${subcategory.name}`, response.data?.data?.id);
      } catch (error) {
        console.error(`❌ Failed to create ${subcategory.name}:`, error.response?.data?.message || error.message);
      }
    }

    // Create subcategories for WOMEN
    const womenCategory = categories.find(cat => cat.name === 'WOMEN');
    if (womenCategory) {
      const womenSubcategories = [
        {
          name: 'WESTERN WEAR',
          description: 'Women\'s western wear',
          slug: 'western-wear',
          parentCategory: womenCategory.id,
          level: 2,
          isActive: true,
          sortOrder: 1
        },
        {
          name: 'ETHNIC WEAR',
          description: 'Women\'s ethnic wear',
          slug: 'ethnic-wear',
          parentCategory: womenCategory.id,
          level: 2,
          isActive: true,
          sortOrder: 2
        }
      ];

      for (const subcategory of womenSubcategories) {
        try {
          console.log(`Creating subcategory: ${subcategory.name}`);
          const response = await axios.post(`${BASE_URL}/api/admin/categories`, subcategory, { headers });
          console.log(`✅ Created: ${subcategory.name}`, response.data?.data?.id);
        } catch (error) {
          console.error(`❌ Failed to create ${subcategory.name}:`, error.response?.data?.message || error.message);
        }
      }
    }

    console.log('\n🎉 Subcategories creation completed!');
    console.log('Now the navigation should show dropdowns when hovering over MEN and WOMEN categories.');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

createSubcategories();