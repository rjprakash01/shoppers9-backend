require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define User schema (the one used by auth)
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  password: String,
  primaryRole: String,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
});

const User = mongoose.model('User', userSchema);

async function checkUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    console.log('\nFinding all users...');
    const users = await User.find({}).select('+password');
    
    console.log(`Found ${users.length} users:`);
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\nUser ${i + 1}:`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.primaryRole}`);
      console.log(`  Active: ${user.isActive}`);
      console.log(`  Password Hash: ${user.password ? 'Present' : 'Missing'}`);
      
      // Test common passwords for admin-like emails
      if (user.email && user.email.includes('admin') && user.password) {
        const testPasswords = ['admin123', 'password123', 'test123', '123456', 'password'];
        console.log('  Testing passwords...');
        
        for (const testPassword of testPasswords) {
          try {
            const isMatch = await bcrypt.compare(testPassword, user.password);
            if (isMatch) {
              console.log(`  ✅ Password '${testPassword}' matches!`);
              break;
            }
          } catch (error) {
            console.log(`  ❌ Error testing password '${testPassword}':`, error.message);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkUsers();