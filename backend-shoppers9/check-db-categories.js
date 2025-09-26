const mongoose = require('mongoose');
const { Category } = require('./src/models/Category');

const checkCategories = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    console.log('Connected to database');
    
    const level3Categories = await Category.find({level: 3, isActive: true}).lean();
    console.log('\nLevel 3 categories in database:');
    level3Categories.forEach(cat => {
      console.log(`- Name: "${cat.name}", Slug: "${cat.slug}", Parent: ${cat.parentCategory}`);
    });
    
    console.log('\nTotal Level 3 categories:', level3Categories.length);
    
    // Check for T-Shirts specifically
    const tshirtCategories = await Category.find({
      level: 3,
      isActive: true,
      $or: [
        { name: { $regex: /t.?shirt/i } },
        { slug: { $regex: /t.?shirt/i } }
      ]
    }).lean();
    
    console.log('\nT-Shirt related categories:');
    tshirtCategories.forEach(cat => {
      console.log(`- Name: "${cat.name}", Slug: "${cat.slug}"`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkCategories();