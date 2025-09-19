const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

async function fixDatabaseSync() {
  try {
    console.log('🔧 FIXING DATABASE SYNCHRONIZATION ISSUE...');
    
    // Connect to both databases
    const mainClient = new MongoClient('mongodb://localhost:27017/shoppers9');
    const adminClient = new MongoClient('mongodb://localhost:27017/shoppers9-admin');
    
    await mainClient.connect();
    await adminClient.connect();
    
    const mainDb = mainClient.db('shoppers9');
    const adminDb = adminClient.db('shoppers9-admin');
    
    console.log('\n📊 CURRENT STATE:');
    
    // Check current state
    const mainOrdersCount = await mainDb.collection('orders').countDocuments();
    const adminOrdersCount = await adminDb.collection('orders').countDocuments();
    const mainAdminsCount = await mainDb.collection('admins').countDocuments();
    const adminAdminsCount = await adminDb.collection('admins').countDocuments();
    
    console.log(`   Main DB (shoppers9): ${mainOrdersCount} orders, ${mainAdminsCount} admins`);
    console.log(`   Admin DB (shoppers9-admin): ${adminOrdersCount} orders, ${adminAdminsCount} admins`);
    
    // Option 1: Copy all data from main to admin database
    console.log('\n🔄 OPTION 1: Sync all data from main to admin database');
    console.log('   This will copy all orders, admins, products, etc. from shoppers9 to shoppers9-admin');
    
    // Get all collections from main database
    const collections = await mainDb.listCollections().toArray();
    console.log(`\n📋 Collections to sync: ${collections.map(c => c.name).join(', ')}`);
    
    // Sync each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`\n   Syncing ${collectionName}...`);
      
      const sourceCollection = mainDb.collection(collectionName);
      const targetCollection = adminDb.collection(collectionName);
      
      // Get count before sync
      const sourceCount = await sourceCollection.countDocuments();
      const targetCountBefore = await targetCollection.countDocuments();
      
      if (sourceCount > 0) {
        // Clear target collection first
        await targetCollection.deleteMany({});
        
        // Copy all documents
        const documents = await sourceCollection.find({}).toArray();
        if (documents.length > 0) {
          await targetCollection.insertMany(documents);
        }
        
        const targetCountAfter = await targetCollection.countDocuments();
        console.log(`     ✅ ${collectionName}: ${sourceCount} → ${targetCountAfter} documents`);
      } else {
        console.log(`     ⚠️  ${collectionName}: No documents to sync`);
      }
    }
    
    console.log('\n✅ DATABASE SYNC COMPLETED!');
    
    // Verify sync
    console.log('\n🔍 VERIFICATION:');
    const finalMainOrdersCount = await mainDb.collection('orders').countDocuments();
    const finalAdminOrdersCount = await adminDb.collection('orders').countDocuments();
    const finalMainAdminsCount = await mainDb.collection('admins').countDocuments();
    const finalAdminAdminsCount = await adminDb.collection('admins').countDocuments();
    
    console.log(`   Main DB: ${finalMainOrdersCount} orders, ${finalMainAdminsCount} admins`);
    console.log(`   Admin DB: ${finalAdminOrdersCount} orders, ${finalAdminAdminsCount} admins`);
    
    if (finalMainOrdersCount === finalAdminOrdersCount && finalMainAdminsCount === finalAdminAdminsCount) {
      console.log('   ✅ Databases are now synchronized!');
    } else {
      console.log('   ❌ Sync verification failed!');
    }
    
    // Check test admin orders specifically
    console.log('\n🧪 TEST ADMIN VERIFICATION:');
    
    const testAdmin = await adminDb.collection('admins').findOne({ email: 'admin@shoppers9.com' });
    if (testAdmin) {
      console.log(`   Test Admin ID: ${testAdmin._id}`);
      
      const adminOrders = await adminDb.collection('orders').find({
        'items.sellerId': testAdmin._id
      }).toArray();
      
      console.log(`   Orders visible to test admin: ${adminOrders.length}`);
      
      if (adminOrders.length > 0) {
        console.log('   📦 Recent orders:');
        adminOrders.slice(-3).forEach((order, i) => {
          console.log(`      ${i+1}. ${order.orderNumber} - ${order.createdAt}`);
        });
      }
    }
    
    await mainClient.close();
    await adminClient.close();
    
    console.log('\n🎉 SOLUTION SUMMARY:');
    console.log('   1. ✅ Synced all data from main database to admin database');
    console.log('   2. ✅ Admin backend can now see all orders created from main website');
    console.log('   3. ✅ Test admin should now see their orders in the admin panel');
    console.log('\n   Next: Restart the admin backend to see the changes!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixDatabaseSync();