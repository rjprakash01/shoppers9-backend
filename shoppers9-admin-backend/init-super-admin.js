const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to the same database the backend uses
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    return false;
  }
};

// Import the actual Admin model from the project
const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid phone number']
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
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.refreshToken;
      return ret;
    }
  }
});

// Pre-save middleware to hash password
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const Admin = mongoose.model('Admin', adminSchema);

async function initializeSuperAdmin() {
  const connected = await connectDB();
  if (!connected) {
    console.log('❌ Could not connect to database. Please ensure MongoDB is running.');
    console.log('💡 If you\'re using a cloud database, check your connection string.');
    process.exit(1);
  }

  try {
    // Check if any super admin exists
    const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
    
    if (existingSuperAdmin) {
      console.log('✅ Super admin already exists!');
      console.log('📧 Email:', existingSuperAdmin.email);
      console.log('👤 Name:', `${existingSuperAdmin.firstName} ${existingSuperAdmin.lastName}`);
      console.log('📱 Phone:', existingSuperAdmin.phone);
      console.log('');
      console.log('🔑 Use the existing credentials to login.');
      return;
    }

    // Create new super admin
    const superAdminData = {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123', // Will be hashed by pre-save middleware
      firstName: 'Super',
      lastName: 'Admin',
      phone: '9876543210',
      role: 'super_admin',
      isActive: true
    };

    const superAdmin = new Admin(superAdminData);
    await superAdmin.save();
    
    console.log('🎉 Super Admin created successfully!');
    console.log('');
    console.log('📧 Email: superadmin@shoppers9.com');
    console.log('🔑 Password: superadmin123');
    console.log('👤 Role: super_admin');
    console.log('📱 Phone: 9876543210');
    console.log('');
    console.log('✨ You can now login to the admin panel at http://localhost:5174');
    
  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️  Admin with this email already exists!');
      console.log('📧 Email: superadmin@shoppers9.com');
      console.log('🔑 Password: superadmin123');
    } else {
      console.error('❌ Error creating super admin:', error.message);
    }
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

initializeSuperAdmin();