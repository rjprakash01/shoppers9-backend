const mongoose = require('mongoose');
require('dotenv').config();

async function checkVishnu() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Define a simple user schema
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', UserSchema);
    
    // Search for Vishnu
    const users = await User.find({
      $or: [
        { firstName: /vishnu/i },
        { lastName: /dutta/i },
        { email: /vishnu/i },
        { name: /vishnu/i }
      ]
    });
    
    console.log(`Found ${users.length} users matching Vishnu/Dutta:`);
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User Details:`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Name: ${user.firstName || ''} ${user.lastName || ''} ${user.name || ''}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Phone: ${user.phone || 'N/A'}`);
      console.log(`   Primary Role: ${user.primaryRole || 'N/A'}`);
      console.log(`   Roles: ${user.roles || 'N/A'}`);
      console.log(`   Is Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Last Login: ${user.lastLogin || 'Never'}`);
    });
    
    if (users.length === 0) {
      console.log('\nNo users found matching Vishnu/Dutta');
      
      // Check all admin users
      const adminUsers = await User.find({
        $or: [
          { primaryRole: 'admin' },
          { primaryRole: 'super_admin' },
          { primaryRole: 'sub_admin' }
        ]
      }).limit(10);
      
      console.log(`\nFound ${adminUsers.length} admin users:`);
      adminUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName || ''} ${user.lastName || ''} - ${user.email} - ${user.primaryRole}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkVishnu();