const mongoose = require('mongoose');

// Connect to MongoDB and find admin users
mongoose.connect('mongodb://localhost:27017/shoppers9-admin')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Define Admin schema to match the backend
    const AdminSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: { type: String },
      role: { type: String, enum: ['super_admin', 'admin', 'moderator'], default: 'moderator' },
      isActive: { type: Boolean, default: true },
      lastLogin: { type: Date },
      refreshToken: { type: String },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
    }, {
      timestamps: true
    });
    
    const Admin = mongoose.model('Admin', AdminSchema);
    
    // Find all admin users
    const admins = await Admin.find({ isActive: true }).select('_id email firstName lastName role').limit(5);
    
    console.log('\n🔍 Found admin users:');
    if (admins.length === 0) {
      console.log('❌ No admin users found in database');
    } else {
      admins.forEach((admin, index) => {
        console.log(`  ${index + 1}. ID: ${admin._id}`);
        console.log(`     Email: ${admin.email}`);
        console.log(`     Name: ${admin.firstName} ${admin.lastName}`);
        console.log(`     Role: ${admin.role}`);
        console.log('');
      });
      
      console.log('🎯 Use the first admin ID for testing:', admins[0]._id.toString());
    }
    
  })
  .catch(error => {
    console.error('❌ Error:', error);
  })
  .finally(() => {
    mongoose.connection.close();
    process.exit();
  });