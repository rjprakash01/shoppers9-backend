require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define Admin schema
const adminSchema = new mongoose.Schema({
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
});

const Admin = mongoose.model('Admin', adminSchema);

async function resetAdminPassword() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find the admin user
    const admin = await Admin.findOne({ email: 'admin@shoppers9.com' });
    
    if (!admin) {
      console.log('Admin user not found!');
      return;
    }
    
    console.log('Found admin user:', admin.email);
    
    // Hash the new password
    const newPassword = 'admin123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the password
    admin.password = hashedPassword;
    await admin.save();
    
    console.log(`Password for ${admin.email} has been reset to: ${newPassword}`);
    
    // Test the new password
    const isMatch = await bcrypt.compare(newPassword, admin.password);
    console.log('Password verification:', isMatch ? 'SUCCESS' : 'FAILED');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

resetAdminPassword();