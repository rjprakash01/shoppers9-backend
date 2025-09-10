import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9';
    
    // DocumentDB SSL configuration
    const options: mongoose.ConnectOptions = {
      ssl: true,
      sslValidate: false, // Disable SSL certificate validation for DocumentDB
      tlsInsecure: true,  // Allow insecure SSL connections
      tlsAllowInvalidCertificates: true, // Allow invalid certificates
      tlsAllowInvalidHostnames: true,    // Allow invalid hostnames
    };
    
    await mongoose.connect(mongoURI, options);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📍 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('⚠️  Continuing without database connection for testing purposes');
    // Don't exit the process, allow the app to continue running
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('📴 MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB error:', error);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('📴 MongoDB connection closed through app termination');
  process.exit(0);
});

export default connectDB;