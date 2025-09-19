import mongoose from 'mongoose';
import User from '../models/User';
import Role from '../models/Role';
import UserRole from '../models/UserRole';
import connectDB from '../config/database';
import bcrypt from 'bcryptjs';

// Initialize Admin role with isolated data ecosystem
export const initializeAdminEcosystem = async () => {
  try {
    await connectDB();
    console.log('🔄 Initializing Admin role with isolated data ecosystem...');

    // Create demo Admin users with isolated ecosystems
    const adminUsers = [
      {
        firstName: 'John',
        lastName: 'Smith',
        email: 'admin1@shoppers9.com',
        phone: '9876543210',
        password: 'admin123',
        primaryRole: 'admin',
        businessName: 'John\'s Electronics Store',
        businessType: 'Electronics'
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'admin2@shoppers9.com',
        phone: '9876543211',
        password: 'admin123',
        primaryRole: 'admin',
        businessName: 'Sarah\'s Fashion Boutique',
        businessType: 'Fashion'
      },
      {
        firstName: 'Mike',
        lastName: 'Wilson',
        email: 'admin3@shoppers9.com',
        phone: '9876543212',
        password: 'admin123',
        primaryRole: 'admin',
        businessName: 'Mike\'s Home & Garden',
        businessType: 'Home & Garden'
      }
    ];

    const createdAdmins = [];

    // Create Admin users
    for (const adminData of adminUsers) {
      // Check if admin already exists
      const existingAdmin = await User.findOne({ email: adminData.email });
      if (existingAdmin) {
        console.log(`✅ Admin ${adminData.email} already exists`);
        createdAdmins.push(existingAdmin);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(adminData.password, 12);

      // Create admin user
      const admin = new User({
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        email: adminData.email,
        phone: adminData.phone,
        password: hashedPassword,
        primaryRole: adminData.primaryRole,
        isActive: true,
        isEmailVerified: true,
        businessProfile: {
          businessName: adminData.businessName,
          businessType: adminData.businessType,
          description: `${adminData.businessName} - Specialized in ${adminData.businessType}`,
          establishedYear: 2020 + Math.floor(Math.random() * 4)
        }
      });

      await admin.save();
      createdAdmins.push(admin);
      console.log(`✅ Created Admin: ${adminData.email}`);
      console.log(`📝 Admin created: ${adminData.email} (${adminData.businessName})`);
      
      // Create UserRole entry for this admin
      const adminRole = await Role.findOne({ name: 'admin' });
      if (adminRole) {
        const existingUserRole = await UserRole.findOne({ userId: admin._id, isActive: true });
        if (!existingUserRole) {
          await UserRole.create({
            userId: admin._id,
            roleId: adminRole._id,
            permissions: [],
            isActive: true,
            assignedBy: admin._id
          });
          console.log(`📋 Created UserRole entry for ${adminData.email}`);
        }
      }
    }

    console.log('✅ Admin ecosystem initialization completed successfully!');
    console.log('\n📊 Admin Ecosystem Summary:');
    console.log(`- Created ${createdAdmins.length} Admin users`);
    console.log('- Each Admin has their own isolated data scope');
    console.log('- Data filtering middleware ensures proper isolation');
    console.log('- Role-based dashboard shows only own data');
    console.log('\n🔐 Admin Login Credentials:');
    adminUsers.forEach(admin => {
      console.log(`- ${admin.email} / ${admin.password} (${admin.businessName})`);
    });

    console.log('\n🎯 Key Features Implemented:');
    console.log('- ✅ Role-based data filtering middleware');
    console.log('- ✅ Dynamic dashboard with role-specific metrics');
    console.log('- ✅ Permission-based menu visibility');
    console.log('- ✅ Action button permission controls');
    console.log('- ✅ Admin isolated data ecosystem');
    console.log('\n🔒 Data Isolation Rules:');
    console.log('- Super Admin: Sees ALL data globally');
    console.log('- Admin: Sees only THEIR OWN data (like a seller)');
    console.log('- Sub-Admin: Limited operational access');
    console.log('- Seller: Own products and orders only');
    console.log('- Customer: Personal orders and account only');

  } catch (error) {
    console.error('❌ Error initializing Admin ecosystem:', error);
    throw error;
  }
};

// Run the initialization if this file is executed directly
if (require.main === module) {
  initializeAdminEcosystem()
    .then(() => {
      console.log('✅ Admin ecosystem initialization completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Admin ecosystem initialization failed:', error);
      process.exit(1);
    });
}

export default initializeAdminEcosystem;