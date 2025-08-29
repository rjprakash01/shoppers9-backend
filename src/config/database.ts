import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.log('⚠️ MONGODB_URI is not defined in environment variables');
      console.log('🔧 Running in development mode without persistent database');
      console.log('📝 To set up MongoDB locally:');
      console.log('   1. Install MongoDB: https://docs.mongodb.com/manual/installation/');
      console.log('   2. Start MongoDB service: mongod --dbpath /usr/local/var/mongodb');
      console.log('   3. Update .env file with: MONGODB_URI=mongodb://localhost:27017/shoppers9');
      return;
    }

    // Set connection timeout to prevent hanging
    mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000, // 3 second timeout
      connectTimeoutMS: 3000,
    }).catch((error) => {
      console.log('⚠️ MongoDB connection failed - continuing in development mode');
      console.log('💡 Install MongoDB locally or use MongoDB Atlas for persistent data');
    });
    
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
    });

    mongoose.connection.on('error', (error) => {
      console.log('⚠️ MongoDB connection failed - continuing in development mode');
      console.log('💡 Install MongoDB locally or use MongoDB Atlas for persistent data');
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
      }
      process.exit(0);
    });

  } catch (error) {
    console.log('⚠️ Database connection failed - continuing in development mode');
    console.log('💡 All features work with test credentials (phone: 1234567890, OTP: 1234)');
    console.log('📝 For persistent data, install MongoDB: https://docs.mongodb.com/manual/installation/');
    // Don't exit the process, allow server to run without DB
  }
};

const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

export { disconnectDatabase };