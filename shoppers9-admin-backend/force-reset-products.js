const { MongoClient } = require('mongodb');

async function forceResetProducts() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('shoppers9');
    
    // Check if products collection exists
    const collections = await db.listCollections().toArray();
    const hasProducts = collections.some(c => c.name === 'products');
    
    if (hasProducts) {
      console.log('Products collection exists, dropping it...');
      await db.collection('products').drop();
      console.log('Products collection dropped successfully');
    } else {
      console.log('Products collection does not exist');
    }
    
    // Recreate the collection without any indexes
    console.log('Creating fresh products collection...');
    await db.createCollection('products');
    
    // Check indexes on the new collection
    const indexes = await db.collection('products').indexes();
    console.log('Indexes on new collection:', indexes.map(idx => idx.name));
    
    console.log('Products collection reset completed successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

forceResetProducts();