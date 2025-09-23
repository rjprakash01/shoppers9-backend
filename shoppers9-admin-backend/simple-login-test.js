const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function simpleLoginTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Create a simple user schema
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('TestUser', UserSchema, 'users'); // Use 'users' collection
    
    const email = 'prakash.jetender@gmail.com';
    const password = 'admin123';
    
    console.log('\n=== SIMPLE LOGIN TEST ===');
    console.log('Email:', email);
    console.log('Password:', password);
    
    // Step 1: Find user by email
    console.log('\n1. Finding user by email...');
    const user = await User.findOne({ 
      email: email.toLowerCase()
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log('   ID:', user._id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.firstName, user.lastName);
    console.log('   Role:', user.primaryRole);
    console.log('   Active:', user.isActive);
    console.log('   Password hash exists:', !!user.password);
    console.log('   Password hash:', user.password);
    
    // Step 2: Check if account is active
    console.log('\n2. Checking if account is active...');
    if (!user.isActive) {
      console.log('❌ Account is deactivated');
      return;
    }
    console.log('✅ Account is active');
    
    // Step 3: Verify password
    console.log('\n3. Verifying password...');
    console.log('   Testing password:', password);
    
    try {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('   bcrypt.compare result:', isPasswordValid);
      
      if (isPasswordValid) {
        console.log('\n🎉 PASSWORD IS CORRECT! Login should work.');
        
        // Test the actual API call simulation
        console.log('\n4. Simulating API response...');
        console.log('✅ Login would be successful with response:');
        console.log({
          success: true,
          message: 'Login successful',
          data: {
            accessToken: 'jwt-token-would-be-here',
            user: {
              id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone,
              primaryRole: user.primaryRole,
              isActive: user.isActive
            }
          }
        });
      } else {
        console.log('\n❌ PASSWORD IS INCORRECT');
        
        // Test other passwords
        console.log('\n🔍 Testing other possible passwords:');
        const testPasswords = ['Admin@123', 'password', 'admin', 'vishnu123', 'Vishnu@123', '123456', 'Wandoor@1991'];
        
        for (const testPwd of testPasswords) {
          const isValid = await bcrypt.compare(testPwd, user.password);
          console.log(`   "${testPwd}": ${isValid ? '✅ MATCH' : '❌ NO MATCH'}`);
          if (isValid) {
            console.log(`\n🎉 CORRECT PASSWORD FOUND: "${testPwd}"`);
            break;
          }
        }
      }
    } catch (bcryptError) {
      console.log('❌ bcrypt error:', bcryptError.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

simpleLoginTest();