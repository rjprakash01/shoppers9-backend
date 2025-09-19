const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9';

async function resetAdminPassword() {
  try {
    console.log('=== RESETTING ADMIN PASSWORD ===');
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
    
    // Find the test admin
    const testAdmin = await Admin.findOne({ email: 'admin@shoppers9.com' });
    
    if (!testAdmin) {
      console.log('Test admin not found. Creating new test admin...');
      
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('password123', saltRounds);
      
      // Create new test admin
      const newAdmin = new Admin({
        firstName: 'Test',
        lastName: 'Admin',
        email: 'testadmin@example.com',
        phone: '1234567890',
        password: hashedPassword,
        role: 'admin',
        permissions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await newAdmin.save();
      console.log('✅ New test admin created with email: testadmin@example.com and password: password123');
    } else {
      console.log('Found existing admin:', testAdmin.email);
      
      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('password123', saltRounds);
      
      // Update the password
      testAdmin.password = hashedPassword;
      testAdmin.updatedAt = new Date();
      await testAdmin.save();
      
      console.log('✅ Password reset successfully for:', testAdmin.email);
      console.log('New password: password123');
    }
    
    // Also check and update superadmin
    const superAdmin = await Admin.findOne({ email: 'superadmin@shoppers9.com' });
    if (superAdmin) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);
      
      superAdmin.password = hashedPassword;
      superAdmin.updatedAt = new Date();
      await superAdmin.save();
      
      console.log('✅ Password reset successfully for:', superAdmin.email);
      console.log('New password: admin123');
    }
    
    // Verify the password works
    console.log('\n=== VERIFYING PASSWORDS ===');
    const updatedAdmin = await Admin.findOne({ email: 'admin@shoppers9.com' }).select('+password');
    if (updatedAdmin) {
      const isMatch = await bcrypt.compare('password123', updatedAdmin.password);
      console.log('Password verification for admin@shoppers9.com:', isMatch ? '✅ Success' : '❌ Failed');
    }
    
    const updatedSuperAdmin = await Admin.findOne({ email: 'superadmin@shoppers9.com' }).select('+password');
    if (updatedSuperAdmin) {
      const isMatch = await bcrypt.compare('admin123', updatedSuperAdmin.password);
      console.log('Password verification for superadmin@shoppers9.com:', isMatch ? '✅ Success' : '❌ Failed');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the reset
resetAdminPassword();