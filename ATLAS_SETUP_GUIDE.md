# MongoDB Atlas Setup Guide for Shoppers9

This guide will help you set up the dual-database architecture in MongoDB Atlas from scratch.

## Prerequisites

- MongoDB Atlas account (free tier is sufficient for development)
- Node.js installed on your system
- Access to your project's environment variables

## Step 1: Create MongoDB Atlas Cluster

1. **Sign up/Login to MongoDB Atlas**
   - Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
   - Create an account or log in

2. **Create a New Cluster**
   - Click "Build a Database"
   - Choose "FREE" shared cluster
   - Select your preferred cloud provider and region
   - Name your cluster (e.g., "shoppers9-cluster")
   - Click "Create Cluster"

3. **Configure Database Access**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and strong password
   - Set privileges to "Atlas admin" for full access
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development, you can click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production, add only your specific IP addresses
   - Click "Confirm"

## Step 2: Get Connection Strings

1. **Get Connection String**
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Select "Node.js" and version "4.1 or later"
   - Copy the connection string
   - It will look like: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`

2. **Create Database-Specific Connection Strings**
   Both databases will be hosted on the same cluster but as separate databases:
   - For admin database: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/admin_db?retryWrites=true&w=majority`
   - For main website database: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/main_website_db?retryWrites=true&w=majority`
   - Replace `<username>`, `<password>`, and `<cluster>` with your actual credentials
   - Note: Both databases use the same cluster but different database names

## Step 3: Update Environment Variables

1. **Update Admin Backend .env**
   ```bash
   # File: shoppers9-admin-backend/.env
   ADMIN_DB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/admin_db?retryWrites=true&w=majority
   MAIN_DB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/main_website_db?retryWrites=true&w=majority
   ```

2. **Update Main Backend .env**
   ```bash
   # File: backend-shoppers9/.env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/main_website_db?retryWrites=true&w=majority
   ```

3. **Create Scripts .env**
   ```bash
   # File: scripts/.env
   ADMIN_DB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/admin_db?retryWrites=true&w=majority
   MAIN_DB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/main_website_db?retryWrites=true&w=majority
   ```

## Step 4: Run Database Initialization

1. **Install Script Dependencies**
   ```bash
   cd scripts
   npm install
   ```

2. **Run Initialization Script**
   ```bash
   npm run init-atlas
   ```

   The script will:
   - Connect to both databases
   - Create all necessary collections
   - Set up indexes for optimal performance
   - Create an admin user (username: admin, password: admin123)
   - Insert initial categories
   - Configure default settings
   - Test connections

## Step 5: Verify Setup

1. **Check Atlas Dashboard**
   - Go to your MongoDB Atlas dashboard
   - You should see two databases: `admin_db` and `main_website_db`
   - Each should contain the appropriate collections

2. **Test Backend Connections**
   ```bash
   # Start admin backend
   cd shoppers9-admin-backend
   npm run dev
   
   # Start main backend (in another terminal)
   cd backend-shoppers9
   npm run dev
   ```

3. **Login to Admin Panel**
   - Open http://localhost:3000
   - Login with:
     - Username: admin
     - Password: admin123

## Step 6: Test Dual-Write Functionality

1. **Create a Product**
   - Use the admin panel to create a new product
   - Check both databases in Atlas to verify the product appears in both

2. **Create a Category**
   - Use the admin panel to create a new category
   - Verify it appears in both databases

## Troubleshooting

### Connection Issues
- Verify your IP address is whitelisted in Network Access
- Check that your username/password are correct
- Ensure the connection string format is correct

### Authentication Errors
- Make sure the database user has proper permissions
- Verify the password doesn't contain special characters that need URL encoding

### Database Not Found
- MongoDB Atlas creates databases automatically when first accessed
- If databases don't appear, try running the initialization script again

### Script Errors
- Check that all environment variables are set correctly
- Ensure you're in the scripts directory when running npm commands
- Verify Node.js version compatibility

## Security Best Practices

1. **Production Setup**
   - Use specific IP addresses instead of 0.0.0.0/0
   - Create separate users with minimal required permissions
   - Use strong, unique passwords
   - Enable MongoDB Atlas encryption

2. **Environment Variables**
   - Never commit .env files to version control
   - Use different credentials for development and production
   - Regularly rotate passwords

## Next Steps

After successful setup:
1. Test all CRUD operations through the admin panel
2. Verify data synchronization between databases
3. Set up monitoring and alerts in MongoDB Atlas
4. Configure backup schedules
5. Plan for production deployment

## Support

If you encounter issues:
1. Check the MongoDB Atlas documentation
2. Review the console logs for specific error messages
3. Verify all connection strings and credentials
4. Test network connectivity to MongoDB Atlas