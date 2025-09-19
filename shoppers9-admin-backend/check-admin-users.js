const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9';

async function checkAdminUsers() {
  try {
    console.log('=== CHECKING ADMIN USERS ===');
    console.log('Connecting to MongoDB:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
    
    // Get the Admin model
    const Admin = mongoose.model('Admin', new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      password: String,
      role: String,
      permissions: [String],
      isActive: Boolean,
      createdAt: Date,
      updatedAt: Date
    }));
    
    // Find all admin users
    const admins = await Admin.find({}).select('+password');
    console.log(`\nFound ${admins.length} admin users:`);
    
    for (let i = 0; i < admins.length; i++) {
      const admin = admins[i];
      console.log(`\n--- Admin ${i + 1} ---`);
      console.log('ID:', admin._id);
      console.log('Name:', `${admin.firstName} ${admin.lastName}`);
      console.log('Email:', admin.email);
      console.log('Phone:', admin.phone);
      console.log('Role:', admin.role);
      console.log('Is Active:', admin.isActive);
      console.log('Permissions:', admin.permissions);
      console.log('Password Hash:', admin.password ? 'Present' : 'Missing');
      
      // Test common passwords
      if (admin.password) {
        const testPasswords = ['password123', 'admin123', 'test123', '123456', 'password'];
        console.log('Testing passwords...');
        
        for (const testPassword of testPasswords) {
          try {
            const isMatch = await bcrypt.compare(testPassword, admin.password);
            if (isMatch) {
              console.log(`✅ Password '${testPassword}' matches!`);
              break;
            }
          } catch (error) {
            console.log(`❌ Error testing password '${testPassword}':`, error.message);
          }
        }
      }
    }
    
    // Also check if there are any users in the regular User collection that might be admins
    try {
      const User = mongoose.model('User', new mongoose.Schema({
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        password: String,
        role: String,
        isActive: Boolean
      }));
      
      const adminUsers = await User.find({ role: 'admin' }).select('+password');
      if (adminUsers.length > 0) {
        console.log(`\n=== ADMIN USERS IN USER COLLECTION ===`);
        console.log(`Found ${adminUsers.length} admin users in User collection:`);
        
        for (let i = 0; i < adminUsers.length; i++) {
          const user = adminUsers[i];
          console.log(`\n--- User Admin ${i + 1} ---`);
          console.log('ID:', user._id);
          console.log('Name:', `${user.firstName} ${user.lastName}`);
          console.log('Email:', user.email);
          console.log('Phone:', user.phone);
          console.log('Role:', user.role);
          console.log('Is Active:', user.isActive);
        }
      }
    } catch (error) {
      console.log('No User collection or error accessing it:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the check
checkAdminUsers();