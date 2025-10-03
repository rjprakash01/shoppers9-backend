/**
 * MongoDB Atlas Database Initialization Script
 * This script sets up both admin_db and main_website_db with all necessary collections,
 * indexes, and initial data for the dual-database architecture.
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB Atlas connection strings
const ADMIN_DB_URI = process.env.ADMIN_DB_URI;
const MAIN_DB_URI = process.env.MAIN_DB_URI;

// Validate environment variables
if (!ADMIN_DB_URI || !MAIN_DB_URI) {
  console.error('❌ Missing required environment variables!');
  console.error('Please ensure ADMIN_DB_URI and MAIN_DB_URI are set in your .env file');
  console.error('See .env.example for the correct format');
  process.exit(1);
}

if (ADMIN_DB_URI.includes('<username>') || MAIN_DB_URI.includes('<username>')) {
  console.error('❌ Please replace placeholder values in your .env file!');
  console.error('Update <username>, <password>, and <cluster> with your actual MongoDB Atlas credentials');
  process.exit(1);
}

// Database names
const ADMIN_DB_NAME = 'admin_db';
const MAIN_DB_NAME = 'main_website_db';

class AtlasDatabaseInitializer {
  constructor() {
    this.adminClient = null;
    this.mainClient = null;
    this.adminDb = null;
    this.mainDb = null;
  }

  async connect() {
    try {
      console.log('🔗 Connecting to MongoDB Atlas...');
      
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
      
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      throw error;
    }
  }

  async createCollections() {
    console.log('\n📦 Creating collections...');
    
    // Admin database collections
    const adminCollections = [
      'users',
      'products', 
      'categories',
      'orders',
      'customers',
      'settings',
      'audit_logs'
    ];
    
    // Main website database collections
    const mainCollections = [
      'products',
      'categories', 
      'users',
      'orders',
      'reviews',
      'cart_items'
    ];
    
    // Create admin collections
    for (const collectionName of adminCollections) {
      try {
        await this.adminDb.createCollection(collectionName);
        console.log(`✅ Created admin collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`ℹ️  Admin collection already exists: ${collectionName}`);
        } else {
          console.error(`❌ Failed to create admin collection ${collectionName}:`, error.message);
        }
      }
    }
    
    // Create main collections
    for (const collectionName of mainCollections) {
      try {
        await this.mainDb.createCollection(collectionName);
        console.log(`✅ Created main collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`ℹ️  Main collection already exists: ${collectionName}`);
        } else {
          console.error(`❌ Failed to create main collection ${collectionName}:`, error.message);
        }
      }
    }
  }

  async createIndexes() {
    console.log('\n🔍 Creating indexes...');
    
    try {
      // Admin database indexes
      await this.createIndexesSafely(this.adminDb, 'users', [
        { key: { email: 1 }, unique: true, name: 'admin_users_email_unique' },
        { key: { username: 1 }, unique: true, name: 'admin_users_username_unique' },
        { key: { role: 1 }, name: 'admin_users_role' }
      ]);
      
      await this.createIndexesSafely(this.adminDb, 'products', [
        { key: { name: 1 }, name: 'admin_products_name' },
        { key: { category: 1 }, name: 'admin_products_category' },
        { key: { brand: 1 }, name: 'admin_products_brand' },
        { key: { status: 1 }, name: 'admin_products_status' },
        { key: { isActive: 1 }, name: 'admin_products_isActive' },
        { key: { createdAt: -1 }, name: 'admin_products_createdAt' },
        { key: { 'variants.sku': 1 }, sparse: true, name: 'admin_products_variants_sku' }
      ]);
      
      await this.createIndexesSafely(this.adminDb, 'categories', [
        { key: { name: 1 }, unique: true, name: 'admin_categories_name_unique' },
        { key: { slug: 1 }, unique: true, name: 'admin_categories_slug_unique' },
        { key: { parentCategory: 1 }, name: 'admin_categories_parentCategory' },
        { key: { level: 1 }, name: 'admin_categories_level' },
        { key: { isActive: 1 }, name: 'admin_categories_isActive' }
      ]);
      
      await this.createIndexesSafely(this.adminDb, 'orders', [
        { key: { orderNumber: 1 }, unique: true, name: 'admin_orders_orderNumber_unique' },
        { key: { customerId: 1 }, name: 'admin_orders_customerId' },
        { key: { status: 1 }, name: 'admin_orders_status' },
        { key: { createdAt: -1 }, name: 'admin_orders_createdAt' }
      ]);
      
      await this.createIndexesSafely(this.adminDb, 'customers', [
        { key: { email: 1 }, unique: true, name: 'admin_customers_email_unique' },
        { key: { phone: 1 }, name: 'admin_customers_phone' },
        { key: { createdAt: -1 }, name: 'admin_customers_createdAt' }
      ]);
      
      await this.createIndexesSafely(this.adminDb, 'audit_logs', [
        { key: { action: 1 }, name: 'admin_audit_logs_action' },
        { key: { userId: 1 }, name: 'admin_audit_logs_userId' },
        { key: { timestamp: -1 }, name: 'admin_audit_logs_timestamp' }
      ]);
      
      // Main database indexes
      await this.createIndexesSafely(this.mainDb, 'products', [
        { key: { name: 1 }, name: 'main_products_name' },
        { key: { category: 1 }, name: 'main_products_category' },
        { key: { brand: 1 }, name: 'main_products_brand' },
        { key: { status: 1 }, name: 'main_products_status' },
        { key: { isActive: 1 }, name: 'main_products_isActive' },
        { key: { price: 1 }, name: 'main_products_price' },
        { key: { rating: -1 }, name: 'main_products_rating' },
        { key: { 'variants.sku': 1 }, sparse: true, name: 'main_products_variants_sku' }
      ]);
      
      await this.createIndexesSafely(this.mainDb, 'categories', [
        { key: { name: 1 }, unique: true, name: 'main_categories_name_unique' },
        { key: { slug: 1 }, unique: true, name: 'main_categories_slug_unique' },
        { key: { parentCategory: 1 }, name: 'main_categories_parentCategory' },
        { key: { level: 1 }, name: 'main_categories_level' },
        { key: { isActive: 1 }, name: 'main_categories_isActive' }
      ]);
      
      await this.createIndexesSafely(this.mainDb, 'users', [
        { key: { email: 1 }, unique: true, name: 'main_users_email_unique' },
        { key: { username: 1 }, unique: true, name: 'main_users_username_unique' }
      ]);
      
      await this.createIndexesSafely(this.mainDb, 'orders', [
        { key: { orderNumber: 1 }, unique: true, name: 'main_orders_orderNumber_unique' },
        { key: { userId: 1 }, name: 'main_orders_userId' },
        { key: { status: 1 }, name: 'main_orders_status' },
        { key: { createdAt: -1 }, name: 'main_orders_createdAt' }
      ]);
      
      await this.createIndexesSafely(this.mainDb, 'reviews', [
        { key: { productId: 1 }, name: 'main_reviews_productId' },
        { key: { userId: 1 }, name: 'main_reviews_userId' },
        { key: { rating: 1 }, name: 'main_reviews_rating' },
        { key: { createdAt: -1 }, name: 'main_reviews_createdAt' }
      ]);
      
      await this.createIndexesSafely(this.mainDb, 'cart_items', [
        { key: { userId: 1 }, name: 'main_cart_items_userId' },
        { key: { productId: 1 }, name: 'main_cart_items_productId' },
        { key: { createdAt: -1 }, name: 'main_cart_items_createdAt' }
      ]);
      
      console.log('✅ All indexes created successfully');
      
    } catch (error) {
      console.error('❌ Failed to create indexes:', error.message);
      throw error;
    }
  }

  async createIndexesSafely(db, collectionName, indexes) {
    const collection = db.collection(collectionName);
    for (const index of indexes) {
      try {
        await collection.createIndex(index.key, {
          unique: index.unique || false,
          sparse: index.sparse || false,
          name: index.name
        });
        console.log(`✅ Created index ${index.name} on ${collectionName}`);
      } catch (error) {
        if (error.code === 86 || error.code === 85) { // IndexKeySpecsConflict or IndexOptionsConflict
          console.log(`ℹ️  Index ${index.name} already exists on ${collectionName}`);
        } else {
          console.log(`⚠️  Failed to create index ${index.name} on ${collectionName}: ${error.message}`);
        }
      }
    }
  }

  async createAdminUser() {
    console.log('\n👤 Creating admin user...');
    
    try {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const adminUser = {
        username: 'admin',
        email: 'admin@shoppers9.com',
        password: hashedPassword,
        role: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        isActive: true,
        permissions: [
          'products.create',
          'products.read', 
          'products.update',
          'products.delete',
          'categories.create',
          'categories.read',
          'categories.update', 
          'categories.delete',
          'users.create',
          'users.read',
          'users.update',
          'users.delete',
          'orders.read',
          'orders.update',
          'settings.read',
          'settings.update'
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await this.adminDb.collection('users').insertOne(adminUser);
      console.log(`✅ Admin user created with ID: ${result.insertedId}`);
      
    } catch (error) {
      if (error.code === 11000) {
        console.log('ℹ️  Admin user already exists');
      } else {
        console.error('❌ Failed to create admin user:', error.message);
        throw error;
      }
    }
  }

  async createInitialCategories() {
    console.log('\n📂 Creating initial categories...');
    
    const categories = [
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets',
        level: 1,
        parentCategory: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion and apparel',
        level: 1,
        parentCategory: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Home improvement and garden supplies',
        level: 1,
        parentCategory: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Books',
        slug: 'books',
        description: 'Books and educational materials',
        level: 1,
        parentCategory: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    try {
      // Insert into admin database
      await this.adminDb.collection('categories').insertMany(categories);
      console.log('✅ Categories created in admin_db');
      
      // Insert into main database
      await this.mainDb.collection('categories').insertMany(categories);
      console.log('✅ Categories created in main_website_db');
      
    } catch (error) {
      if (error.code === 11000) {
        console.log('ℹ️  Some categories already exist');
      } else {
        console.error('❌ Failed to create categories:', error.message);
        throw error;
      }
    }
  }

  async createSettings() {
    console.log('\n⚙️  Creating initial settings...');
    
    const settings = {
      siteName: 'Shoppers9',
      siteDescription: 'Your one-stop shopping destination',
      currency: 'USD',
      taxRate: 0.08,
      shippingRate: 5.99,
      freeShippingThreshold: 50.00,
      emailNotifications: true,
      maintenanceMode: false,
      allowRegistration: true,
      requireEmailVerification: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    try {
      await this.adminDb.collection('settings').insertOne(settings);
      console.log('✅ Initial settings created');
    } catch (error) {
      console.error('❌ Failed to create settings:', error.message);
    }
  }

  async testConnections() {
    console.log('\n🧪 Testing database connections...');
    
    try {
      // Test admin database
      const adminStats = await this.adminDb.stats();
      console.log(`✅ Admin DB connected - Collections: ${adminStats.collections}`);
      
      // Test main database
      const mainStats = await this.mainDb.stats();
      console.log(`✅ Main DB connected - Collections: ${mainStats.collections}`);
      
      // Test data retrieval
      const adminCategoriesCount = await this.adminDb.collection('categories').countDocuments();
      const mainCategoriesCount = await this.mainDb.collection('categories').countDocuments();
      
      console.log(`📊 Admin categories: ${adminCategoriesCount}`);
      console.log(`📊 Main categories: ${mainCategoriesCount}`);
      
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      throw error;
    }
  }

  async close() {
    console.log('\n🔌 Closing connections...');
    
    if (this.adminClient) {
      await this.adminClient.close();
      console.log('✅ Admin database connection closed');
    }
    
    if (this.mainClient) {
      await this.mainClient.close();
      console.log('✅ Main database connection closed');
    }
  }

  async initialize() {
    try {
      console.log('🚀 Starting MongoDB Atlas database initialization...\n');
      
      await this.connect();
      await this.createCollections();
      await this.createIndexes();
      await this.createAdminUser();
      await this.createInitialCategories();
      await this.createSettings();
      await this.testConnections();
      
      console.log('\n🎉 Database initialization completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Update your .env files with the MongoDB Atlas connection strings');
      console.log('2. Restart your backend services');
      console.log('3. Test the dual-write functionality');
      
    } catch (error) {
      console.error('\n💥 Initialization failed:', error.message);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Run the initialization
if (require.main === module) {
  const initializer = new AtlasDatabaseInitializer();
  initializer.initialize().catch(console.error);
}

module.exports = AtlasDatabaseInitializer;