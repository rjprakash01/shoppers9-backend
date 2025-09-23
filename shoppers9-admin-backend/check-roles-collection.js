const mongoose = require('mongoose');

async function checkRolesCollection() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('All collections:');
    collections.forEach(col => console.log('- ' + col.name));
    
    // Check roles collection
    const rolesCollection = db.collection('roles');
    const roles = await rolesCollection.find({}).toArray();
    console.log('\nRoles collection:');
    roles.forEach(role => {
      console.log('Role:', JSON.stringify(role, null, 2));
    });
    
    // Also check if there's a different collection name
    const userrolesCollection = db.collection('userroles');
    const userRoles = await userrolesCollection.find({}).limit(2).toArray();
    console.log('\nFirst 2 UserRoles (these seem to be assignments):');
    userRoles.forEach(role => {
      console.log('UserRole assignment:', JSON.stringify(role, null, 2));
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkRolesCollection();