import mongoose from 'mongoose';

// Database connections
export let adminConnection: mongoose.Connection;
export let mainWebsiteConnection: mongoose.Connection;

const connectDB = async (): Promise<void> => {
  try {
    console.log('🔍 Environment variables check:');
    console.log('ADMIN_DB_URI:', process.env.ADMIN_DB_URI ? 'Found' : 'Not found');
    console.log('MAIN_DB_URI:', process.env.MAIN_DB_URI ? 'Found' : 'Not found');
    
    const adminURI = process.env.ADMIN_DB_URI || process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/admin_db';
    const mainURI = process.env.MAIN_DB_URI || adminURI.replace('/admin_db', '/main_website_db');
    
    console.log('🔗 Admin Backend connecting to databases:');
    console.log('📊 Admin DB:', adminURI.replace(/:[^:@]*@/, ':***@'));
    console.log('🌐 Main DB:', mainURI.replace(/:[^:@]*@/, ':***@'));
    
    // Connect to admin database using default mongoose connection
    await mongoose.connect(adminURI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    
    // Set the admin connection reference
    adminConnection = mongoose.connection;
    
    // Create separate connection for main website database
    mainWebsiteConnection = mongoose.createConnection(mainURI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to Admin Database');
    console.log('✅ Connected to Main Website Database');
    console.log('🎉 Database connections established successfully!');

  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
};

// Handle connection events for both databases
adminConnection?.on('disconnected', () => {
  console.log('🔌 Admin database disconnected');
});

adminConnection?.on('error', (error) => {
  console.error('❌ Admin database error:', error);
});

mainWebsiteConnection?.on('disconnected', () => {
  console.log('🔌 Main website database disconnected');
});

mainWebsiteConnection?.on('error', (error) => {
  console.error('❌ Main website database error:', error);
});

process.on('SIGINT', async () => {
  console.log('🔄 Closing database connections...');
  await adminConnection?.close();
  await mainWebsiteConnection?.close();
  console.log('🔌 Database connections closed');
  process.exit(0);
});

export default connectDB;