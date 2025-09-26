import mongoose from 'mongoose';
import Category from './src/models/Category';
import connectDB from './src/config/database';

(async () => {
  try {
    await connectDB();
    
    const cats = await Category.find({level: 3}).sort({name: 1});
    console.log('Level 3 categories:');
    cats.forEach(c => console.log(`- ${c.name} (slug: ${c.slug})`));
    
    console.log('\nAll categories with "shirt" in name or slug:');
    const shirtCats = await Category.find({
      $or: [
        {name: /shirt/i},
        {slug: /shirt/i}
      ]
    });
    shirtCats.forEach(c => console.log(`- ${c.name} (slug: ${c.slug}, level: ${c.level})`));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();