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

async function fixAdminRoles() {
  try {
    await connectDB();
    console.log('🔄 Fixing Admin Roles...');
    
    const adminsCollection = mongoose.connection.db.collection('admins');
    
    // Get all admins
    const admins = await adminsCollection.find({}).toArray();
    console.log(`\n📋 Found ${admins.length} admin users`);
    
    for (const admin of admins) {
      console.log(`\n👤 Admin: ${admin.email}`);
      console.log(`   Current role: ${admin.role}`);
      console.log(`   Current primaryRole: ${admin.primaryRole || 'NOT SET'}`);
      
      // Set primaryRole to match role if not set
      if (!admin.primaryRole && admin.role) {
        const result = await adminsCollection.updateOne(
          { _id: admin._id },
          { $set: { primaryRole: admin.role } }
        );
        
        console.log(`   ✅ Updated primaryRole to: ${admin.role}`);
      } else if (admin.primaryRole) {
        console.log(`   ✅ primaryRole already set correctly`);
      } else {
        console.log(`   ⚠️  No role information available`);
      }
    }
    
    // Verify the changes
    console.log('\n🔍 Verifying Admin Roles After Fix:');
    const updatedAdmins = await adminsCollection.find({}).toArray();
    
    updatedAdmins.forEach(admin => {
      console.log(`   ${admin.email}:`);
      console.log(`     role: ${admin.role}`);
      console.log(`     primaryRole: ${admin.primaryRole}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔚 Admin role fix completed');
  }
}

fixAdminRoles();