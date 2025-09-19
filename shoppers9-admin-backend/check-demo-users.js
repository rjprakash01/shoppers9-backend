const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkDemoUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/shoppers9-admin');
    console.log('✓ Connected to database');
    
    // Find all admin users
    const adminUsers = await User.find({
      primaryRole: { $in: ['super_admin', 'admin', 'sub_admin'] }
    }).select('firstName lastName email primaryRole isActive');
    
    console.log('\n--- Demo Admin Users ---');
    adminUsers.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.firstName} ${user.lastName}`);
      console.log(`Role: ${user.primaryRole}`);
      console.log(`Active: ${user.isActive}`);
      console.log('---');
    });
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkDemoUsers();