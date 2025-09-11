import mongoose from 'mongoose';
import Filter from '../models/Filter';
import FilterOption from '../models/FilterOption';
import Category from '../models/Category';
import CategoryFilter from '../models/CategoryFilter';
import connectDB from '../config/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testFilters = async () => {
  try {

    await connectDB();

    // Test 1: Check if filters exist
    const filters = await Filter.find({}).limit(5);
    
    if (filters.length > 0) {
      );
    }
    
    // Test 2: Check filter options
    const filterOptions = await FilterOption.find({}).limit(10);

    // Test 3: Check categories (level 2 and 3 only)
    const categories = await Category.find({ level: { $in: [2, 3] } }).limit(5);
    
    if (categories.length > 0) {
      `));
    }
    
    // Test 4: Check category filters
    const categoryFilters = await CategoryFilter.find({}).populate('filter').limit(5);

    // Test 5: If no category filters exist, create some
    if (categoryFilters.length === 0 && categories.length > 0 && filters.length > 0) {

      const targetCategory = categories[0]; // Take first level 2/3 category
      const targetFilters = filters.slice(0, 3); // Take first 3 filters
      
      if (targetCategory && targetFilters.length > 0) {
        for (let i = 0; i < targetFilters.length; i++) {
          const filter = targetFilters[i];
          if (filter && targetCategory) {
            const categoryFilter = new CategoryFilter({
              category: targetCategory._id,
              filter: filter._id,
              isRequired: i === 0, // Make first filter required
              sortOrder: i
            });
            
            await categoryFilter.save();
            
          }
        }
      }
    }
    
    // Test 6: Final verification
    const finalCategoryFilters = await CategoryFilter.find({}).populate('filter category');

    if (finalCategoryFilters.length > 0) {
      
      finalCategoryFilters.forEach(cf => {
        const filter = cf.filter as any;
        const category = cf.category as any;
        `);
      });
    }
    
  } catch (error) {
    
  } finally {
    
    await mongoose.disconnect();
    process.exit(0);
  }
};

testFilters();