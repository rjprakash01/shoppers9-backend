/**
 * Migration Script: Local MongoDB to MongoDB Atlas
 * This script helps migrate existing data from local MongoDB to Atlas
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

class MongoMigrator {
  constructor() {
    // Local MongoDB connections (existing)
    this.localAdminUri = 'mongodb://localhost:27017/admin_db';
    this.localMainUri = 'mongodb://localhost:27017/main_website_db';
    
    // Atlas connections (new)
    this.atlasAdminUri = process.env.ADMIN_DB_URI;
    this.atlasMainUri = process.env.MAIN_DB_URI;
    
    this.clients = {};
    this.databases = {};
  }

  async connect() {
    console.log('🔗 Connecting to databases...');
    
    try {
      // Connect to local databases
      this.clients.localAdmin = new MongoClient(this.localAdminUri);
      await this.clients.localAdmin.connect();
      this.databases.localAdmin = this.clients.localAdmin.db('admin_db');
      console.log('✅ Connected to local admin_db');
      
      this.clients.localMain = new MongoClient(this.localMainUri);
      await this.clients.localMain.connect();
      this.databases.localMain = this.clients.localMain.db('main_website_db');
      console.log('✅ Connected to local main_website_db');
      
      // Connect to Atlas databases
      this.clients.atlasAdmin = new MongoClient(this.atlasAdminUri);
      await this.clients.atlasAdmin.connect();
      this.databases.atlasAdmin = this.clients.atlasAdmin.db('admin_db');
      console.log('✅ Connected to Atlas admin_db');
      
      this.clients.atlasMain = new MongoClient(this.atlasMainUri);
      await this.clients.atlasMain.connect();
      this.databases.atlasMain = this.clients.atlasMain.db('main_website_db');
      console.log('✅ Connected to Atlas main_website_db');
      
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      throw error;
    }
  }

  async checkLocalData() {
    console.log('\n🔍 Checking local data...');
    
    try {
      const adminCollections = await this.databases.localAdmin.listCollections().toArray();
      const mainCollections = await this.databases.localMain.listCollections().toArray();
      
      console.log(`📊 Local admin_db collections: ${adminCollections.length}`);
      adminCollections.forEach(col => console.log(`  - ${col.name}`));
      
      console.log(`📊 Local main_website_db collections: ${mainCollections.length}`);
      mainCollections.forEach(col => console.log(`  - ${col.name}`));
      
      // Count documents in key collections
      const collections = ['users', 'products', 'categories', 'orders'];
      
      for (const collectionName of collections) {
        try {
          const adminCount = await this.databases.localAdmin.collection(collectionName).countDocuments();
          const mainCount = await this.databases.localMain.collection(collectionName).countDocuments();
          console.log(`📈 ${collectionName}: Admin=${adminCount}, Main=${mainCount}`);
        } catch (error) {
          console.log(`ℹ️  Collection ${collectionName} not found in local databases`);
        }
      }
      
      return { adminCollections, mainCollections };
      
    } catch (error) {
      console.error('❌ Failed to check local data:', error.message);
      return { adminCollections: [], mainCollections: [] };
    }
  }

  async migrateCollection(sourceDb, targetDb, collectionName) {
    try {
      console.log(`🚚 Migrating ${collectionName}...`);
      
      const sourceCollection = sourceDb.collection(collectionName);
      const targetCollection = targetDb.collection(collectionName);
      
      // Get all documents from source
      const documents = await sourceCollection.find({}).toArray();
      
      if (documents.length === 0) {
        console.log(`ℹ️  No documents found in ${collectionName}`);
        return;
      }
      
      // Clear target collection (optional - comment out if you want to preserve existing data)
      await targetCollection.deleteMany({});
      
      // Insert documents into target
      const result = await targetCollection.insertMany(documents);
      console.log(`✅ Migrated ${result.insertedCount} documents to ${collectionName}`);
      
    } catch (error) {
      if (error.code === 11000) {
        console.log(`⚠️  Duplicate key error in ${collectionName} - some documents may already exist`);
      } else {
        console.error(`❌ Failed to migrate ${collectionName}:`, error.message);
      }
    }
  }

  async migrateIndexes(sourceDb, targetDb, collectionName) {
    try {
      const sourceCollection = sourceDb.collection(collectionName);
      const targetCollection = targetDb.collection(collectionName);
      
      // Get indexes from source
      const indexes = await sourceCollection.listIndexes().toArray();
      
      for (const index of indexes) {
        // Skip the default _id index
        if (index.name === '_id_') continue;
        
        try {
          await targetCollection.createIndex(index.key, {
            name: index.name,
            unique: index.unique || false,
            sparse: index.sparse || false
          });
          console.log(`✅ Created index ${index.name} on ${collectionName}`);
        } catch (error) {
          if (error.code === 85) {
            console.log(`ℹ️  Index ${index.name} already exists on ${collectionName}`);
          } else {
            console.error(`❌ Failed to create index ${index.name}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Failed to migrate indexes for ${collectionName}:`, error.message);
    }
  }

  async migrate() {
    try {
      console.log('🚀 Starting migration from local MongoDB to Atlas...\n');
      
      await this.connect();
      const { adminCollections, mainCollections } = await this.checkLocalData();
      
      if (adminCollections.length === 0 && mainCollections.length === 0) {
        console.log('ℹ️  No local data found to migrate');
        return;
      }
      
      console.log('\n🔄 Starting migration...');
      
      // Migrate admin database collections
      console.log('\n📦 Migrating admin database...');
      for (const collection of adminCollections) {
        await this.migrateCollection(
          this.databases.localAdmin,
          this.databases.atlasAdmin,
          collection.name
        );
        await this.migrateIndexes(
          this.databases.localAdmin,
          this.databases.atlasAdmin,
          collection.name
        );
      }
      
      // Migrate main database collections
      console.log('\n📦 Migrating main website database...');
      for (const collection of mainCollections) {
        await this.migrateCollection(
          this.databases.localMain,
          this.databases.atlasMain,
          collection.name
        );
        await this.migrateIndexes(
          this.databases.localMain,
          this.databases.atlasMain,
          collection.name
        );
      }
      
      console.log('\n🎉 Migration completed successfully!');
      
      // Verify migration
      await this.verifyMigration();
      
    } catch (error) {
      console.error('\n💥 Migration failed:', error.message);
      throw error;
    } finally {
      await this.close();
    }
  }

  async verifyMigration() {
    console.log('\n🔍 Verifying migration...');
    
    const collections = ['users', 'products', 'categories', 'orders'];
    
    for (const collectionName of collections) {
      try {
        const localAdminCount = await this.databases.localAdmin.collection(collectionName).countDocuments();
        const atlasAdminCount = await this.databases.atlasAdmin.collection(collectionName).countDocuments();
        const localMainCount = await this.databases.localMain.collection(collectionName).countDocuments();
        const atlasMainCount = await this.databases.atlasMain.collection(collectionName).countDocuments();
        
        console.log(`📊 ${collectionName}:`);
        console.log(`   Local Admin: ${localAdminCount} → Atlas Admin: ${atlasAdminCount}`);
        console.log(`   Local Main: ${localMainCount} → Atlas Main: ${atlasMainCount}`);
        
        if (localAdminCount === atlasAdminCount && localMainCount === atlasMainCount) {
          console.log(`   ✅ Migration verified for ${collectionName}`);
        } else {
          console.log(`   ⚠️  Count mismatch for ${collectionName}`);
        }
      } catch (error) {
        console.log(`   ℹ️  Collection ${collectionName} not found`);
      }
    }
  }

  async close() {
    console.log('\n🔌 Closing connections...');
    
    for (const [name, client] of Object.entries(this.clients)) {
      if (client) {
        await client.close();
        console.log(`✅ Closed ${name} connection`);
      }
    }
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  const migrator = new MongoMigrator();
  migrator.migrate().catch(console.error);
}

module.exports = MongoMigrator;