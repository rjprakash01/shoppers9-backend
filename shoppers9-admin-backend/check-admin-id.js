const mongoose = require('mongoose');

async function checkAdminId() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    console.log('🔗 Connected to MongoDB');
    
    const adminsCollection = mongoose.connection.db.collection('admins');
    
    // Find the test admin
    const testAdmin = await adminsCollection.findOne({ 
      email: 'admin@shoppers9.com' 
    });
    
    if (testAdmin) {
      console.log('✅ Test Admin found:');
      console.log('   ID:', testAdmin._id.toString());
      console.log('   Email:', testAdmin.email);
      console.log('   Role:', testAdmin.role);
      console.log('   Active:', testAdmin.isActive);
    } else {
      console.log('❌ Test Admin not found');
      
      // List all admins
      const allAdmins = await adminsCollection.find({}).toArray();
      console.log('\n📋 All admins in database:');
      allAdmins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email} (${admin._id}) - ${admin.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkAdminId();