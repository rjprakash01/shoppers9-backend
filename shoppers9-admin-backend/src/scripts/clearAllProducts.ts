import mongoose from 'mongoose';
import Product from '../models/Product';
import connectDB from '../config/database';

const clearAllProducts = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Clearing all products from database...');
    const result = await Product.deleteMany({});
    
    console.log(`Successfully deleted ${result.deletedCount} products`);
    console.log('All products have been cleared from all categories');
    
    console.log('Disconnecting from database...');
    await mongoose.disconnect();
    
    process.exit(0);
  } catch (error) {
    console.error('Error clearing products:', error);
    process.exit(1);
  }
};

// Run the script
clearAllProducts();