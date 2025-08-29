const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Admin schema (simplified version)
const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'moderator'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  refreshToken: {
    type: String
  }
}, {
  timestamps: true
});

const Admin = mongoose.model('Admin', adminSchema);

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await Admin.findOne({ 
      email: 'superadmin@shoppers9.com',
      role: 'super_admin' 
    });

    if (existingSuperAdmin) {
      console.log('Super admin already exists!');
      console.log('Email: superadmin@shoppers9.com');
      console.log('Password: superadmin123');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('superadmin123', salt);

    // Create super admin
    const superAdmin = new Admin({
      email: 'superadmin@shoppers9.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '9876543210',
      role: 'super_admin',
      isActive: true
    });

    await superAdmin.save();
    
    console.log('✅ Super Admin created successfully!');
    console.log('📧 Email: superadmin@shoppers9.com');
    console.log('🔑 Password: superadmin123');
    console.log('👤 Role: super_admin');
    console.log('📱 Phone: 9876543210');
    console.log('');
    console.log('You can now login to the admin panel with these credentials.');
    
  } catch (error) {
    console.error('Error creating super admin:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

createSuperAdmin();