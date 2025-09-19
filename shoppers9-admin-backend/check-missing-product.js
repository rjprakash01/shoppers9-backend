const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'shoppers9';

async function checkMissingProduct() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const productsCollection = db.collection('products');
    const ordersCollection = db.collection('orders');
    
    const missingProductId = '68cad0df602fb46d62b8f63b';
    
    console.log(`\n=== Investigating Missing Product: ${missingProductId} ===`);
    
    // Check if product exists in products collection
    const product = await productsCollection.findOne({ _id: missingProductId });
    console.log(`Product exists in products collection: ${product ? 'YES' : 'NO'}`);
    
    if (product) {
      console.log(`Product details:`);
      console.log(`  Name: ${product.name}`);
      console.log(`  Created By: ${product.createdBy}`);
      console.log(`  Active: ${product.isActive}`);
      console.log(`  Created At: ${product.createdAt}`);
    }
    
    // Check if this product ID appears in any orders
    const ordersWithThisProduct = await ordersCollection
      .find({ 'items.product': missingProductId })
      .toArray();
    
    console.log(`\nOrders containing this product: ${ordersWithThisProduct.length}`);
    ordersWithThisProduct.forEach((order, index) => {
      console.log(`${index + 1}. Order: ${order.orderNumber}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log(`   User: ${order.userId}`);
      
      const itemsWithThisProduct = order.items.filter(item => 
        item.product.toString() === missingProductId
      );
      console.log(`   Items with this product: ${itemsWithThisProduct.length}`);
      itemsWithThisProduct.forEach((item, itemIndex) => {
        console.log(`     Item ${itemIndex + 1}: Seller ID = ${item.sellerId || 'NULL'}`);
      });
    });
    
    // Check if there are similar product IDs (maybe ObjectId conversion issue)
    console.log(`\n=== Checking for similar product IDs ===`);
    const { ObjectId } = require('mongodb');
    
    try {
      const objectId = new ObjectId(missingProductId);
      const productByObjectId = await productsCollection.findOne({ _id: objectId });
      console.log(`Product found using ObjectId: ${productByObjectId ? 'YES' : 'NO'}`);
      
      if (productByObjectId) {
        console.log(`  Name: ${productByObjectId.name}`);
        console.log(`  Created By: ${productByObjectId.createdBy}`);
      }
    } catch (objectIdError) {
      console.log(`Invalid ObjectId format: ${objectIdError.message}`);
    }
    
    // Check recent products to see if there's a pattern
    console.log(`\n=== Recent Products for Reference ===`);
    const recentProducts = await productsCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    recentProducts.forEach((prod, index) => {
      console.log(`${index + 1}. ${prod.name} (ID: ${prod._id})`);
      console.log(`   Created By: ${prod.createdBy}`);
      console.log(`   Created At: ${prod.createdAt}`);
    });
    
    // Check if the admin has any products that could be used to fix these orders
    const adminsCollection = db.collection('admins');
    const admin = await adminsCollection.findOne({ email: 'admin@shoppers9.com' });
    
    if (admin) {
      const adminProducts = await productsCollection
        .find({ createdBy: admin._id })
        .toArray();
      
      console.log(`\n=== Admin Products (${adminProducts.length}) ===`);
      adminProducts.forEach((prod, index) => {
        console.log(`${index + 1}. ${prod.name} (ID: ${prod._id})`);
        console.log(`   Price: ${prod.price || 'N/A'}`);
        console.log(`   Active: ${prod.isActive}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkMissingProduct();