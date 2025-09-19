const mongoose = require('mongoose');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoppers9', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function checkAdminAuth() {
  try {
    await connectDB();
    console.log('🔍 Checking Admin Authentication...');
    
    const adminsCollection = mongoose.connection.db.collection('admins');
    
    // Get all admins with their authentication fields
    const admins = await adminsCollection.find({}).toArray();
    console.log(`\n📋 Found ${admins.length} admin users`);
    
    admins.forEach((admin, index) => {
      console.log(`\n👤 Admin ${index + 1}:`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Phone: ${admin.phone}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Primary Role: ${admin.primaryRole}`);
      console.log(`   Has Password: ${admin.password ? 'YES' : 'NO'}`);
      console.log(`   Password Hash: ${admin.password ? admin.password.substring(0, 20) + '...' : 'NONE'}`);
      console.log(`   Auth Method: ${admin.authMethod || 'NOT SET'}`);
      console.log(`   Is Verified: ${admin.isVerified}`);
      console.log(`   Created At: ${admin.createdAt}`);
    });
    
    // Check if there are any other authentication-related collections
    console.log('\n🔍 Checking other collections for authentication...');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    const authRelatedCollections = collections.filter(col => 
      col.name.includes('auth') || 
      col.name.includes('token') || 
      col.name.includes('session')
    );
    
    console.log('Auth-related collections:', authRelatedCollections.map(c => c.name));
    
    // Check if there's a sessions collection
    try {
      const sessionsCollection = mongoose.connection.db.collection('sessions');
      const sessions = await sessionsCollection.find({}).limit(5).toArray();
      console.log(`\n📱 Found ${sessions.length} sessions`);
      if (sessions.length > 0) {
        console.log('Sample session:', sessions[0]);
      }
    } catch (error) {
      console.log('No sessions collection found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔚 Auth check completed');
  }
}

checkAdminAuth();