const { MongoClient } = require('mongodb');

async function verifyDeletion() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('shoppers9');
    
    // Count remaining documents
    const productsCount = await db.collection('products').countDocuments();
    const filtersCount = await db.collection('filters').countDocuments();
    const filterOptionsCount = await db.collection('filteroptions').countDocuments();
    const categoryFiltersCount = await db.collection('categoryfilters').countDocuments();
    const productFilterValuesCount = await db.collection('productfiltervalues').countDocuments();
    
    console.log('\nVerification Results:');
    console.log(`Products: ${productsCount}`);
    console.log(`Filters: ${filtersCount}`);
    console.log(`Filter Options: ${filterOptionsCount}`);
    console.log(`Category Filters: ${categoryFiltersCount}`);
    console.log(`Product Filter Values: ${productFilterValuesCount}`);
    
    if (productsCount === 0 && filtersCount === 0 && filterOptionsCount === 0 && categoryFiltersCount === 0 && productFilterValuesCount === 0) {
      console.log('\n✅ SUCCESS: All filters and products have been completely removed from the database.');
    } else {
      console.log('\n⚠️  WARNING: Some data may still remain in the database.');
    }
    
  } catch (error) {
    console.error('Error verifying deletion:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

verifyDeletion();