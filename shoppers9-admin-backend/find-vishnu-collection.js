const mongoose = require('mongoose');
require('dotenv').config();

async function findVishnuCollection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check users collection
    console.log('\n=== CHECKING USERS COLLECTION ===');
    const usersResult = await db.collection('users').findOne({
      email: 'prakash.jetender@gmail.com'
    });
    
    if (usersResult) {
      console.log('✅ Found in users collection');
      console.log('Email:', usersResult.email);
      console.log('Name:', usersResult.firstName, usersResult.lastName);
      console.log('Role:', usersResult.primaryRole);
      console.log('Active:', usersResult.isActive);
    } else {
      console.log('❌ Not found in users collection');
    }
    
    // Check admins collection
    console.log('\n=== CHECKING ADMINS COLLECTION ===');
    const adminsResult = await db.collection('admins').findOne({
      email: 'prakash.jetender@gmail.com'
    });
    
    if (adminsResult) {
      console.log('✅ Found in admins collection');
      console.log('Email:', adminsResult.email);
      console.log('Name:', adminsResult.firstName, adminsResult.lastName);
      console.log('Role:', adminsResult.role);
      console.log('Active:', adminsResult.isActive);
    } else {
      console.log('❌ Not found in admins collection');
    }
    
    // Check if there are any other collections with similar names
    const collections = await db.listCollections().toArray();
    console.log('\n=== ALL COLLECTIONS ===');
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

findVishnuCollection();