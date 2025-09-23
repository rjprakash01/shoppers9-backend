const mongoose = require('mongoose');

async function fixPrimaryRole() {
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
      console.log('Current user primaryRole:', user.primaryRole);
      console.log('Current user primaryRole type:', typeof user.primaryRole);
      
      // Update the primaryRole field to use string enum value
      const result = await usersCollection.updateOne(
        { email: 'prakash.jetender@gmail.com' },
        { 
          $set: { 
            roles: [adminRoleId],
            primaryRole: 'admin'  // String enum value, not ObjectId
          }
        }
      );
      
      console.log('Update result:', result);
      
      // Verify the update
      const updatedUser = await usersCollection.findOne({ email: 'prakash.jetender@gmail.com' });
      console.log('Updated user roles:', updatedUser.roles);
      console.log('Updated user primaryRole:', updatedUser.primaryRole);
      console.log('Updated primaryRole type:', typeof updatedUser.primaryRole);
      
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

fixPrimaryRole();