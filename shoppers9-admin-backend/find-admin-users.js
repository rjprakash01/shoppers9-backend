const mongoose = require('mongoose');

// Connect to MongoDB and find admin users
mongoose.connect('mongodb://localhost:27017/shoppers9-admin')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Define User schema to match the backend auth middleware expectation
    const UserSchema = new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: { type: String, required: true, unique: true },
      phone: String,
      password: String,
      primaryRole: {
        type: String,
        enum: ['super_admin', 'admin', 'sub_admin', 'seller', 'customer'],
        default: 'customer'
      },
      isActive: { type: Boolean, default: true },
      lastLogin: Date,
      roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserRole' }],
      adminInfo: {
        employeeId: String,
        department: String,
        accessLevel: Number
      }
    }, {
      timestamps: true
    });
    
    const User = mongoose.model('User', UserSchema);
    
    // Find all admin users
    const adminUsers = await User.find({ 
      primaryRole: { $in: ['admin', 'super_admin', 'sub_admin'] },
      isActive: true 
    }).select('_id email firstName lastName primaryRole phone').limit(10);
    
    console.log('\n🔍 Found admin users in User collection:');
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in User collection');
      
      // Try to find any active users
      const anyUsers = await User.find({ isActive: true }).select('_id email firstName lastName primaryRole phone').limit(5);
      console.log('\n🔍 Found any active users:');
      anyUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user._id}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Name: ${user.firstName} ${user.lastName}`);
        console.log(`     Role: ${user.primaryRole}`);
        console.log(`     Phone: ${user.phone}`);
        console.log('');
      });
      
      if (anyUsers.length > 0) {
        console.log('🎯 Use the first user ID for testing:', anyUsers[0]._id.toString());
      }
    } else {
      adminUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user._id}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Name: ${user.firstName} ${user.lastName}`);
        console.log(`     Role: ${user.primaryRole}`);
        console.log(`     Phone: ${user.phone}`);
        console.log('');
      });
      
      console.log('🎯 Use the first admin user ID for testing:', adminUsers[0]._id.toString());
    }
    
  })
  .catch(error => {
    console.error('❌ Error:', error);
  })
  .finally(() => {
    mongoose.connection.close();
    process.exit();
  });