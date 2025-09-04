const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/shoppers9').then(async () => {
  const db = mongoose.connection.db;
  const indexes = await db.collection('products').indexes();
  console.log('All product indexes:');
  indexes.forEach(idx => {
    console.log('- Name:', idx.name, 'Key:', JSON.stringify(idx.key), 'Unique:', !!idx.unique);
  });
  mongoose.disconnect();
}).catch(console.error);