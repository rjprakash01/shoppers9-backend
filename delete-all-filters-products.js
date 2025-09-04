const { MongoClient } = require('mongodb');

async function deleteAllFiltersAndProducts() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('shoppers9');
    
    // Delete all products
    const productsResult = await db.collection('products').deleteMany({});
    console.log(`Deleted ${productsResult.deletedCount} products`);
    
    // Delete all product filter values
    const productFilterValuesResult = await db.collection('productfiltervalues').deleteMany({});
    console.log(`Deleted ${productFilterValuesResult.deletedCount} product filter values`);
    
    // Delete all category filters
    const categoryFiltersResult = await db.collection('categoryfilters').deleteMany({});
    console.log(`Deleted ${categoryFiltersResult.deletedCount} category filters`);
    
    // Delete all filter options
    const filterOptionsResult = await db.collection('filteroptions').deleteMany({});
    console.log(`Deleted ${filterOptionsResult.deletedCount} filter options`);
    
    // Delete all filters
    const filtersResult = await db.collection('filters').deleteMany({});
    console.log(`Deleted ${filtersResult.deletedCount} filters`);
    
    console.log('\nAll filters and products have been successfully deleted from the database.');
    
  } catch (error) {
    console.error('Error deleting data:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

deleteAllFiltersAndProducts();