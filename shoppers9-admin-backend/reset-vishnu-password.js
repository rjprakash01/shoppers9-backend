require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define User schema (flexible)
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function resetVishnuPassword() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find Vishnu's user account
    const vishnu = await User.findOne({ email: 'prakash.jetender@gmail.com' });
    
    if (!vishnu) {
      console.log('❌ Vishnu user not found!');
      return;
    }
    
    console.log('✅ Found Vishnu user:', vishnu.email);
    console.log('Current name:', vishnu.firstName, vishnu.lastName);
    console.log('Current role:', vishnu.primaryRole);
    
    // Hash the new password
    const newPassword = 'admin123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the password
    vishnu.password = hashedPassword;
    vishnu.updatedAt = new Date();
    await vishnu.save();
    
    console.log(`\n🎉 Password for ${vishnu.email} has been reset to: ${newPassword}`);
    
    // Test the new password
    const isMatch = await bcrypt.compare(newPassword, vishnu.password);
    console.log('Password verification:', isMatch ? '✅ SUCCESS' : '❌ FAILED');
    
    if (isMatch) {
      console.log('\n✅ Vishnu can now login with:');
      console.log('Email: prakash.jetender@gmail.com');
      console.log('Password: admin123');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

resetVishnuPassword();