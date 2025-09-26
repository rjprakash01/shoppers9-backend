const mongoose = require('mongoose');

const checkUsers = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoppers9-admin');
    console.log('✅ Connected to MongoDB');
    
    const User = mongoose.model('User', new mongoose.Schema({}, {strict: false}));
    const users = await User.find({primaryRole: {$in: ['super_admin', 'admin']}});
    
    console.log('\n📋 Admin users found:');
    users.forEach(user => {
      console.log(`- ID: ${user._id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.primaryRole}`);
      console.log(`  Active: ${user.isActive}`);
      console.log('');
    });
    
    if (users.length === 0) {
      console.log('❌ No admin users found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkUsers();