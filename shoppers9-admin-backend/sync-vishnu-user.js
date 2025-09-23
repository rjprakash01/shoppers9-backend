const mongoose = require('mongoose');
const AdminUser = require('./src/models/User.ts').default;

// Connect to main backend database
const mainBackendConnection = mongoose.createConnection();
const mainUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  role: String,
  isAdmin: Boolean,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'users' });
const MainUser = mainBackendConnection.model('User', mainUserSchema);

require('dotenv').config();

async function syncVishnuUser() {
  try {
    // Connect to admin backend
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Admin Backend MongoDB');

    // Connect to main backend (same URI but different connection)
    await mainBackendConnection.openUri(process.env.MONGODB_URI);
    console.log('Connected to Main Backend MongoDB');

    // Find Vishnu in admin backend
    const vishnuAdmin = await AdminUser.findById('68ca615233f20c4845472df6');
    
    if (vishnuAdmin) {
      console.log('\n=== FOUND VISHNU IN ADMIN BACKEND ===');
      console.log('Name:', vishnuAdmin.firstName, vishnuAdmin.lastName);
      console.log('Email:', vishnuAdmin.email);
      console.log('Phone:', vishnuAdmin.phone);
      console.log('Role:', vishnuAdmin.primaryRole);
      console.log('Active:', vishnuAdmin.isActive);
      console.log('Created:', vishnuAdmin.createdAt);

      // Check if user exists in main backend
      const existingMainUser = await MainUser.findById('68ca615233f20c4845472df6');
      
      if (existingMainUser) {
        console.log('\n✅ User already exists in main backend');
        console.log('Main backend user:', existingMainUser.name, existingMainUser.email);
      } else {
        console.log('\n❌ User missing from main backend - Creating...');
        
        // Create user in main backend
        const newMainUser = new MainUser({
          _id: vishnuAdmin._id,
          name: `${vishnuAdmin.firstName} ${vishnuAdmin.lastName}`,
          email: vishnuAdmin.email,
          phone: vishnuAdmin.phone,
          role: 'admin',
          isAdmin: true,
          createdAt: vishnuAdmin.createdAt,
          updatedAt: new Date()
        });

        await newMainUser.save();
        console.log('✅ Successfully created user in main backend');
        console.log('User ID:', newMainUser._id);
        console.log('Name:', newMainUser.name);
        console.log('Email:', newMainUser.email);
        console.log('Role:', newMainUser.role);
      }

      // Verify the sync worked
      console.log('\n=== VERIFICATION ===');
      const verifyUser = await MainUser.findById('68ca615233f20c4845472df6');
      if (verifyUser) {
        console.log('✅ User successfully exists in main backend');
        console.log('Name:', verifyUser.name);
        console.log('Email:', verifyUser.email);
        console.log('Role:', verifyUser.role);
        console.log('Is Admin:', verifyUser.isAdmin);
      } else {
        console.log('❌ Verification failed - user still missing');
      }

    } else {
      console.log('❌ Vishnu not found in admin backend either');
      
      // Search for any admin users
      const allAdmins = await AdminUser.find({
        primaryRole: { $in: ['admin', 'super_admin', 'sub_admin'] }
      }).limit(5);
      
      console.log('\nFound admin users:');
      allAdmins.forEach(admin => {
        console.log(`- ${admin.firstName} ${admin.lastName} (${admin._id})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    await mainBackendConnection.close();
    console.log('\nDisconnected from both databases');
  }
}

syncVishnuUser();