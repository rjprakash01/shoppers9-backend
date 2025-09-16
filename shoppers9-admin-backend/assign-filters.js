const mongoose = require('mongoose');
const path = require('path');

// Import models
const CategoryFilter = require('./src/models/CategoryFilter').default;
const Category = require('./src/models/Category').default;
const Filter = require('./src/models/Filter').default;

async function assignFilters() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');
    
    // Find T-SHIRT category
    const tshirtCategory = await Category.findOne({name: /t-shirt/i});
    console.log('T-shirt category:', tshirtCategory?._id, tshirtCategory?.name);
    
    // Find filters
    const sizeFilter = await Filter.findOne({name: /size/i});
    const colorFilter = await Filter.findOne({name: /color/i});
    
    console.log('Size filter:', sizeFilter?._id, sizeFilter?.name);
    console.log('Color filter:', colorFilter?._id, colorFilter?.name);
    
    // Assign SIZE filter to T-SHIRT category
    if (tshirtCategory && sizeFilter) {
      const existing = await CategoryFilter.findOne({
        category: tshirtCategory._id, 
        filter: sizeFilter._id
      });
      
      if (!existing) {
        await CategoryFilter.create({
          category: tshirtCategory._id,
          filter: sizeFilter._id,
          isRequired: false,
          isActive: true,
          sortOrder: 1
        });
        console.log('✅ Created SIZE filter assignment for T-SHIRT');
      } else {
        console.log('SIZE filter already assigned to T-SHIRT');
      }
    }
    
    // Assign COLOR filter to T-SHIRT category
    if (tshirtCategory && colorFilter) {
      const existing = await CategoryFilter.findOne({
        category: tshirtCategory._id, 
        filter: colorFilter._id
      });
      
      if (!existing) {
        await CategoryFilter.create({
          category: tshirtCategory._id,
          filter: colorFilter._id,
          isRequired: false,
          isActive: true,
          sortOrder: 2
        });
        console.log('✅ Created COLOR filter assignment for T-SHIRT');
      } else {
        console.log('COLOR filter already assigned to T-SHIRT');
      }
    }
    
    console.log('Filter assignment completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

assignFilters();