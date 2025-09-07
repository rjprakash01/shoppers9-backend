import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category';
import Filter from '../models/Filter';
import CategoryFilter from '../models/CategoryFilter';
import connectDB from '../config/database';

// Load environment variables
dotenv.config();

const assignCategoryFilters = async (): Promise<void> => {
  try {
    console.log('🔧 Starting category filter assignment...');

    // Connect to database
    await connectDB();

    // Clear existing category filter assignments
    await CategoryFilter.deleteMany({});
    console.log('🗑️  Cleared existing category filter assignments');

    // Get all categories and filters
    const categories = await Category.find({});
    const filters = await Filter.find({});

    console.log(`Found ${categories.length} categories and ${filters.length} filters`);

    // Define filter assignments for different category types
    const filterAssignments: Record<string, string[]> = {
      // Men's Clothing (T-Shirts, Shirts, etc.)
      'men-tshirts': ['size', 'color', 'fit', 'fabric', 'sleeve_type', 'pattern', 'occasion'],
      'men-shirts': ['size', 'color', 'fit', 'fabric', 'sleeve_type', 'neck_collar_type', 'pattern', 'occasion'],
      'men-jeans': ['size', 'color', 'fit', 'fabric', 'length', 'rise_type', 'wash_care'],
      'men-trousers': ['size', 'color', 'fit', 'fabric', 'length', 'occasion', 'closure'],
      
      // Men's Footwear
      'sneakers': ['shoe_size_men', 'color', 'material', 'sole_type', 'shoe_type'],
      'formal-shoes': ['shoe_size_men', 'color', 'material', 'sole_type', 'shoe_type'],
      
      // Women's Clothing
      'tops': ['size', 'color', 'fit', 'fabric', 'sleeve_type', 'pattern', 'occasion'],
      'dresses': ['size', 'color', 'fit', 'fabric', 'length', 'pattern', 'occasion'],
      'women-jeans': ['size', 'color', 'fit', 'fabric', 'length', 'rise_type', 'wash_care'],
      
      // Women's Footwear
      'heels': ['shoe_size_women', 'color', 'material', 'shoe_type'],
      'flats': ['shoe_size_women', 'color', 'material', 'shoe_type'],
      
      // Furniture
      'chairs': ['color_finish', 'material', 'furniture_type', 'dimensions'],
      'tables': ['color_finish', 'material', 'furniture_type', 'dimensions'],
      
      // Kitchenware
      'cookware': ['material', 'kitchenware_type', 'capacity'],
      'kitchen-storage': ['material', 'kitchenware_type', 'capacity']
    };

    let assignmentCount = 0;

    // Process each category
    for (const category of categories) {
      if (category.level >= 2) { // Only assign filters to level 2 and 3 categories
        const categorySlug = category.slug;
        const filterNames = filterAssignments[categorySlug] || [];
        
        if (filterNames.length > 0) {
          console.log(`\n📁 Assigning filters to category: ${category.name} (${categorySlug})`);
          
          for (let i = 0; i < filterNames.length; i++) {
            const filterName = filterNames[i];
            const filter = filters.find(f => f.name === filterName);
            
            if (filter) {
              const categoryFilter = new CategoryFilter({
                category: category._id,
                filter: filter._id,
                isRequired: i < 3, // First 3 filters are required
                isActive: true,
                sortOrder: i
              });
              
              await categoryFilter.save();
              assignmentCount++;
              console.log(`  ✅ Assigned filter: ${filter.displayName}`);
            } else {
              console.log(`  ❌ Filter not found: ${filterName}`);
            }
          }
        } else {
          // Assign default filters for categories without specific assignments
          const defaultFilters = ['color', 'size', 'material'].slice(0, 2);
          
          for (let i = 0; i < defaultFilters.length; i++) {
            const filterName = defaultFilters[i];
            const filter = filters.find(f => f.name === filterName);
            
            if (filter) {
              const categoryFilter = new CategoryFilter({
                category: category._id,
                filter: filter._id,
                isRequired: false,
                isActive: true,
                sortOrder: i
              });
              
              await categoryFilter.save();
              assignmentCount++;
              console.log(`  ✅ Assigned default filter to ${category.name}: ${filter.displayName}`);
            }
          }
        }
      }
    }

    console.log(`\n🎉 Category filter assignment completed!`);
    console.log(`📊 Total assignments created: ${assignmentCount}`);

    // Verify assignments
    const totalAssignments = await CategoryFilter.countDocuments();
    console.log(`📋 Total category filter assignments in database: ${totalAssignments}`);

  } catch (error) {
    console.error('❌ Error assigning category filters:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the assignment function
if (require.main === module) {
  assignCategoryFilters();
}

export default assignCategoryFilters;