const mongoose = require('mongoose');

async function checkUserData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Find Vishnu's user record
    const user = await usersCollection.findOne({ email: 'prakash.jetender@gmail.com' });
    
    if (user) {
      console.log('User found:');
      console.log('Name:', user.firstName, user.lastName);
      console.log('Email:', user.email);
      console.log('Roles field:', user.roles);
      console.log('Roles type:', typeof user.roles);
      console.log('Is roles an array?', Array.isArray(user.roles));
      console.log('Full user object:', JSON.stringify(user, null, 2));
    } else {
      console.log('User not found');
    }
    
    // Also check UserRole collection
    const userRolesCollection = db.collection('userroles');
    const roles = await userRolesCollection.find({}).toArray();
    console.log('\nAvailable UserRoles:');
    roles.forEach(role => {
      console.log('Role ID:', role._id, 'Name:', role.name);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkUserData();