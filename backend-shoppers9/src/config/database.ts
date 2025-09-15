import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.log('⚠️  No MONGODB_URI found in environment variables');
      console.log('🔧 Using in-memory database for development');
      return;
    }

    // Set connection timeout to prevent hanging
    const connectionOptions: any = {
      serverSelectionTimeoutMS: 30000, // 30 second timeout for DocumentDB
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: false,
    };

    // Add SSL configuration for DocumentDB
    if (mongoUri.includes('docdb.amazonaws.com')) {
      connectionOptions.ssl = true;
      connectionOptions.sslValidate = false; // DocumentDB uses self-signed certificates
      connectionOptions.sslCA = undefined; // Don't validate CA for DocumentDB
    }
    
    // MongoDB Atlas configuration
    if (mongoUri.includes('mongodb.net')) {
      connectionOptions.ssl = true;
      connectionOptions.authSource = 'admin';
      connectionOptions.retryWrites = true;
      connectionOptions.w = 'majority';
    }

    try {
      await mongoose.connect(mongoUri, connectionOptions);
    } catch (error: any) {
      console.error('❌ MongoDB connection failed:', error.message);
    }
    
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        
      }
      process.exit(0);
    });

  } catch (error) {
    // Don't exit the process, allow server to run without DB
  }
};

const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    
  } catch (error) {
    
  }
};

export { disconnectDatabase };