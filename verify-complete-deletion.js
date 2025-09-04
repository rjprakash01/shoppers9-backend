const { MongoClient } = require('mongodb');

async function verifyCompleteDeletion() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('shoppers9');
    
    // Count remaining documents in all relevant collections
    const productsCount = await db.collection('products').countDocuments();
    const filtersCount = await db.collection('filters').countDocuments();
    const filterOptionsCount = await db.collection('filteroptions').countDocuments();
    const categoryFiltersCount = await db.collection('categoryfilters').countDocuments();
    const productFilterValuesCount = await db.collection('productfiltervalues').countDocuments();
    const categoriesCount = await db.collection('categories').countDocuments();
    
    console.log('\n=== COMPLETE DELETION VERIFICATION ===');
    console.log(`Products: ${productsCount}`);
    console.log(`Categories: ${categoriesCount}`);
    console.log(`Filters: ${filtersCount}`);
    console.log(`Filter Options: ${filterOptionsCount}`);
    console.log(`Category Filters: ${categoryFiltersCount}`);
    console.log(`Product Filter Values: ${productFilterValuesCount}`);
    
    const totalCount = productsCount + filtersCount + filterOptionsCount + categoryFiltersCount + productFilterValuesCount + categoriesCount;
    
    if (totalCount === 0) {
      console.log('\n✅ SUCCESS: All mock data has been completely removed from the database.');
      console.log('The database is now clean and ready for fresh data.');
    } else {
      console.log('\n⚠️  WARNING: Some data may still remain in the database.');
      console.log(`Total remaining documents: ${totalCount}`);
    }
    
  } catch (error) {
    console.error('Error verifying deletion:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

verifyCompleteDeletion();