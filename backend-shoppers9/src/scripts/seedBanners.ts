import mongoose from 'mongoose';
import { Banner } from '../models/Banner';
import { connectDB } from '../config/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sampleBanners = [
  {
    title: 'Summer Sale 2024',
    subtitle: 'Up to 70% OFF',
    description: 'Discover amazing deals on fashion, electronics, and home essentials',
    image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200&h=400&fit=crop',
    link: '/products?category=sale',
    buttonText: 'Shop Now',
    isActive: true,
    order: 1
  },
  {
    title: 'New Arrivals',
    subtitle: 'Fresh Fashion Trends',
    description: 'Explore the latest collection of trendy clothes and accessories',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
    link: '/products?sort=newest',
    buttonText: 'Explore Collection',
    isActive: true,
    order: 2
  }
];

async function seedBanners() {
  try {
    // Connect to database
    await connectDB();

    // Clear existing banners
    await Banner.deleteMany({});

    // Insert sample banners
    const createdBanners = await Banner.insertMany(sampleBanners);

    createdBanners.forEach((banner, index) => {
      
    });

  } catch (error) {
    
  } finally {
    // Close database connection
    await mongoose.connection.close();
    
    process.exit(0);
  }
}

// Run the seeding function
seedBanners();