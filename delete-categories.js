const { MongoClient } = require('mongodb');

async function deleteAllCategories() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('shoppers9');
    
    // Delete all categories
    const categoriesResult = await db.collection('categories').deleteMany({});
    console.log(`Deleted ${categoriesResult.deletedCount} categories`);
    
    console.log('\nAll categories have been successfully deleted from the database.');
    
  } catch (error) {
    console.error('Error deleting categories:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

deleteAllCategories();