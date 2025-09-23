const mongoose = require('mongoose');

async function fixUserRoles() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // The correct admin role ObjectId from the roles collection
    const adminRoleId = new mongoose.Types.ObjectId('68ca667bb642b2e41415e106');
    
    // Find Vishnu's user record
    const user = await usersCollection.findOne({ email: 'prakash.jetender@gmail.com' });
    
    if (user) {
      console.log('Current user roles:', user.roles);
      console.log('Current user roles type:', typeof user.roles[0]);
      
      // Update the roles field to use proper ObjectId
      const result = await usersCollection.updateOne(
        { email: 'prakash.jetender@gmail.com' },
        { 
          $set: { 
            roles: [adminRoleId],
            primaryRole: adminRoleId
          }
        }
      );
      
      console.log('Update result:', result);
      
      // Verify the update
      const updatedUser = await usersCollection.findOne({ email: 'prakash.jetender@gmail.com' });
      console.log('Updated user roles:', updatedUser.roles);
      console.log('Updated user roles type:', typeof updatedUser.roles[0]);
      console.log('Updated primaryRole:', updatedUser.primaryRole);
      
    } else {
      console.log('User not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixUserRoles();