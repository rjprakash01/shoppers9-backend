const mongoose = require('mongoose');

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

async function fixAdminPermissions() {
  try {
    await connectDB();
    console.log('🔄 Fixing Admin Permissions...');
    
    const adminsCollection = mongoose.connection.db.collection('admins');
    const userRolesCollection = mongoose.connection.db.collection('userroles');
    const permissionsCollection = mongoose.connection.db.collection('permissions');
    const rolesCollection = mongoose.connection.db.collection('roles');
    
    // Get all admins
    const admins = await adminsCollection.find({}).toArray();
    console.log(`\n📋 Found ${admins.length} admin users`);
    
    // Get all permissions
    const permissions = await permissionsCollection.find({ isActive: true }).toArray();
    console.log(`📊 Found ${permissions.length} permissions`);
    
    // Get admin role
    const adminRole = await rolesCollection.findOne({ name: 'admin' });
    console.log(`📋 Admin role:`, adminRole ? adminRole.name : 'NOT FOUND');
    
    if (!adminRole) {
      console.log('❌ Admin role not found, creating it...');
      const newAdminRole = {
        name: 'admin',
        displayName: 'Admin',
        description: 'Administrative access with configurable permissions',
        level: 2,
        permissions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const insertResult = await rolesCollection.insertOne(newAdminRole);
      console.log('✅ Created admin role:', insertResult.insertedId);
      adminRole = { ...newAdminRole, _id: insertResult.insertedId };
    }
    
    // Filter permissions for admin (exclude super admin only modules)
    const superAdminOnlyModules = ['admin_management', 'settings'];
    const adminPermissions = permissions.filter(p => !superAdminOnlyModules.includes(p.module));
    
    console.log(`📊 Admin permissions to assign: ${adminPermissions.length}`);
    
    // Update admin role with permissions
    await rolesCollection.updateOne(
      { _id: adminRole._id },
      { 
        $set: { 
          permissions: adminPermissions.map(p => p._id),
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ Updated admin role with permissions');
    
    // Create UserRole entries for each admin
    for (const admin of admins) {
      console.log(`\n👤 Processing admin: ${admin.email}`);
      
      // Check if UserRole already exists
      const existingUserRole = await userRolesCollection.findOne({ 
        userId: admin._id,
        isActive: true 
      });
      
      if (existingUserRole) {
        console.log('   Updating existing UserRole...');
        await userRolesCollection.updateOne(
          { _id: existingUserRole._id },
          {
            $set: {
              roleId: adminRole._id,
              permissions: adminPermissions.map(p => ({
                permissionId: p._id,
                granted: true,
                restrictions: {}
              })),
              updatedAt: new Date()
            }
          }
        );
      } else {
        console.log('   Creating new UserRole...');
        await userRolesCollection.insertOne({
          userId: admin._id,
          roleId: adminRole._id,
          permissions: adminPermissions.map(p => ({
            permissionId: p._id,
            granted: true,
            restrictions: {}
          })),
          isActive: true,
          assignedBy: admin._id,
          assignedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      console.log(`   ✅ UserRole processed for ${admin.email}`);
    }
    
    // Verify the setup
    console.log('\n🔍 Verifying Admin Permissions Setup:');
    
    for (const admin of admins) {
      const userRole = await userRolesCollection.findOne({ 
        userId: admin._id,
        isActive: true 
      });
      
      if (userRole) {
        console.log(`   ${admin.email}:`);
        console.log(`     Role ID: ${userRole.roleId}`);
        console.log(`     Permissions: ${userRole.permissions.length}`);
        console.log(`     Active: ${userRole.isActive}`);
      } else {
        console.log(`   ${admin.email}: NO USER ROLE FOUND`);
      }
    }
    
    // Show module breakdown
    console.log('\n📊 Permission Modules for Admin:');
    const moduleGroups = {};
    adminPermissions.forEach(p => {
      if (!moduleGroups[p.module]) {
        moduleGroups[p.module] = 0;
      }
      moduleGroups[p.module]++;
    });
    
    Object.entries(moduleGroups).forEach(([module, count]) => {
      console.log(`   ${module}: ${count} permissions`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔚 Admin permissions fix completed');
  }
}

fixAdminPermissions();