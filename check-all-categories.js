const axios = require('axios');
const fs = require('fs');

// Read admin token
let token;
try {
  const tokenData = JSON.parse(fs.readFileSync('./shoppers9-admin-backend/admin_token.json', 'utf8'));
  token = tokenData.accessToken || tokenData.token;
} catch (error) {
  console.error('Error reading token:', error.message);
  process.exit(1);
}

if (!token) {
  console.error('No token found');
  process.exit(1);
}

const baseURL = 'http://localhost:5001';

async function checkAllCategories() {
  try {
    console.log('=== Checking All Categories ===\n');
    
    // Get all categories (not just tree)
    console.log('Fetching all categories...');
    const response = await axios.get(`${baseURL}/api/admin/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const categories = response.data.data?.categories || response.data.data || response.data;
    console.log(`Total categories found: ${categories.length}\n`);
    
    // Group by level
    const byLevel = { 1: [], 2: [], 3: [] };
    
    categories.forEach(cat => {
      const level = cat.level || 1;
      if (byLevel[level]) {
        byLevel[level].push(cat);
      }
    });
    
    console.log('\n🔍 Raw category data sample:');
    if (categories.length > 0) {
      console.log(JSON.stringify(categories[0], null, 2));
    }
    
    console.log('📊 Categories by Level:');
    console.log(`Level 1 (Main): ${byLevel[1].length}`);
    byLevel[1].forEach(cat => {
      console.log(`  - ${cat.name} (${cat.id || cat._id})`);
    });
    
    console.log(`\nLevel 2 (Sub): ${byLevel[2].length}`);
    byLevel[2].forEach(cat => {
      console.log(`  - ${cat.name} (${cat.id || cat._id}) -> Parent: ${cat.parentCategory}`);
    });
    
    console.log(`\nLevel 3 (Sub-Sub): ${byLevel[3].length}`);
    byLevel[3].forEach(cat => {
      console.log(`  - ${cat.name} (${cat.id || cat._id}) -> Parent: ${cat.parentCategory}`);
    });
    
    if (byLevel[3].length > 0) {
      console.log('\n🎉 Level 3 categories found! Testing filter API...');
      
      // Test filter API with first level 3 category
      const testCategory = byLevel[3][0];
      const categoryId = testCategory.id || testCategory._id;
      console.log(`\nTesting filters for: ${testCategory.name} (${categoryId})`);
      
      try {
        const filtersResponse = await axios.get(`${baseURL}/api/admin/categories/${categoryId}/filters`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const filters = filtersResponse.data.data || filtersResponse.data;
        console.log(`✅ Filter API works! Found ${filters.length} filters for this category`);
        
        if (filters.length > 0) {
          console.log('\nAvailable filters:');
          filters.forEach(filter => {
            console.log(`  - ${filter.name} (${filter.type})`);
          });
        } else {
          console.log('\n⚠️  No filters assigned to this category yet.');
          console.log('You can create filters in the admin panel and assign them to level 3 categories.');
        }
        
      } catch (filterError) {
        console.log(`❌ Filter API error: ${filterError.response?.data?.message || filterError.message}`);
      }
      
    } else {
      console.log('\n❌ No level 3 categories found!');
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data?.message || error.message);
  }
}

checkAllCategories();