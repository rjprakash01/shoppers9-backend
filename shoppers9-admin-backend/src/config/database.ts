import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9';
    
    await mongoose.connect(mongoURI);

  } catch (error) {

    // Don't exit the process, allow the app to continue running
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  
});

mongoose.connection.on('error', (error) => {
  
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  
  process.exit(0);
});

export default connectDB;