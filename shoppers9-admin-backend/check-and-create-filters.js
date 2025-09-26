const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// MongoDB connection
const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'shoppers9-admin';
let db, client;

async function checkAndCreateFilters() {
  try {
    console.log('🔍 Checking and Creating Filters...');
    
    // Connect to MongoDB
    client = new MongoClient(mongoUrl);
    await client.connect();
    db = client.db(dbName);
    
    // Generate JWT token for super admin
    const token = jwt.sign(
      {
        id: '68ca49d2922b49ad4f20395e',
        email: 'superadmin@example.com',
        primaryRole: 'super_admin'
      },
      'your-super-secret-jwt-key-for-admin-backend',
      { expiresIn: '1h' }
    );
    
    // Check filters in database directly
    console.log('\n=== Checking Filters in Database ===');
    const filtersCollection = db.collection('filters');
    const dbFilters = await filtersCollection.find({}).toArray();
    console.log(`Found ${dbFilters.length} filters in database`);
    
    if (dbFilters.length > 0) {
      console.log('Existing filters:');
      dbFilters.forEach((filter, index) => {
        console.log(`  ${index + 1}. ${filter.name} (${filter.displayName}) - Type: ${filter.type}`);
      });
    }
    
    // Check via API
    console.log('\n=== Checking Filters via API ===');
    try {
      const apiResponse = await axios.get(
        'http://localhost:5001/api/admin/filters',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`API returned ${apiResponse.data.data?.length || 0} filters`);
      if (apiResponse.data.data?.length > 0) {
        console.log('API filters:');
        apiResponse.data.data.forEach((filter, index) => {
          console.log(`  ${index + 1}. ${filter.name} (${filter.displayName}) - Type: ${filter.type}`);
        });
      }
    } catch (apiError) {
      console.log('❌ API call failed:', apiError.response?.data?.message || apiError.message);
    }
    
    // If no filters exist, create some test filters
    if (dbFilters.length === 0) {
      console.log('\n=== Creating Test Filters ===');
      
      const testFilters = [
        {
          name: 'brand',
          displayName: 'Brand',
          type: 'select',
          dataType: 'string',
          description: 'Product brand filter',
          isActive: true,
          sortOrder: 1
        },
        {
          name: 'size',
          displayName: 'Size',
          type: 'select',
          dataType: 'string',
          description: 'Product size filter',
          isActive: true,
          sortOrder: 2
        },
        {
          name: 'color',
          displayName: 'Color',
          type: 'select',
          dataType: 'string',
          description: 'Product color filter',
          isActive: true,
          sortOrder: 3
        },
        {
          name: 'price_range',
          displayName: 'Price Range',
          type: 'range',
          dataType: 'number',
          description: 'Product price range filter',
          isActive: true,
          sortOrder: 4
        }
      ];
      
      for (const filterData of testFilters) {
        try {
          const createResponse = await axios.post(
            'http://localhost:5001/api/admin/filters',
            filterData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log(`✅ Created filter: ${filterData.name}`);
          console.log(`   ID: ${createResponse.data.data._id}`);
          
        } catch (createError) {
          console.log(`❌ Failed to create filter ${filterData.name}:`, createError.response?.data?.message || createError.message);
        }
      }
      
      // Verify creation
      console.log('\n=== Verifying Filter Creation ===');
      const verifyResponse = await axios.get(
        'http://localhost:5001/api/admin/filters',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`✅ Now have ${verifyResponse.data.data?.length || 0} filters in system`);
      
    } else {
      console.log('\n✅ Filters already exist in the system');
    }
    
    console.log('\n🎉 Filter check and creation completed!');
    
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

checkAndCreateFilters();