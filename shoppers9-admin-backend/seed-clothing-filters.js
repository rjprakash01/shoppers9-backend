const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Filter schema
const filterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  type: { type: String, enum: ['single', 'multiple', 'range'], default: 'multiple' },
  unit: String,
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

// Filter Option schema
const filterOptionSchema = new mongoose.Schema({
  filter: { type: mongoose.Schema.Types.ObjectId, ref: 'Filter', required: true },
  value: { type: String, required: true },
  displayValue: { type: String, required: true },
  colorCode: String,
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

const Filter = mongoose.model('Filter', filterSchema);
const FilterOption = mongoose.model('FilterOption', filterOptionSchema);

// Clothing and Footwear Filters Data
const filtersData = [
  {
    name: 'Size',
    slug: 'size',
    type: 'multiple',
    unit: null,
    sortOrder: 1,
    options: [
      { value: 'xs', label: 'XS', sortOrder: 1 },
      { value: 's', label: 'S', sortOrder: 2 },
      { value: 'm', label: 'M', sortOrder: 3 },
      { value: 'l', label: 'L', sortOrder: 4 },
      { value: 'xl', label: 'XL', sortOrder: 5 },
      { value: 'xxl', label: 'XXL', sortOrder: 6 },
      { value: '6', label: '6', sortOrder: 7 },
      { value: '7', label: '7', sortOrder: 8 },
      { value: '8', label: '8', sortOrder: 9 },
      { value: '9', label: '9', sortOrder: 10 },
      { value: '10', label: '10', sortOrder: 11 },
      { value: '11', label: '11', sortOrder: 12 },
      { value: '12', label: '12', sortOrder: 13 }
    ]
  },
  {
    name: 'Color',
    slug: 'color',
    type: 'multiple',
    unit: null,
    sortOrder: 2,
    options: [
      { value: 'black', label: 'Black', colorCode: '#000000', sortOrder: 1 },
      { value: 'white', label: 'White', colorCode: '#FFFFFF', sortOrder: 2 },
      { value: 'red', label: 'Red', colorCode: '#FF0000', sortOrder: 3 },
      { value: 'blue', label: 'Blue', colorCode: '#0000FF', sortOrder: 4 },
      { value: 'green', label: 'Green', colorCode: '#008000', sortOrder: 5 },
      { value: 'yellow', label: 'Yellow', colorCode: '#FFFF00', sortOrder: 6 },
      { value: 'pink', label: 'Pink', colorCode: '#FFC0CB', sortOrder: 7 },
      { value: 'purple', label: 'Purple', colorCode: '#800080', sortOrder: 8 },
      { value: 'orange', label: 'Orange', colorCode: '#FFA500', sortOrder: 9 },
      { value: 'brown', label: 'Brown', colorCode: '#A52A2A', sortOrder: 10 },
      { value: 'gray', label: 'Gray', colorCode: '#808080', sortOrder: 11 },
      { value: 'navy', label: 'Navy', colorCode: '#000080', sortOrder: 12 }
    ]
  },
  {
    name: 'Material',
    slug: 'material',
    type: 'multiple',
    unit: 'liters',
    sortOrder: 3,
    options: [
      { value: 'cotton', label: 'Cotton (2.5L)', sortOrder: 1 },
      { value: 'polyester', label: 'Polyester (1.8L)', sortOrder: 2 },
      { value: 'wool', label: 'Wool (3.2L)', sortOrder: 3 },
      { value: 'silk', label: 'Silk (4.1L)', sortOrder: 4 },
      { value: 'linen', label: 'Linen (2.8L)', sortOrder: 5 },
      { value: 'denim', label: 'Denim (3.5L)', sortOrder: 6 },
      { value: 'leather', label: 'Leather (5.2L)', sortOrder: 7 },
      { value: 'canvas', label: 'Canvas (2.1L)', sortOrder: 8 },
      { value: 'nylon', label: 'Nylon (1.5L)', sortOrder: 9 },
      { value: 'spandex', label: 'Spandex (1.2L)', sortOrder: 10 }
    ]
  },
  {
    name: 'Brand',
    slug: 'brand',
    type: 'multiple',
    unit: null,
    sortOrder: 4,
    options: [
      { value: 'nike', label: 'Nike', sortOrder: 1 },
      { value: 'adidas', label: 'Adidas', sortOrder: 2 },
      { value: 'puma', label: 'Puma', sortOrder: 3 },
      { value: 'reebok', label: 'Reebok', sortOrder: 4 },
      { value: 'zara', label: 'Zara', sortOrder: 5 },
      { value: 'h&m', label: 'H&M', sortOrder: 6 },
      { value: 'uniqlo', label: 'Uniqlo', sortOrder: 7 },
      { value: 'levis', label: "Levi's", sortOrder: 8 },
      { value: 'gap', label: 'Gap', sortOrder: 9 },
      { value: 'forever21', label: 'Forever 21', sortOrder: 10 }
    ]
  },
  {
    name: 'Style',
    slug: 'style',
    type: 'multiple',
    unit: null,
    sortOrder: 5,
    options: [
      { value: 'casual', label: 'Casual', sortOrder: 1 },
      { value: 'formal', label: 'Formal', sortOrder: 2 },
      { value: 'sporty', label: 'Sporty', sortOrder: 3 },
      { value: 'vintage', label: 'Vintage', sortOrder: 4 },
      { value: 'bohemian', label: 'Bohemian', sortOrder: 5 },
      { value: 'minimalist', label: 'Minimalist', sortOrder: 6 },
      { value: 'streetwear', label: 'Streetwear', sortOrder: 7 },
      { value: 'preppy', label: 'Preppy', sortOrder: 8 }
    ]
  },
  {
    name: 'Price Range',
    slug: 'price-range',
    type: 'range',
    unit: 'USD',
    sortOrder: 6,
    options: [
      { value: '0-25', label: 'Under $25', sortOrder: 1 },
      { value: '25-50', label: '$25 - $50', sortOrder: 2 },
      { value: '50-100', label: '$50 - $100', sortOrder: 3 },
      { value: '100-200', label: '$100 - $200', sortOrder: 4 },
      { value: '200-500', label: '$200 - $500', sortOrder: 5 },
      { value: '500+', label: 'Above $500', sortOrder: 6 }
    ]
  },
  {
    name: 'Season',
    slug: 'season',
    type: 'multiple',
    unit: null,
    sortOrder: 7,
    options: [
      { value: 'spring', label: 'Spring', sortOrder: 1 },
      { value: 'summer', label: 'Summer', sortOrder: 2 },
      { value: 'autumn', label: 'Autumn', sortOrder: 3 },
      { value: 'winter', label: 'Winter', sortOrder: 4 },
      { value: 'all-season', label: 'All Season', sortOrder: 5 }
    ]
  },
  {
    name: 'Fit Type',
    slug: 'fit-type',
    type: 'multiple',
    unit: null,
    sortOrder: 8,
    options: [
      { value: 'slim-fit', label: 'Slim Fit', sortOrder: 1 },
      { value: 'regular-fit', label: 'Regular Fit', sortOrder: 2 },
      { value: 'loose-fit', label: 'Loose Fit', sortOrder: 3 },
      { value: 'oversized', label: 'Oversized', sortOrder: 4 },
      { value: 'tailored', label: 'Tailored', sortOrder: 5 }
    ]
  },
  {
    name: 'Occasion',
    slug: 'occasion',
    type: 'multiple',
    unit: null,
    sortOrder: 9,
    options: [
      { value: 'work', label: 'Work', sortOrder: 1 },
      { value: 'party', label: 'Party', sortOrder: 2 },
      { value: 'wedding', label: 'Wedding', sortOrder: 3 },
      { value: 'gym', label: 'Gym', sortOrder: 4 },
      { value: 'travel', label: 'Travel', sortOrder: 5 },
      { value: 'date-night', label: 'Date Night', sortOrder: 6 },
      { value: 'everyday', label: 'Everyday', sortOrder: 7 }
    ]
  },
  {
    name: 'Gender',
    slug: 'gender',
    type: 'multiple',
    unit: null,
    sortOrder: 10,
    options: [
      { value: 'men', label: 'Men', sortOrder: 1 },
      { value: 'women', label: 'Women', sortOrder: 2 },
      { value: 'unisex', label: 'Unisex', sortOrder: 3 },
      { value: 'kids', label: 'Kids', sortOrder: 4 }
    ]
  }
];

async function seedClothingFilters() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');

    // Clear existing filters and options
    await FilterOption.deleteMany({});
    await Filter.deleteMany({});
    console.log('Cleared existing filters and options');

    let totalFilters = 0;
    let totalOptions = 0;

    // Create filters and their options
    for (const filterData of filtersData) {
      // Create filter
      const filter = new Filter({
        name: filterData.name,
        slug: filterData.slug,
        type: filterData.type,
        unit: filterData.unit,
        sortOrder: filterData.sortOrder
      });
      
      await filter.save();
      totalFilters++;
      console.log(`✅ Created filter: ${filter.name}`);

      // Create filter options
      for (const optionData of filterData.options) {
        const option = new FilterOption({
          filter: filter._id,
          value: optionData.value,
          displayValue: optionData.label,
          colorCode: optionData.colorCode,
          sortOrder: optionData.sortOrder
        });
        
        await option.save();
        totalOptions++;
      }
      
      console.log(`   Added ${filterData.options.length} options`);
    }

    console.log('\n🎉 Clothing & Footwear filters seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`- Total Filters Created: ${totalFilters}`);
    console.log(`- Total Filter Options Created: ${totalOptions}`);
    
    console.log('\n📋 Created Filters:');
    filtersData.forEach((filter, index) => {
      const unit = filter.unit ? ` (${filter.unit})` : '';
      console.log(`${index + 1}. ${filter.name}${unit} - ${filter.options.length} options`);
    });
    
    console.log('\n🔍 Special Features:');
    console.log('- Material filter includes liter measurements');
    console.log('- Color filter includes hex color codes');
    console.log('- Price range filter for budget filtering');
    console.log('- Comprehensive options for clothing and footwear');
    
  } catch (error) {
    console.error('Error seeding clothing filters:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the seeding function
seedClothingFilters();