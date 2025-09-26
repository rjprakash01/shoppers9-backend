const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/shoppers9', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkAdminUsers() {
  try {
    console.log('🔧 Connecting to database...');
    
    // Define User schema (simplified)
    const userSchema = new mongoose.Schema({
      email: String,
      password: String,
      role: String,
      isActive: Boolean,
      firstName: String,
      lastName: String
    });
    
    const User = mongoose.model('User', userSchema);
    
    console.log('🔧 Fetching admin users...');
    const adminUsers = await User.find({ 
      role: { $in: ['admin', 'super_admin'] },
      isActive: true 
    }).select('email role firstName lastName isActive');
    
    console.log(`\n✅ Found ${adminUsers.length} active admin users:`);
    adminUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email}`);
      console.log(`     Role: ${user.role}`);
      console.log(`     Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
      console.log(`     Active: ${user.isActive}`);
      console.log('');
    });
    
    // Also check for any users with admin in email
    console.log('🔧 Checking for users with "admin" in email...');
    const adminEmailUsers = await User.find({ 
      email: { $regex: /admin/i },
      isActive: true 
    }).select('email role firstName lastName isActive');
    
    console.log(`\n✅ Found ${adminEmailUsers.length} users with 'admin' in email:`);
    adminEmailUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email}`);
      console.log(`     Role: ${user.role}`);
      console.log(`     Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
      console.log(`     Active: ${user.isActive}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkAdminUsers();