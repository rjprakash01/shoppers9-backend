import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category';
import connectDB from '../config/database';

// Load environment variables
dotenv.config();

interface CategoryData {
  name: string;
  description: string;
  slug: string;
  level: number;
  parentCategory?: string;
  sortOrder: number;
  isActive: boolean;
}

const categoriesData: CategoryData[] = [
  // Level 1 - Main Categories
  {
    name: 'Men',
    description: 'Men\'s clothing and accessories',
    slug: 'men',
    level: 1,
    sortOrder: 1,
    isActive: true
  },
  {
    name: 'Women',
    description: 'Women\'s clothing and accessories',
    slug: 'women',
    level: 1,
    sortOrder: 2,
    isActive: true
  },
  {
    name: 'Household',
    description: 'Home and household items',
    slug: 'household',
    level: 1,
    sortOrder: 3,
    isActive: true
  },

  // Level 2 - Men's Subcategories
  {
    name: 'Clothing',
    description: 'Men\'s clothing items',
    slug: 'men-clothing',
    level: 2,
    parentCategory: 'men',
    sortOrder: 1,
    isActive: true
  },
  {
    name: 'Footwear',
    description: 'Men\'s shoes and footwear',
    slug: 'men-footwear',
    level: 2,
    parentCategory: 'men',
    sortOrder: 2,
    isActive: true
  },
  {
    name: 'Accessories',
    description: 'Men\'s accessories',
    slug: 'men-accessories',
    level: 2,
    parentCategory: 'men',
    sortOrder: 3,
    isActive: true
  },

  // Level 2 - Women's Subcategories
  {
    name: 'Clothing',
    description: 'Women\'s clothing items',
    slug: 'women-clothing',
    level: 2,
    parentCategory: 'women',
    sortOrder: 1,
    isActive: true
  },
  {
    name: 'Footwear',
    description: 'Women\'s shoes and footwear',
    slug: 'women-footwear',
    level: 2,
    parentCategory: 'women',
    sortOrder: 2,
    isActive: true
  },
  {
    name: 'Accessories',
    description: 'Women\'s accessories',
    slug: 'women-accessories',
    level: 2,
    parentCategory: 'women',
    sortOrder: 3,
    isActive: true
  },

  // Level 2 - Household Subcategories
  {
    name: 'Furniture',
    description: 'Home furniture items',
    slug: 'furniture',
    level: 2,
    parentCategory: 'household',
    sortOrder: 1,
    isActive: true
  },
  {
    name: 'Kitchenware',
    description: 'Kitchen appliances and utensils',
    slug: 'kitchenware',
    level: 2,
    parentCategory: 'household',
    sortOrder: 2,
    isActive: true
  },

  // Level 3 - Men's Clothing Sub-subcategories
  {
    name: 'T-Shirts',
    description: 'Men\'s t-shirts and casual tops',
    slug: 'men-tshirts',
    level: 3,
    parentCategory: 'men-clothing',
    sortOrder: 1,
    isActive: true
  },
  {
    name: 'Shirts',
    description: 'Men\'s formal and casual shirts',
    slug: 'men-shirts',
    level: 3,
    parentCategory: 'men-clothing',
    sortOrder: 2,
    isActive: true
  },
  {
    name: 'Jeans',
    description: 'Men\'s jeans and denim',
    slug: 'men-jeans',
    level: 3,
    parentCategory: 'men-clothing',
    sortOrder: 3,
    isActive: true
  },
  {
    name: 'Trousers',
    description: 'Men\'s formal and casual trousers',
    slug: 'men-trousers',
    level: 3,
    parentCategory: 'men-clothing',
    sortOrder: 4,
    isActive: true
  },

  // Level 3 - Men's Footwear Sub-subcategories
  {
    name: 'Sneakers',
    description: 'Men\'s sneakers and casual shoes',
    slug: 'men-sneakers',
    level: 3,
    parentCategory: 'men-footwear',
    sortOrder: 1,
    isActive: true
  },
  {
    name: 'Formal Shoes',
    description: 'Men\'s formal shoes',
    slug: 'men-formal-shoes',
    level: 3,
    parentCategory: 'men-footwear',
    sortOrder: 2,
    isActive: true
  },

  // Level 3 - Women's Clothing Sub-subcategories
  {
    name: 'Tops',
    description: 'Women\'s tops and blouses',
    slug: 'women-tops',
    level: 3,
    parentCategory: 'women-clothing',
    sortOrder: 1,
    isActive: true
  },
  {
    name: 'Dresses',
    description: 'Women\'s dresses',
    slug: 'women-dresses',
    level: 3,
    parentCategory: 'women-clothing',
    sortOrder: 2,
    isActive: true
  },
  {
    name: 'Jeans',
    description: 'Women\'s jeans and denim',
    slug: 'women-jeans',
    level: 3,
    parentCategory: 'women-clothing',
    sortOrder: 3,
    isActive: true
  },

  // Level 3 - Women's Footwear Sub-subcategories
  {
    name: 'Heels',
    description: 'Women\'s heels and formal shoes',
    slug: 'women-heels',
    level: 3,
    parentCategory: 'women-footwear',
    sortOrder: 1,
    isActive: true
  },
  {
    name: 'Flats',
    description: 'Women\'s flat shoes and sandals',
    slug: 'women-flats',
    level: 3,
    parentCategory: 'women-footwear',
    sortOrder: 2,
    isActive: true
  },

  // Level 3 - Furniture Sub-subcategories
  {
    name: 'Chairs',
    description: 'Dining and office chairs',
    slug: 'chairs',
    level: 3,
    parentCategory: 'furniture',
    sortOrder: 1,
    isActive: true
  },
  {
    name: 'Tables',
    description: 'Dining and coffee tables',
    slug: 'tables',
    level: 3,
    parentCategory: 'furniture',
    sortOrder: 2,
    isActive: true
  },

  // Level 3 - Kitchenware Sub-subcategories
  {
    name: 'Cookware',
    description: 'Pots, pans, and cooking utensils',
    slug: 'cookware',
    level: 3,
    parentCategory: 'kitchenware',
    sortOrder: 1,
    isActive: true
  },
  {
    name: 'Storage',
    description: 'Kitchen storage containers',
    slug: 'kitchen-storage',
    level: 3,
    parentCategory: 'kitchenware',
    sortOrder: 2,
    isActive: true
  }
];

const seedCategories = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDB();

    // Clear existing categories
    await Category.deleteMany({});

    // Create categories level by level to handle parent references
    const categoryMap = new Map<string, string>(); // slug -> _id mapping

    // Level 1 categories
    const level1Categories = categoriesData.filter(cat => cat.level === 1);
    for (const categoryData of level1Categories) {
      const category = new Category(categoryData);
      const savedCategory = await category.save();
      categoryMap.set(categoryData.slug, savedCategory._id.toString());
      
    }

    // Level 2 categories
    const level2Categories = categoriesData.filter(cat => cat.level === 2);
    for (const categoryData of level2Categories) {
      const parentId = categoryMap.get(categoryData.parentCategory!);
      if (parentId) {
        const category = new Category({
          ...categoryData,
          parentCategory: parentId
        });
        const savedCategory = await category.save();
        categoryMap.set(categoryData.slug, savedCategory._id.toString());
        
      }
    }

    // Level 3 categories
    const level3Categories = categoriesData.filter(cat => cat.level === 3);
    for (const categoryData of level3Categories) {
      const parentId = categoryMap.get(categoryData.parentCategory!);
      if (parentId) {
        const category = new Category({
          ...categoryData,
          parentCategory: parentId
        });
        const savedCategory = await category.save();
        categoryMap.set(categoryData.slug, savedCategory._id.toString());
        
      }
    }

    // Display category tree
    const categories = await Category.find({}).populate('parentCategory', 'name');

    const level1 = categories.filter(cat => cat.level === 1);
    for (const cat1 of level1) {
      
      const level2 = categories.filter(cat => cat.level === 2 && cat.parentCategory?.toString() === cat1._id.toString());
      for (const cat2 of level2) {
        
        const level3 = categories.filter(cat => cat.level === 3 && cat.parentCategory?.toString() === cat2._id.toString());
        for (const cat3 of level3) {
          
        }
      }
    }

  } catch (error) {
    
  } finally {
    // Close database connection
    await mongoose.connection.close();
    
    process.exit(0);
  }
};

// Run the seeder
if (require.main === module) {
  seedCategories();
}

export default seedCategories;