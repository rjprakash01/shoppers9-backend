const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Admin schema (simplified version)
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['super_admin', 'admin', 'moderator'], default: 'admin' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@shoppers9.com' });
    if (existingAdmin) {
      console.log('Admin already exists');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create admin
    const admin = new Admin({
      email: 'admin@shoppers9.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Admin',
      phone: '9999999999',
      role: 'admin',
      isActive: true
    });

    await admin.save();
    console.log('Admin created successfully!');
    console.log('Email: admin@shoppers9.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();