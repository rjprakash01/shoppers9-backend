const mongoose = require('mongoose');

async function checkUserRoles() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const userRolesCollection = db.collection('userroles');
    
    // Get all user roles with full details
    const roles = await userRolesCollection.find({}).toArray();
    console.log('Available UserRoles:');
    roles.forEach(role => {
      console.log('Full role object:', JSON.stringify(role, null, 2));
    });
    
    // Try to find admin role specifically
    const adminRole = await userRolesCollection.findOne({ 
      $or: [
        { name: 'admin' },
        { name: 'Admin' },
        { roleName: 'admin' },
        { roleName: 'Admin' },
        { role: 'admin' },
        { role: 'Admin' }
      ]
    });
    
    if (adminRole) {
      console.log('\nFound admin role:', JSON.stringify(adminRole, null, 2));
    } else {
      console.log('\nNo admin role found with common field names');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkUserRoles();