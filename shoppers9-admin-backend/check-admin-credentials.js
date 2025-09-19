const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function checkAdminCredentials() {
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
      console.log('   Password Hash:', testAdmin.password ? 'Present' : 'Missing');
      
      // Test common passwords
      const commonPasswords = ['admin123', 'password', '123456', 'admin', 'test123'];
      
      if (testAdmin.password) {
        console.log('\n🔐 Testing common passwords:');
        for (const pwd of commonPasswords) {
          try {
            const isMatch = await bcrypt.compare(pwd, testAdmin.password);
            console.log(`   ${pwd}: ${isMatch ? '✅ MATCH' : '❌ No match'}`);
            if (isMatch) {
              console.log(`\n🎉 Correct password found: ${pwd}`);
              break;
            }
          } catch (err) {
            console.log(`   ${pwd}: ❌ Error testing`);
          }
        }
      }
      
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

checkAdminCredentials();