import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from '../models/Admin';
import connectDB from '../config/database';

// Load environment variables
dotenv.config();

const createSuperAdmin = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await Admin.findOne({ 
      email: 'superadmin@shoppers9.com' 
    });

    if (existingSuperAdmin) {
      console.log('Super admin already exists:', {
        email: existingSuperAdmin.email,
        role: existingSuperAdmin.role,
        isActive: existingSuperAdmin.isActive
      });
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
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
    console.log('Super admin created successfully:', {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123',
      role: 'super_admin',
      firstName: 'Super',
      lastName: 'Admin',
      phone: '9876543210'
    });

    process.exit(0);
  } catch (error) {
    console.error('Error creating super admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();