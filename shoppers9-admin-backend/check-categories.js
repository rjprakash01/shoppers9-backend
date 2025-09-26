const mongoose = require('mongoose');
const Category = require('./dist/models/Category').default;
const connectDB = require('./dist/config/database').default;

(async () => {
  try {
    await connectDB();
    
    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');
    
    // Create categories with proper parent relationships
    const categoryMap = new Map();
    
    // Level 1 categories
    const men = await Category.create({
      name: 'Men',
      description: 'Men\'s clothing and accessories',
      slug: 'men',
      level: 1,
      sortOrder: 1,
      isActive: true
    });
    categoryMap.set('men', men._id);
    
    const women = await Category.create({
      name: 'Women',
      description: 'Women\'s clothing and accessories',
      slug: 'women',
      level: 1,
      sortOrder: 2,
      isActive: true
    });
    categoryMap.set('women', women._id);
    
    const household = await Category.create({
      name: 'Household',
      description: 'Home and household items',
      slug: 'household',
      level: 1,
      sortOrder: 3,
      isActive: true
    });
    categoryMap.set('household', household._id);
    
    // Level 2 categories - Men's
    const menClothing = await Category.create({
      name: 'Clothing',
      description: 'Men\'s clothing items',
      slug: 'men-clothing',
      level: 2,
      parentCategory: men._id,
      sortOrder: 1,
      isActive: true
    });
    categoryMap.set('men-clothing', menClothing._id);
    
    const menFootwear = await Category.create({
      name: 'Footwear',
      description: 'Men\'s shoes and footwear',
      slug: 'men-footwear',
      level: 2,
      parentCategory: men._id,
      sortOrder: 2,
      isActive: true
    });
    categoryMap.set('men-footwear', menFootwear._id);
    
    // Level 2 categories - Women's
    const womenClothing = await Category.create({
      name: 'Clothing',
      description: 'Women\'s clothing items',
      slug: 'women-clothing',
      level: 2,
      parentCategory: women._id,
      sortOrder: 1,
      isActive: true
    });
    categoryMap.set('women-clothing', womenClothing._id);
    
    // Level 3 categories - Men's Clothing
    const menShirts = await Category.create({
      name: 'Shirts',
      description: 'Men\'s formal and casual shirts',
      slug: 'men-clothing-shirts',
      level: 3,
      parentCategory: menClothing._id,
      sortOrder: 2,
      isActive: true
    });
    categoryMap.set('men-clothing-shirts', menShirts._id);
    
    const menTshirts = await Category.create({
      name: 'T-Shirts',
      description: 'Men\'s t-shirts and casual tops',
      slug: 'men-clothing-tshirts',
      level: 3,
      parentCategory: menClothing._id,
      sortOrder: 1,
      isActive: true
    });
    categoryMap.set('men-clothing-tshirts', menTshirts._id);
    
    console.log('Categories created successfully!');
    console.log('\nCategory hierarchy:');
    
    const categories = await Category.find({}).populate('parentCategory', 'name').sort({level: 1, sortOrder: 1});
    categories.forEach(cat => {
      const parent = cat.parentCategory ? cat.parentCategory.name : 'None';
      console.log(`Level ${cat.level}: ${cat.name} (slug: ${cat.slug}) - Parent: ${parent}`);
    });
    
    console.log('\nMen-Clothing-Shirts category details:');
    const menClothingShirts = await Category.findOne({slug: 'men-clothing-shirts'}).populate('parentCategory');
    if (menClothingShirts) {
      console.log(`ID: ${menClothingShirts._id}`);
      console.log(`Name: ${menClothingShirts.name}`);
      console.log(`Slug: ${menClothingShirts.slug}`);
      console.log(`Level: ${menClothingShirts.level}`);
      console.log(`Parent: ${menClothingShirts.parentCategory ? menClothingShirts.parentCategory.name : 'None'}`);
    } else {
      console.log('men-clothing-shirts category not found!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();