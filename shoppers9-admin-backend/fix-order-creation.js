const mongoose = require('mongoose');
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection
const MONGO_URI = 'mongodb://localhost:27017/shoppers9';

async function fixOrderCreation() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Get the native MongoDB client for direct operations
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shoppers9');
    
    // Check current cart items and their product ID types
    console.log('\n=== Checking Cart Items ===');
    const carts = await db.collection('carts').find({}).limit(5).toArray();
    
    carts.forEach((cart, index) => {
      console.log(`\nCart ${index + 1} (User: ${cart.userId}):`);
      cart.items.forEach((item, itemIndex) => {
        console.log(`  Item ${itemIndex + 1}:`);
        console.log(`    Product ID: ${item.product} (Type: ${typeof item.product})`);
        console.log(`    Is ObjectId: ${ObjectId.isValid(item.product)}`);
        
        // Try to convert to ObjectId
        try {
          const objectId = new ObjectId(item.product);
          console.log(`    Converted ObjectId: ${objectId}`);
        } catch (error) {
          console.log(`    ❌ Cannot convert to ObjectId: ${error.message}`);
        }
      });
    });
    
    // Check if products exist with proper ObjectId conversion
    console.log('\n=== Testing Product Queries ===');
    if (carts.length > 0 && carts[0].items.length > 0) {
      const testProductId = carts[0].items[0].product;
      console.log(`\nTesting product ID: ${testProductId}`);
      
      // Test 1: Direct string query
      const product1 = await db.collection('products').findOne({ _id: testProductId });
      console.log(`Direct string query result: ${product1 ? 'FOUND' : 'NOT FOUND'}`);
      
      // Test 2: ObjectId conversion query
      try {
        const product2 = await db.collection('products').findOne({ _id: new ObjectId(testProductId) });
        console.log(`ObjectId query result: ${product2 ? 'FOUND' : 'NOT FOUND'}`);
        if (product2) {
          console.log(`  Product name: ${product2.name}`);
          console.log(`  Created by: ${product2.createdBy}`);
        }
      } catch (error) {
        console.log(`ObjectId query error: ${error.message}`);
      }
      
      // Test 3: $in query with mixed types
      const productIds = carts[0].items.map(item => {
        try {
          return new ObjectId(item.product);
        } catch {
          return item.product;
        }
      });
      
      const products3 = await db.collection('products').find({ 
        _id: { $in: productIds } 
      }).toArray();
      console.log(`$in query with ObjectId conversion: ${products3.length} products found`);
    }
    
    // Check recent orders and their sellerId issues
    console.log('\n=== Checking Recent Orders ===');
    const recentOrders = await db.collection('orders')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    console.log(`Found ${recentOrders.length} recent orders`);
    recentOrders.forEach((order, index) => {
      console.log(`\nOrder ${index + 1}: ${order.orderNumber}`);
      console.log(`  Created: ${order.createdAt}`);
      console.log(`  Items: ${order.items.length}`);
      
      order.items.forEach((item, itemIndex) => {
        console.log(`    Item ${itemIndex + 1}:`);
        console.log(`      Product: ${item.product}`);
        console.log(`      Seller ID: ${item.sellerId || 'NULL'}`);
      });
    });
    
    // Propose fix for the order creation process
    console.log('\n=== PROPOSED FIX ===');
    console.log('The issue is in the order creation process:');
    console.log('1. Cart items store product IDs as strings');
    console.log('2. Product._id fields are ObjectIds in MongoDB');
    console.log('3. The $in query fails to match string IDs with ObjectId _ids');
    console.log('\nSolution: Convert cart item product IDs to ObjectIds before querying');
    
    await client.close();
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixOrderCreation();