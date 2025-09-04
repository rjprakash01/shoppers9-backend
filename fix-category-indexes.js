const mongoose = require('mongoose');
require('dotenv').config({ path: './shoppers9-admin-backend/.env' });

async function fixCategoryIndexes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('categories');
    
    console.log('📋 Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    // Drop the problematic single name index if it exists
    try {
      await collection.dropIndex('name_1');
      console.log('✅ Dropped old name_1 index');
    } catch (error) {
      console.log('ℹ️ name_1 index does not exist or already dropped');
    }
    
    // Ensure the correct compound index exists
    try {
      await collection.createIndex({ name: 1, parentCategory: 1 }, { unique: true });
      console.log('✅ Created compound index on name and parentCategory');
    } catch (error) {
      console.log('ℹ️ Compound index already exists');
    }
    
    console.log('📋 Final indexes:');
    const finalIndexes = await collection.indexes();
    console.log(finalIndexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    console.log('✅ Index fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixCategoryIndexes();