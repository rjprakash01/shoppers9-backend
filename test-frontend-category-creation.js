const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Category Schema (for direct DB operations)
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  slug: { type: String, unique: true },
  image: String,
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  level: { type: Number, required: true, min: 1, max: 3 },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Category = mongoose.model('Category', categorySchema);

// Get auth token
const getAuthToken = async () => {
  try {
    // Try to create super admin (ignore if already exists)
    try {
      await axios.post('http://localhost:4000/api/init-super-admin');
    } catch (initError) {
      // Ignore if super admin already exists
      if (initError.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️  Super admin already exists, proceeding with login...');
      } else {
        throw initError;
      }
    }
    
    // Login with correct super admin credentials
     const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
       email: 'superadmin@shoppers9.com',
       password: 'superadmin123'
     });
     
     console.log('✅ Login successful');
    
    return loginResponse.data.token;
  } catch (error) {
    console.error('Auth error:', error.response?.data || error.message);
    throw error;
  }
};

// Test function
const testFrontendCategoryCreation = async () => {
  await connectDB();
  
  console.log('=== TESTING FRONTEND CATEGORY CREATION ISSUE ===\n');
  
  try {
    // Get auth token
    console.log('🔐 Getting authentication token...');
    const token = await getAuthToken();
    console.log('✅ Token obtained\n');
    
    // Clear existing categories
    console.log('🧹 Clearing existing categories...');
    await Category.deleteMany({});
    console.log('✅ Categories cleared\n');
    
    // Step 1: Create Level 1 category via API (simulating frontend)
    console.log('🧪 Test 1: Creating Level 1 Category via API...');
    const level1Response = await axios.post('http://localhost:4000/api/admin/categories', {
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      parentCategory: '', // Empty string as frontend sends
      level: 1, // Frontend explicitly sends level
      isActive: true,
      sortOrder: 1
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const level1Category = level1Response.data.data;
    console.log('✅ Level 1 Category Created:');
    console.log(`   ID: ${level1Category._id}`);
    console.log(`   Name: ${level1Category.name}`);
    console.log(`   Level: ${level1Category.level}`);
    console.log(`   Parent: ${level1Category.parentCategory || 'null'}\n`);
    
    // Step 2: Create Level 2 category via API (simulating frontend)
    console.log('🧪 Test 2: Creating Level 2 Category via API (simulating frontend form)...');
    
    // This simulates exactly what the frontend sends
    const frontendFormData = {
      name: 'Smartphones',
      description: 'Mobile phones and smartphones',
      parentCategory: level1Category._id, // Parent ID
      level: 2, // Frontend calculates and sends level 2
      isActive: true,
      sortOrder: 1
    };
    
    console.log('📤 Frontend form data being sent:');
    console.log(JSON.stringify(frontendFormData, null, 2));
    
    const level2Response = await axios.post('http://localhost:4000/api/admin/categories', frontendFormData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const level2Category = level2Response.data.data;
    console.log('\n✅ Level 2 Category Created:');
    console.log(`   ID: ${level2Category._id}`);
    console.log(`   Name: ${level2Category.name}`);
    console.log(`   Level: ${level2Category.level}`);
    console.log(`   Parent: ${level2Category.parentCategory}`);
    
    // Step 3: Verify in database
    console.log('\n🔍 Verifying categories in database...');
    const allCategories = await Category.find({}).populate('parentCategory', 'name level');
    
    console.log('\n📋 All Categories in Database:');
    allCategories.forEach(cat => {
      const parentInfo = cat.parentCategory ? 
        `${cat.parentCategory.name} (Level ${cat.parentCategory.level})` : 
        'None';
      console.log(`   - ${cat.name} (Level: ${cat.level}, Parent: ${parentInfo})`);
    });
    
    // Check if the issue exists
    const level2CategoryFromDB = allCategories.find(cat => cat.name === 'Smartphones');
    if (level2CategoryFromDB) {
      if (level2CategoryFromDB.level === 1) {
        console.log('\n❌ ISSUE CONFIRMED: Level 2 category was saved as Level 1!');
        console.log('   This confirms the bug reported by the user.');
      } else if (level2CategoryFromDB.level === 2) {
        console.log('\n✅ NO ISSUE: Level 2 category was correctly saved as Level 2.');
        console.log('   The hierarchy logic is working correctly.');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the test
testFrontendCategoryCreation().catch(console.error);