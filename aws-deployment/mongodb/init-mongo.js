// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the shoppers9 database
db = db.getSiblingDB('shoppers9');

// Create application user
db.createUser({
  user: 'shoppers9_user',
  pwd: process.env.MONGO_USER_PASSWORD || 'shoppers9_password',
  roles: [
    {
      role: 'readWrite',
      db: 'shoppers9'
    }
  ]
});

// Create collections with indexes
db.createCollection('users');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('orders');
db.createCollection('carts');
db.createCollection('wishlists');
db.createCollection('banners');
db.createCollection('otps');
db.createCollection('supports');

// Create indexes for better performance

// Users collection indexes
db.users.createIndex({ "phone": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { sparse: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "isActive": 1 });

// Products collection indexes
db.products.createIndex({ "name": "text", "description": "text" });
db.products.createIndex({ "category": 1 });
db.products.createIndex({ "price": 1 });
db.products.createIndex({ "isActive": 1 });
db.products.createIndex({ "createdAt": -1 });

// Categories collection indexes
db.categories.createIndex({ "name": 1 }, { unique: true });
db.categories.createIndex({ "isActive": 1 });

// Orders collection indexes
db.orders.createIndex({ "userId": 1 });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "createdAt": -1 });
db.orders.createIndex({ "orderNumber": 1 }, { unique: true });

// Carts collection indexes
db.carts.createIndex({ "userId": 1 });
db.carts.createIndex({ "userId": 1, "productId": 1 }, { unique: true });

// Wishlists collection indexes
db.wishlists.createIndex({ "userId": 1 });
db.wishlists.createIndex({ "userId": 1, "productId": 1 }, { unique: true });

// Banners collection indexes
db.banners.createIndex({ "isActive": 1 });
db.banners.createIndex({ "order": 1 });

// OTPs collection indexes
db.otps.createIndex({ "phone": 1 });
db.otps.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

// Supports collection indexes
db.supports.createIndex({ "userId": 1 });
db.supports.createIndex({ "status": 1 });
db.supports.createIndex({ "createdAt": -1 });

print('Database initialization completed successfully!');
print('Created collections: users, products, categories, orders, carts, wishlists, banners, otps, supports');
print('Created indexes for optimal performance');
print('Created application user: shoppers9_user');