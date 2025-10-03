import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Category } from '../models/Category';
import { connectDB } from '../config/database';

// Load environment variables
dotenv.config();

const basicCategories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    level: 1,
    description: 'Electronic devices and gadgets',
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    level: 1,
    description: 'Clothing and accessories',
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'Home & Garden',
    slug: 'home-garden',
    level: 1,
    description: 'Home improvement and garden supplies',
    isActive: true,
    sortOrder: 3
  },
  {
    name: 'Books',
    slug: 'books',
    level: 1,
    description: 'Books and educational materials',
    isActive: true,
    sortOrder: 4
  },
  {
    name: 'Sports',
    slug: 'sports',
    level: 1,
    description: 'Sports equipment and accessories',
    isActive: true,
    sortOrder: 5
  }
];

const seedBasicCategories = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert basic categories
    const createdCategories = await Category.insertMany(basicCategories);
    console.log(`Created ${createdCategories.length} categories:`);
    
    createdCategories.forEach(category => {
      console.log(`- ${category.name} (${category.slug})`);
    });

    console.log('\n✅ Basic categories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedBasicCategories();