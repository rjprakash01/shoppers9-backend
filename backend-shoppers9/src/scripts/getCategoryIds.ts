import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { Category } from '../models/Category';

// Load environment variables
dotenv.config();

const getCategoryIds = async () => {
  try {
    await connectDB();
    const categories = await Category.find({}, '_id name');
    console.log('Available categories:');
    categories.forEach(cat => {
      console.log(`${cat.name}: ${cat._id}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error getting categories:', error);
    process.exit(1);
  }
};

getCategoryIds();