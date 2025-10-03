// MongoDB Initialization Script for Shoppers9
// This script creates the necessary databases and users

print('Starting MongoDB initialization for Shoppers9...');

// Switch to admin database
db = db.getSiblingDB('admin');

// Create shoppers9 database and user
db = db.getSiblingDB('shoppers9');
db.createUser({
  user: 'shoppers9_user',
  pwd: 'shoppers9_password',
  roles: [
    { role: 'readWrite', db: 'shoppers9' }
  ]
});

// Create shoppers9_admin database and user
db = db.getSiblingDB('shoppers9_admin');
db.createUser({
  user: 'shoppers9_admin_user',
  pwd: 'shoppers9_admin_password',
  roles: [
    { role: 'readWrite', db: 'shoppers9_admin' }
  ]
});

// Create initial collections
db.createCollection('users');
db.createCollection('products');
db.createCollection('orders');
db.createCollection('categories');

print('MongoDB initialization completed successfully!');
