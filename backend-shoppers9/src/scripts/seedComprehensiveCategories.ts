import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Category } from '../models/Category';
import { connectDB } from '../config/database';

// Load environment variables
dotenv.config();

const comprehensiveCategories = [
  // Level 1 Categories
  {
    name: 'Men',
    slug: 'men',
    level: 1,
    description: 'Men\'s clothing and accessories',
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'Women',
    slug: 'women',
    level: 1,
    description: 'Women\'s clothing and accessories',
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    level: 1,
    description: 'Electronic devices and gadgets',
    isActive: true,
    sortOrder: 3
  },
  {
    name: 'Home & Garden',
    slug: 'home-garden',
    level: 1,
    description: 'Home improvement and garden supplies',
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

const seedComprehensiveCategories = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert comprehensive categories
    const createdCategories = await Category.insertMany(comprehensiveCategories);
    console.log(`Created ${createdCategories.length} categories:`);
    
    createdCategories.forEach(category => {
      console.log(`- ${category.name} (${category.slug})`);
    });

    // Now create Level 2 subcategories
    const menCategory = createdCategories.find(cat => cat.slug === 'men');
    const womenCategory = createdCategories.find(cat => cat.slug === 'women');
    const electronicsCategory = createdCategories.find(cat => cat.slug === 'electronics');

    const level2Categories = [];

    if (menCategory) {
      level2Categories.push(
        {
          name: 'Men Clothing',
          slug: 'men-clothing',
          level: 2,
          description: 'Men\'s clothing items',
          parentCategory: menCategory._id,
          isActive: true,
          sortOrder: 1
        },
        {
          name: 'Men Shoes',
          slug: 'men-shoes',
          level: 2,
          description: 'Men\'s footwear',
          parentCategory: menCategory._id,
          isActive: true,
          sortOrder: 2
        },
        {
          name: 'Men Accessories',
          slug: 'men-accessories',
          level: 2,
          description: 'Men\'s accessories',
          parentCategory: menCategory._id,
          isActive: true,
          sortOrder: 3
        }
      );
    }

    if (womenCategory) {
      level2Categories.push(
        {
          name: 'Women Clothing',
          slug: 'women-clothing',
          level: 2,
          description: 'Women\'s clothing items',
          parentCategory: womenCategory._id,
          isActive: true,
          sortOrder: 1
        },
        {
          name: 'Women Shoes',
          slug: 'women-shoes',
          level: 2,
          description: 'Women\'s footwear',
          parentCategory: womenCategory._id,
          isActive: true,
          sortOrder: 2
        },
        {
          name: 'Women Accessories',
          slug: 'women-accessories',
          level: 2,
          description: 'Women\'s accessories',
          parentCategory: womenCategory._id,
          isActive: true,
          sortOrder: 3
        }
      );
    }

    if (electronicsCategory) {
      level2Categories.push(
        {
          name: 'Smartphones',
          slug: 'smartphones',
          level: 2,
          description: 'Mobile phones and smartphones',
          parentCategory: electronicsCategory._id,
          isActive: true,
          sortOrder: 1
        },
        {
          name: 'Laptops',
          slug: 'laptops',
          level: 2,
          description: 'Laptops and notebooks',
          parentCategory: electronicsCategory._id,
          isActive: true,
          sortOrder: 2
        }
      );
    }

    if (level2Categories.length > 0) {
      const createdLevel2Categories = await Category.insertMany(level2Categories);
      console.log(`\nCreated ${createdLevel2Categories.length} Level 2 categories:`);
      createdLevel2Categories.forEach(category => {
        console.log(`- ${category.name} (${category.slug})`);
      });

      // Create Level 3 subcategories for men's clothing
      const menClothingCategory = createdLevel2Categories.find(cat => cat.slug === 'men-clothing');
      const level3Categories = [];

      if (menClothingCategory) {
        level3Categories.push(
          {
            name: 'Men T-Shirts',
            slug: 'men-tshirts',
            level: 3,
            description: 'Men\'s t-shirts and casual tops',
            parentCategory: menClothingCategory._id,
            isActive: true,
            sortOrder: 1
          },
          {
            name: 'Men Jeans',
            slug: 'men-jeans',
            level: 3,
            description: 'Men\'s jeans and denim',
            parentCategory: menClothingCategory._id,
            isActive: true,
            sortOrder: 2
          },
          {
            name: 'Men Shirts',
            slug: 'men-shirts',
            level: 3,
            description: 'Men\'s formal and casual shirts',
            parentCategory: menClothingCategory._id,
            isActive: true,
            sortOrder: 3
          }
        );
      }

      if (level3Categories.length > 0) {
        const createdLevel3Categories = await Category.insertMany(level3Categories);
        console.log(`\nCreated ${createdLevel3Categories.length} Level 3 categories:`);
        createdLevel3Categories.forEach(category => {
          console.log(`- ${category.name} (${category.slug})`);
        });
      }
    }

    console.log('\n✅ Comprehensive categories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedComprehensiveCategories();