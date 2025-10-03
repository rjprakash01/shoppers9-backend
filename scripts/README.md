# Database Scripts for Shoppers9

This directory contains scripts for setting up and managing MongoDB databases for the Shoppers9 e-commerce platform.

## Scripts Overview

### 1. `init-atlas-databases.js`
Initializes MongoDB Atlas databases (admin_db and main_website_db) from scratch with all necessary collections, indexes, and initial data.

### 2. `init-three-atlas-databases.js`
Initializes all three MongoDB Atlas databases (admin_db, main_website_db, and shoppers9) from scratch with all necessary collections, indexes, and initial data.

### 3. `migrate-to-atlas.js`
Migrates existing data from local MongoDB to MongoDB Atlas.

## Quick Start

### Prerequisites

1. **MongoDB Atlas Account**: Create a free account at [MongoDB Atlas](https://cloud.mongodb.com)
2. **Node.js**: Ensure Node.js is installed on your system
3. **Atlas Cluster**: Set up a MongoDB Atlas cluster

### Step 1: Install Dependencies

```bash
cd scripts
npm install
```

### Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and replace the placeholders with your MongoDB Atlas credentials:
   ```env
   ADMIN_DB_URI=mongodb+srv://yourusername:yourpassword@yourcluster.mongodb.net/admin_db?retryWrites=true&w=majority
   MAIN_DB_URI=mongodb+srv://yourusername:yourpassword@yourcluster.mongodb.net/main_website_db?retryWrites=true&w=majority
   SHOPPERS9_DB_URI=mongodb+srv://yourusername:yourpassword@yourcluster.mongodb.net/shoppers9?retryWrites=true&w=majority
   ```
   
   **Note**: All three databases use the same cluster (`yourcluster`) but different database names (`admin_db`, `main_website_db`, and `shoppers9`). This is cost-effective and easier to manage than separate clusters.

### Step 3: Choose Your Setup Method

#### Option A: Fresh Atlas Setup (Two Databases)

If you're starting fresh with MongoDB Atlas and only need admin_db and main_website_db:

```bash
npm run init-atlas
```

#### Option B: Fresh Atlas Setup (Three Databases - Recommended)

If you're starting fresh with MongoDB Atlas and need all three databases (admin_db, main_website_db, and shoppers9):

```bash
npm run init-three-atlas
```

This will:
- Create all three databases (`admin_db`, `main_website_db`, and `shoppers9`)
- Set up all necessary collections
- Create indexes for optimal performance
- Insert initial data (categories, admin user, settings)
- Verify the setup

#### Option C: Migrate from Local MongoDB

If you have existing data in local MongoDB:

```bash
# First, run the three-database Atlas initialization
npm run init-three-atlas

# Then migrate your existing data
npm run migrate-to-atlas
```

## Script Details

### Atlas Initialization Scripts

#### Two-Database Setup

**File**: `init-atlas-databases.js`

**What it does**:
- Connects to MongoDB Atlas using your credentials
- Creates the following collections in `admin_db`:

#### Three-Database Setup (Recommended)

**File**: `init-three-atlas-databases.js`

**What it does**:
- Connects to MongoDB Atlas using your credentials
- Creates the following collections in `admin_db`:
  - `users` (admin users)
  - `products` (product catalog)
  - `categories` (product categories)
  - `orders` (order management)
  - `customers` (customer data)
  - `settings` (system settings)
  - `audit_logs` (activity logs)
- Creates the following collections in `main_website_db`:
  - `products` (public product data)
  - `categories` (public categories)
  - `users` (website users)
  - `orders` (customer orders)
  - `reviews` (product reviews)
  - `cart_items` (shopping cart data)
- Creates the following collections in `shoppers9` (general database):
  - `analytics` (usage analytics)
  - `logs` (application logs)
  - `sessions` (user sessions)
  - `cache` (cached data)
  - `notifications` (system notifications)
- Sets up indexes for optimal query performance
- Creates an admin user (username: `admin`, password: `admin123`)
- Inserts initial categories
- Configures default system settings

**Default Admin User**:
- Username: `admin`
- Password: `admin123`
- Email: `admin@shoppers9.com`
- Role: `admin`

⚠️ **Security Note**: Change the default admin password after first login!

### Migration Script

**File**: `migrate-to-atlas.js`

**What it does**:
- Connects to both local MongoDB and MongoDB Atlas
- Analyzes existing data in local databases
- Migrates all collections and documents
- Recreates indexes in Atlas
- Verifies data integrity after migration

**Usage**:
```bash
npm run migrate-to-atlas
```

## Configuration Files

### Environment Files

- `.env.example`: Template for environment variables
- `.env`: Your actual configuration (create from example)

### Backend Configuration Templates

- `../shoppers9-admin-backend/.env.atlas`: Template for admin backend
- `../backend-shoppers9/.env.atlas`: Template for main backend

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check your internet connection
   - Verify MongoDB Atlas cluster is running
   - Ensure your IP is whitelisted in Atlas Network Access

2. **Authentication Failed**
   - Verify username and password in connection string
   - Check that the database user has proper permissions
   - Ensure password doesn't contain special characters that need URL encoding

3. **Database Not Found**
   - MongoDB Atlas creates databases automatically on first write
   - If databases don't appear, try running the init script again

4. **Permission Denied**
   - Ensure your Atlas user has read/write permissions
   - Check that the user is assigned to the correct project

### URL Encoding Special Characters

If your password contains special characters, you need to URL encode them:

- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`
- `?` → `%3F`
- `#` → `%23`
- `[` → `%5B`
- `]` → `%5D`
- `%` → `%25`

### Getting Help

1. Check the console output for specific error messages
2. Verify all environment variables are set correctly
3. Test network connectivity to MongoDB Atlas
4. Review MongoDB Atlas documentation

## Next Steps

After successful database setup:

1. **Update Backend Services**:
   - Copy `.env.atlas` files to `.env` in respective backend directories
   - Update connection strings with your Atlas credentials
   - Restart backend services

2. **Test the Setup**:
   - Start both backend services
   - Access the admin panel at http://localhost:3000
   - Login with the default admin credentials
   - Create test products and categories
   - Verify data appears in both databases

3. **Security Hardening**:
   - Change default admin password
   - Create additional admin users as needed
   - Configure proper IP whitelisting in Atlas
   - Set up monitoring and alerts

4. **Production Preparation**:
   - Use separate Atlas clusters for staging and production
   - Configure backup schedules
   - Set up monitoring and alerting
   - Review and adjust performance settings

## Support

For additional help:
- Review the main setup guide: `../ATLAS_SETUP_GUIDE.md`
- Check MongoDB Atlas documentation
- Verify your Atlas cluster configuration
- Test network connectivity

## File Structure

```
scripts/
├── README.md                      # This file
├── package.json                   # Dependencies and scripts
├── .env.example                  # Environment template
├── .env                          # Your configuration (create this)
├── init-atlas-databases.js       # Two-database Atlas initialization script
├── init-three-atlas-databases.js # Three-database Atlas initialization script
└── migrate-to-atlas.js           # Migration script
```