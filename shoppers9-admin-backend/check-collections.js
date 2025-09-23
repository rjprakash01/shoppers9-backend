const mongoose = require('mongoose');
require('dotenv').config();

async function checkCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n=== ALL COLLECTIONS ===');
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });
    
    // Check each collection for Vishnu's email
    console.log('\n=== SEARCHING FOR VISHNU IN ALL COLLECTIONS ===');
    
    for (const collection of collections) {
      const collectionName = collection.name;
      try {
        const db = mongoose.connection.db;
        const result = await db.collection(collectionName).findOne({
          email: 'prakash.jetender@gmail.com'
        });
        
        if (result) {
          console.log(`\n✅ FOUND VISHNU IN COLLECTION: ${collectionName}`);
          console.log('Document:', JSON.stringify(result, null, 2));
        }
      } catch (error) {
        console.log(`❌ Error checking collection ${collectionName}:`, error.message);
      }
    }
    
    // Also check for any documents with "vishnu" in the name
    console.log('\n=== SEARCHING FOR "VISHNU" IN NAMES ===');
    
    for (const collection of collections) {
      const collectionName = collection.name;
      try {
        const db = mongoose.connection.db;
        const results = await db.collection(collectionName).find({
          $or: [
            { firstName: /vishnu/i },
            { lastName: /vishnu/i },
            { name: /vishnu/i }
          ]
        }).toArray();
        
        if (results.length > 0) {
          console.log(`\n✅ FOUND VISHNU-RELATED DOCS IN: ${collectionName}`);
          results.forEach((doc, index) => {
            console.log(`Document ${index + 1}:`, JSON.stringify(doc, null, 2));
          });
        }
      } catch (error) {
        console.log(`❌ Error checking collection ${collectionName}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkCollections();