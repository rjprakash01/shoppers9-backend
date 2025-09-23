const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkVishnuPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Define a simple user schema
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', UserSchema);
    
    // Find Vishnu's account
    const vishnu = await User.findOne({ email: 'prakash.jetender@gmail.com' });
    
    if (vishnu) {
      console.log('\n=== VISHNU ACCOUNT DETAILS ===');
      console.log('ID:', vishnu._id);
      console.log('Name:', vishnu.firstName, vishnu.lastName);
      console.log('Email:', vishnu.email);
      console.log('Phone:', vishnu.phone);
      console.log('Primary Role:', vishnu.primaryRole);
      console.log('Is Active:', vishnu.isActive);
      console.log('Password Hash:', vishnu.password ? 'EXISTS' : 'MISSING');
      console.log('Password Length:', vishnu.password ? vishnu.password.length : 'N/A');
      console.log('Last Login:', vishnu.lastLogin);
      
      // Test common passwords
      const testPasswords = ['admin123', 'Admin@123', 'password', 'admin', 'vishnu123', 'Vishnu@123'];
      
      console.log('\n=== PASSWORD TESTING ===');
      for (const testPassword of testPasswords) {
        try {
          const isMatch = await bcrypt.compare(testPassword, vishnu.password);
          console.log(`Password "${testPassword}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
          if (isMatch) {
            console.log(`\n🎉 CORRECT PASSWORD FOUND: "${testPassword}"`);
            break;
          }
        } catch (error) {
          console.log(`Password "${testPassword}": ❌ ERROR - ${error.message}`);
        }
      }
      
    } else {
      console.log('❌ Vishnu account not found with email: prakash.jetender@gmail.com');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkVishnuPassword();