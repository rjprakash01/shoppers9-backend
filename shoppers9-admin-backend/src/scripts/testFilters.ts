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
    console.log('🔌 Connecting to database...');
    console.log('Database URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9');
    await connectDB();
    
    console.log('\n📊 Testing Filters...');
    
    // Test 1: Check if filters exist
    const filters = await Filter.find({}).limit(5);
    console.log(`✅ Found ${filters.length} filters`);
    if (filters.length > 0) {
      console.log('Sample filters:', filters.map(f => f.name));
    }
    
    // Test 2: Check filter options
    const filterOptions = await FilterOption.find({}).limit(10);
    console.log(`✅ Found ${filterOptions.length} filter options`);
    
    // Test 3: Check categories (level 2 and 3 only)
    const categories = await Category.find({ level: { $in: [2, 3] } }).limit(5);
    console.log(`✅ Found ${categories.length} level 2/3 categories`);
    if (categories.length > 0) {
      console.log('Sample categories:', categories.map(c => `${c.name} (level ${c.level})`));
    }
    
    // Test 4: Check category filters
    const categoryFilters = await CategoryFilter.find({}).populate('filter').limit(5);
    console.log(`✅ Found ${categoryFilters.length} category filter assignments`);
    
    // Test 5: If no category filters exist, create some
    if (categoryFilters.length === 0 && categories.length > 0 && filters.length > 0) {
      console.log('\n🔧 No category filters found. Creating some...');
      
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
            console.log(`✅ Assigned filter "${filter.name}" to category "${targetCategory.name}"`);
          }
        }
      }
    }
    
    // Test 6: Final verification
    const finalCategoryFilters = await CategoryFilter.find({}).populate('filter category');
    console.log(`\n🎉 Final count: ${finalCategoryFilters.length} category filter assignments`);
    
    if (finalCategoryFilters.length > 0) {
      console.log('\nAssignments:');
      finalCategoryFilters.forEach(cf => {
        const filter = cf.filter as any;
        const category = cf.category as any;
        console.log(`  - ${filter?.name || 'Unknown Filter'} → ${category?.name || 'Unknown Category'} (Required: ${cf.isRequired})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n📴 Disconnecting from database...');
    await mongoose.disconnect();
    process.exit(0);
  }
};

testFilters();