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

async function syncRolePermissions() {
  try {
    await connectDB();
    console.log('🔄 Synchronizing Role Permissions with User Permissions...');
    
    const adminsCollection = mongoose.connection.db.collection('admins');
    const userRolesCollection = mongoose.connection.db.collection('userroles');
    const rolesCollection = mongoose.connection.db.collection('roles');
    const permissionsCollection = mongoose.connection.db.collection('permissions');
    
    // Get all roles
    const roles = await rolesCollection.find({}).toArray();
    console.log(`\n📋 Found ${roles.length} roles`);
    
    roles.forEach(role => {
      console.log(`   ${role.name}: ${role.permissions?.length || 0} permissions`);
    });
    
    // Get all admins
    const admins = await adminsCollection.find({}).toArray();
    console.log(`\n👥 Found ${admins.length} admin users`);
    
    // Get all permissions for reference
    const allPermissions = await permissionsCollection.find({ isActive: true }).toArray();
    console.log(`\n📊 Found ${allPermissions.length} total permissions`);
    
    // Process each admin user
    for (const admin of admins) {
      console.log(`\n👤 Processing admin: ${admin.email}`);
      
      // Determine the role for this admin
      let targetRole;
      if (admin.role === 'super_admin') {
        targetRole = roles.find(r => r.name === 'super_admin');
      } else if (admin.role === 'admin') {
        targetRole = roles.find(r => r.name === 'admin');
      } else if (admin.role === 'sub_admin') {
        targetRole = roles.find(r => r.name === 'sub_admin');
      }
      
      if (!targetRole) {
        console.log(`   ❌ No matching role found for ${admin.role}`);
        continue;
      }
      
      console.log(`   📋 Target role: ${targetRole.name} with ${targetRole.permissions?.length || 0} permissions`);
      
      // Get current UserRole entry
      const existingUserRole = await userRolesCollection.findOne({ 
        userId: admin._id,
        isActive: true 
      });
      
      if (existingUserRole) {
        console.log(`   📝 Updating existing UserRole...`);
        console.log(`   📊 Current permissions: ${existingUserRole.permissions?.length || 0}`);
        
        // Update UserRole with role's permissions
        const rolePermissions = targetRole.permissions || [];
        const userPermissions = rolePermissions.map(permId => {
          const permission = allPermissions.find(p => p._id.toString() === permId.toString());
          return {
            permissionId: permId,
            granted: true,
            restrictions: {}
          };
        });
        
        await userRolesCollection.updateOne(
          { _id: existingUserRole._id },
          {
            $set: {
              roleId: targetRole._id,
              permissions: userPermissions,
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`   ✅ Updated UserRole with ${userPermissions.length} permissions`);
        
      } else {
        console.log(`   📝 Creating new UserRole...`);
        
        // Create new UserRole with role's permissions
        const rolePermissions = targetRole.permissions || [];
        const userPermissions = rolePermissions.map(permId => ({
          permissionId: permId,
          granted: true,
          restrictions: {}
        }));
        
        await userRolesCollection.insertOne({
          userId: admin._id,
          roleId: targetRole._id,
          permissions: userPermissions,
          isActive: true,
          assignedBy: admin._id,
          assignedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`   ✅ Created UserRole with ${userPermissions.length} permissions`);
      }
    }
    
    // Verify the synchronization
    console.log('\n🔍 Verifying synchronization...');
    
    for (const admin of admins) {
      const userRole = await userRolesCollection.findOne({ 
        userId: admin._id,
        isActive: true 
      });
      
      if (userRole) {
        const role = await rolesCollection.findOne({ _id: userRole.roleId });
        console.log(`   ${admin.email}:`);
        console.log(`     Role: ${role?.name || 'UNKNOWN'}`);
        console.log(`     Role Permissions: ${role?.permissions?.length || 0}`);
        console.log(`     User Permissions: ${userRole.permissions?.length || 0}`);
        
        const isSync = (role?.permissions?.length || 0) === (userRole.permissions?.length || 0);
        console.log(`     Synchronized: ${isSync ? '✅' : '❌'}`);
      } else {
        console.log(`   ${admin.email}: ❌ NO USER ROLE FOUND`);
      }
    }
    
    // Show permission breakdown by module
    console.log('\n📊 Permission Breakdown by Role:');
    
    for (const role of roles) {
      if (role.permissions && role.permissions.length > 0) {
        const rolePermissions = allPermissions.filter(p => 
          role.permissions.includes(p._id)
        );
        
        const moduleGroups = {};
        rolePermissions.forEach(p => {
          if (!moduleGroups[p.module]) {
            moduleGroups[p.module] = 0;
          }
          moduleGroups[p.module]++;
        });
        
        console.log(`\n   ${role.name} (${role.permissions.length} total):`);
        Object.entries(moduleGroups).forEach(([module, count]) => {
          console.log(`     ${module}: ${count} permissions`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔚 Permission synchronization completed');
  }
}

syncRolePermissions();