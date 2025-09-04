const { MongoClient } = require('mongodb');

async function dropSkuIndex() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('shoppers9');
    
    // Check if products collection exists
    const collections = await db.listCollections().toArray();
    const hasProducts = collections.some(c => c.name === 'products');
    
    if (hasProducts) {
      console.log('Products collection exists');
      
      // Get current indexes
      const indexes = await db.collection('products').indexes();
      console.log('Current indexes:', indexes.map(idx => idx.name));
      
      // Check if sku_1 index exists
      const hasSku = indexes.some(idx => idx.name === 'sku_1');
      
      if (hasSku) {
        console.log('Found sku_1 index, dropping it...');
        await db.collection('products').dropIndex('sku_1');
        console.log('Successfully dropped sku_1 index');
      } else {
        console.log('No sku_1 index found');
      }
    } else {
      console.log('Products collection does not exist yet');
      
      // Try to trigger collection creation by attempting to create a product
      // This will fail but should create the collection with indexes
      try {
        await db.collection('products').insertOne({ test: true });
        await db.collection('products').deleteOne({ test: true });
        
        // Now check for indexes
        const indexes = await db.collection('products').indexes();
        console.log('Indexes after collection creation:', indexes.map(idx => idx.name));
        
        const hasSku = indexes.some(idx => idx.name === 'sku_1');
        if (hasSku) {
          console.log('Found sku_1 index, dropping it...');
          await db.collection('products').dropIndex('sku_1');
          console.log('Successfully dropped sku_1 index');
        }
      } catch (err) {
        console.log('Error during collection creation test:', err.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

dropSkuIndex();