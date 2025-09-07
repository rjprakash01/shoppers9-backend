# MongoDB Atlas Setup Guide for Shoppers9

This guide will help you set up MongoDB Atlas for your Shoppers9 application and migrate from AWS DocumentDB.

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account or log in if you already have one
3. Create a new project called "Shoppers9"

## Step 2: Create a Cluster

1. Click "Build a Database"
2. Choose the **FREE** tier (M0 Sandbox)
3. Select a cloud provider and region (preferably AWS and us-east-1 for consistency)
4. Name your cluster "shoppers9-cluster"
5. Click "Create Cluster"

## Step 3: Configure Database Access

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `shoppers9_admin`
5. Password: Generate a strong password (save it securely)
6. Database User Privileges: Select "Read and write to any database"
7. Click "Add User"

## Step 4: Configure Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow access from anywhere" (0.0.0.0/0) for now
   - Note: In production, you should restrict this to your application's IP addresses
4. Click "Confirm"

## Step 5: Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version "4.1 or later"
5. Copy the connection string - it will look like:
   ```
   mongodb+srv://shoppers9_admin:<password>@shoppers9-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with the actual password you created
7. Add the database name at the end: `/shoppers9`

Final connection string format:
```
mongodb+srv://shoppers9_admin:YOUR_PASSWORD@shoppers9-cluster.xxxxx.mongodb.net/shoppers9?retryWrites=true&w=majority
```

## Step 6: Update Application Configuration

### For Local Development:
1. Update your `.env` file:
   ```
   MONGODB_URI=mongodb+srv://shoppers9_admin:YOUR_PASSWORD@shoppers9-cluster.xxxxx.mongodb.net/shoppers9?retryWrites=true&w=majority
   ```

### For AWS Production:
1. Update the AWS Secrets Manager secret:
   ```bash
   aws secretsmanager update-secret \
     --secret-id shoppers9/mongodb-uri \
     --secret-string "mongodb+srv://shoppers9_admin:YOUR_PASSWORD@shoppers9-cluster.xxxxx.mongodb.net/shoppers9?retryWrites=true&w=majority"
   ```

2. Force new deployment of ECS service:
   ```bash
   aws ecs update-service --cluster shoppers9-cluster --service shoppers9-backend --force-new-deployment
   ```

## Step 7: Data Migration (Optional)

If you have existing data in DocumentDB that you want to migrate:

1. Export data from DocumentDB:
   ```bash
   mongodump --host shoppers9-docdb-cluster.cluster-ca9e4ucyq1fd.us-east-1.docdb.amazonaws.com:27017 \
     --username shoppers9_admin \
     --password YOUR_DOCDB_PASSWORD \
     --db shoppers9 \
     --ssl \
     --sslCAFile rds-combined-ca-bundle.pem \
     --sslAllowInvalidHostnames
   ```

2. Import data to MongoDB Atlas:
   ```bash
   mongorestore --uri "mongodb+srv://shoppers9_admin:YOUR_ATLAS_PASSWORD@shoppers9-cluster.xxxxx.mongodb.net/shoppers9" \
     --db shoppers9 \
     dump/shoppers9/
   ```

## Step 8: Verify Connection

1. Test the connection locally by running your application
2. Check the logs for successful MongoDB connection
3. Test API endpoints to ensure data operations work

## Benefits of MongoDB Atlas

- **Free tier available**: Perfect for development and small applications
- **Automatic backups**: Point-in-time recovery
- **Built-in monitoring**: Performance insights and alerts
- **Global clusters**: Easy to scale globally
- **Security features**: Encryption at rest and in transit
- **Easy scaling**: Upgrade/downgrade cluster size as needed

## Important Notes

1. **Security**: In production, restrict network access to specific IP addresses
2. **Monitoring**: Set up alerts for database performance and usage
3. **Backups**: Configure backup schedules according to your needs
4. **Scaling**: Monitor your usage and upgrade cluster tier when needed

## Next Steps After Setup

1. Provide me with your MongoDB Atlas connection string
2. I'll help you update the application configuration
3. We'll test the connection and deploy to production
4. Optionally migrate existing data from DocumentDB

---

**Ready to proceed?** Once you've completed steps 1-5 and have your connection string, share it with me and I'll help you configure the application!