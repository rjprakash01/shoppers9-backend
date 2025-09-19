const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoppers9', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createAdminAccounts() {
  try {
    await connectDB();
    console.log('🔄 Creating Admin Accounts...');
    
    const adminsCollection = mongoose.connection.db.collection('admins');
    
    // Demo admin accounts
    const adminAccounts = [
      {
        email: 'admin@shoppers9.com',
        password: 'Admin@123',
        firstName: 'Admin',
        lastName: 'User',
        phone: '9999999998',
        role: 'admin',
        primaryRole: 'admin',
        isActive: true
      },
      {
        email: 'superadmin@shoppers9.com',
        password: 'SuperAdmin@123',
        firstName: 'Super',
        lastName: 'Admin',
        phone: '9999999999',
        role: 'super_admin',
        primaryRole: 'super_admin',
        isActive: true
      }
    ];
    
    for (const account of adminAccounts) {
      console.log(`\n👤 Processing ${account.email}...`);
      
      // Check if admin already exists
      const existingAdmin = await adminsCollection.findOne({ email: account.email });
      
      if (existingAdmin) {
        console.log(`   Admin already exists. Updating password...`);
        
        // Hash the new password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(account.password, salt);
        
        // Update the existing admin
        await adminsCollection.updateOne(
          { email: account.email },
          { 
            $set: { 
              password: hashedPassword,
              primaryRole: account.primaryRole,
              isActive: true,
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`   ✅ Updated admin: ${account.email}`);
      } else {
        console.log(`   Creating new admin...`);
        
        // Hash the password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(account.password, salt);
        
        // Create new admin
        await adminsCollection.insertOne({
          ...account,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`   ✅ Created admin: ${account.email}`);
      }
    }
    
    // Verify the accounts
    console.log('\n🔍 Verifying Admin Accounts:');
    const allAdmins = await adminsCollection.find({}).toArray();
    
    allAdmins.forEach(admin => {
      console.log(`   ${admin.email}:`);
      console.log(`     Role: ${admin.role}`);
      console.log(`     Primary Role: ${admin.primaryRole}`);
      console.log(`     Active: ${admin.isActive}`);
      console.log(`     Has Password: ${admin.password ? 'YES' : 'NO'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔚 Admin account creation completed');
  }
}

createAdminAccounts();