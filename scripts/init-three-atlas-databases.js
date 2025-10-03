/**
 * MongoDB Atlas Three-Database Initialization Script
 * This script sets up admin_db, main_website_db, and shoppers9 databases
 * with all necessary collections, indexes, and initial data.
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB Atlas connection strings
const ADMIN_DB_URI = process.env.ADMIN_DB_URI;
const MAIN_DB_URI = process.env.MAIN_DB_URI;
const SHOPPERS9_DB_URI = process.env.SHOPPERS9_DB_URI;

// Validate environment variables
if (!ADMIN_DB_URI || !MAIN_DB_URI || !SHOPPERS9_DB_URI) {
  console.error('❌ Missing required environment variables!');
  console.error('Please ensure ADMIN_DB_URI, MAIN_DB_URI, and SHOPPERS9_DB_URI are set in your .env file');
  console.error('See .env.atlas for the correct format');
  process.exit(1);
}

if (ADMIN_DB_URI.includes('<username>') || MAIN_DB_URI.includes('<username>') || SHOPPERS9_DB_URI.includes('<username>')) {
  console.error('❌ Please replace placeholder values in your .env file!');
  console.error('Update <username>, <password>, and <cluster> with your actual MongoDB Atlas credentials');
  process.exit(1);
}

// Database names
const ADMIN_DB_NAME = 'admin_db';
const MAIN_DB_NAME = 'main_website_db';
const SHOPPERS9_DB_NAME = 'shoppers9';

class ThreeAtlasDatabaseInitializer {
  constructor() {
    this.adminClient = null;
    this.mainClient = null;
    this.shoppers9Client = null;
    this.adminDb = null;
    this.mainDb = null;
    this.shoppers9Db = null;
  }

  async connect() {
    try {
      console.log('🔗 Connecting to MongoDB Atlas (3 databases)...');
      
      // Connect to admin database
      this.adminClient = new MongoClient(ADMIN_DB_URI);
      await this.adminClient.connect();
      this.adminDb = this.adminClient.db(ADMIN_DB_NAME);
      console.log('✅ Connected to admin_db');
      
      // Connect to main website database
      this.mainClient = new MongoClient(MAIN_DB_URI);
      await this.mainClient.connect();
      this.mainDb = this.mainClient.db(MAIN_DB_NAME);
      console.log('✅ Connected to main_website_db');
      
      // Connect to shoppers9 database
      this.shoppers9Client = new MongoClient(SHOPPERS9_DB_URI);
      await this.shoppers9Client.connect();
      this.shoppers9Db = this.shoppers9Client.db(SHOPPERS9_DB_NAME);
      console.log('✅ Connected to shoppers9');
      
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      throw error;
    }
  }

  async createCollections() {
    console.log('\n📁 Creating collections...');
    
    // Admin database collections
    const adminCollections = [
      'users', 'userroles', 'moduleaccess', 'categories', 'banners', 
      'products', 'orders', 'settings', 'analytics'
    ];
    
    // Main website and shoppers9 database collections (same structure)
    const mainCollections = [
      'users', 'products', 'categories', 'orders', 'carts', 
      'wishlists', 'banners', 'otps', 'supports', 'settings'
    ];
    
    // Create admin collections
    for (const collectionName of adminCollections) {
      try {
        await this.adminDb.createCollection(collectionName);
        console.log(`✅ Created admin_db.${collectionName}`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`ℹ️  admin_db.${collectionName} already exists`);
        } else {
          console.error(`❌ Error creating admin_db.${collectionName}:`, error.message);
        }
      }
    }
    
    // Create main website collections
    for (const collectionName of mainCollections) {
      try {
        await this.mainDb.createCollection(collectionName);
        console.log(`✅ Created main_website_db.${collectionName}`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`ℹ️  main_website_db.${collectionName} already exists`);
        } else {
          console.error(`❌ Error creating main_website_db.${collectionName}:`, error.message);
        }
      }
    }
    
    // Create shoppers9 collections
    for (const collectionName of mainCollections) {
      try {
        await this.shoppers9Db.createCollection(collectionName);
        console.log(`✅ Created shoppers9.${collectionName}`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`ℹ️  shoppers9.${collectionName} already exists`);
        } else {
          console.error(`❌ Error creating shoppers9.${collectionName}:`, error.message);
        }
      }
    }
  }

  async createIndexes() {
    console.log('\n🔍 Creating indexes...');
    
    const indexes = {
      users: [
        { email: 1 },
        { phone: 1 },
        { createdAt: -1 }
      ],
      products: [
        { name: 'text', description: 'text' },
        { category: 1 },
        { price: 1 },
        { isActive: 1 },
        { createdAt: -1 }
      ],
      categories: [
        { name: 1 },
        { isActive: 1 }
      ],
      orders: [
        { userId: 1 },
        { status: 1 },
        { createdAt: -1 }
      ],
      carts: [
        { userId: 1 }
      ],
      wishlists: [
        { userId: 1 }
      ]
    };
    
    // Create indexes for all three databases
    const databases = [
      { db: this.adminDb, name: 'admin_db' },
      { db: this.mainDb, name: 'main_website_db' },
      { db: this.shoppers9Db, name: 'shoppers9' }
    ];
    
    for (const { db, name } of databases) {
      for (const [collection, indexSpecs] of Object.entries(indexes)) {
        for (const indexSpec of indexSpecs) {
          await this.createIndexSafely(db, collection, indexSpec, name);
        }
      }
    }
  }

  async createIndexSafely(db, collectionName, indexSpec, dbName) {
    try {
      await db.collection(collectionName).createIndex(indexSpec);
      console.log(`✅ Created index on ${dbName}.${collectionName}:`, Object.keys(indexSpec).join(', '));
    } catch (error) {
      if (error.code === 85) {
        console.log(`ℹ️  Index already exists on ${dbName}.${collectionName}:`, Object.keys(indexSpec).join(', '));
      } else {
        console.error(`❌ Error creating index on ${dbName}.${collectionName}:`, error.message);
      }
    }
  }

  async createAdminUser() {
    console.log('\n👤 Creating admin user...');
    
    const hashedPassword = await bcrypt.hash('SuperAdmin@123', 10);
    
    const adminUser = {
      email: 'superadmin@shoppers9.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'super_admin',
      primaryRole: 'super_admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    try {
      const existingUser = await this.adminDb.collection('users').findOne({ email: adminUser.email });
      if (existingUser) {
        console.log('ℹ️  Super admin user already exists');
      } else {
        await this.adminDb.collection('users').insertOne(adminUser);
        console.log('✅ Super admin user created');
        console.log('📧 Email: superadmin@shoppers9.com');
        console.log('🔑 Password: SuperAdmin@123');
      }
    } catch (error) {
      console.error('❌ Error creating admin user:', error.message);
    }
  }

  async createInitialCategories() {
    console.log('\n📂 Creating initial categories...');
    
    const categories = [
      { name: 'Electronics', description: 'Electronic devices and gadgets', isActive: true },
      { name: 'Clothing', description: 'Fashion and apparel', isActive: true },
      { name: 'Home & Garden', description: 'Home improvement and garden supplies', isActive: true },
      { name: 'Sports', description: 'Sports equipment and accessories', isActive: true },
      { name: 'Books', description: 'Books and educational materials', isActive: true }
    ];
    
    // Create categories in all three databases
    const databases = [
      { db: this.adminDb, name: 'admin_db' },
      { db: this.mainDb, name: 'main_website_db' },
      { db: this.shoppers9Db, name: 'shoppers9' }
    ];
    
    for (const { db, name } of databases) {
      for (const category of categories) {
        try {
          const existing = await db.collection('categories').findOne({ name: category.name });
          if (!existing) {
            await db.collection('categories').insertOne({
              ...category,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            console.log(`✅ Created category '${category.name}' in ${name}`);
          } else {
            console.log(`ℹ️  Category '${category.name}' already exists in ${name}`);
          }
        } catch (error) {
          console.error(`❌ Error creating category in ${name}:`, error.message);
        }
      }
    }
  }

  async testConnections() {
    console.log('\n🧪 Testing database connections...');
    
    try {
      // Test admin database
      await this.adminDb.admin().ping();
      console.log('✅ admin_db connection test passed');
      
      // Test main website database
      await this.mainDb.admin().ping();
      console.log('✅ main_website_db connection test passed');
      
      // Test shoppers9 database
      await this.shoppers9Db.admin().ping();
      console.log('✅ shoppers9 connection test passed');
      
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      throw error;
    }
  }

  async close() {
    console.log('\n🔌 Closing connections...');
    
    if (this.adminClient) await this.adminClient.close();
    if (this.mainClient) await this.mainClient.close();
    if (this.shoppers9Client) await this.shoppers9Client.close();
    
    console.log('✅ All connections closed');
  }

  async initialize() {
    try {
      console.log('🚀 Starting MongoDB Atlas Three-Database Initialization...');
      
      await this.connect();
      await this.testConnections();
      await this.createCollections();
      await this.createIndexes();
      await this.createAdminUser();
      await this.createInitialCategories();
      
      console.log('\n🎉 Three-database initialization completed successfully!');
      console.log('\n📊 Database Summary:');
      console.log('  • admin_db: Admin panel data and user management');
      console.log('  • main_website_db: Synchronized main website data');
      console.log('  • shoppers9: Original main database for e-commerce data');
      
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  const initializer = new ThreeAtlasDatabaseInitializer();
  initializer.initialize().catch(console.error);
}

module.exports = ThreeAtlasDatabaseInitializer;