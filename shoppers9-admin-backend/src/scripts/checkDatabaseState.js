const mongoose = require('mongoose');
require('dotenv').config();

const checkDatabaseState = async () => {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Available collections:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });

    // Check admins collection
    if (collections.find(col => col.name === 'admins')) {
      const adminCount = await mongoose.connection.db.collection('admins').countDocuments();
      console.log(`\n👥 Admins collection: ${adminCount} documents`);
      
      if (adminCount > 0) {
        const sampleAdmin = await mongoose.connection.db.collection('admins').findOne();
        console.log('Sample admin:', JSON.stringify(sampleAdmin, null, 2));
      }
    }

    // Check roles collection
    if (collections.find(col => col.name === 'roles')) {
      const roleCount = await mongoose.connection.db.collection('roles').countDocuments();
      console.log(`\n🎭 Roles collection: ${roleCount} documents`);
      
      if (roleCount > 0) {
        const roles = await mongoose.connection.db.collection('roles').find().toArray();
        console.log('Available roles:');
        roles.forEach(role => {
          console.log(`  - ${role.name} (active: ${role.isActive})`);
        });
      }
    }

    // Check userroles collection
    if (collections.find(col => col.name === 'userroles')) {
      const userRoleCount = await mongoose.connection.db.collection('userroles').countDocuments();
      console.log(`\n🔗 UserRoles collection: ${userRoleCount} documents`);
      
      if (userRoleCount > 0) {
        const sampleUserRole = await mongoose.connection.db.collection('userroles').findOne();
        console.log('Sample UserRole:', JSON.stringify(sampleUserRole, null, 2));
      }
    }

    // Check permissions collection
    if (collections.find(col => col.name === 'permissions')) {
      const permissionCount = await mongoose.connection.db.collection('permissions').countDocuments();
      console.log(`\n🔐 Permissions collection: ${permissionCount} documents`);
    }

  } catch (error) {
    console.error('❌ Error checking database state:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
};

checkDatabaseState();