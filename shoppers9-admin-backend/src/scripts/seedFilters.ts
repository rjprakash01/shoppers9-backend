import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Filter from '../models/Filter';
import FilterOption from '../models/FilterOption';
import connectDB from '../config/database';

// Load environment variables
dotenv.config();

interface FilterData {
  name: string;
  displayName: string;
  type: 'single' | 'multiple' | 'range';
  dataType: 'string' | 'number' | 'boolean';
  description?: string;
  options: {
    value: string;
    displayValue: string;
    colorCode?: string;
  }[];
}

const filtersData: FilterData[] = [
  // Size filters
  {
    name: 'size',
    displayName: 'Size',
    type: 'single',
    dataType: 'string',
    description: 'Product size',
    options: [
      { value: 'XS', displayValue: 'Extra Small' },
      { value: 'S', displayValue: 'Small' },
      { value: 'M', displayValue: 'Medium' },
      { value: 'L', displayValue: 'Large' },
      { value: 'XL', displayValue: 'Extra Large' },
      { value: 'XXL', displayValue: '2XL' },
      { value: '3XL', displayValue: '3XL' },
      { value: '4XL', displayValue: '4XL' }
    ]
  },
  
  // Waist size for pants
  {
    name: 'waist_size',
    displayName: 'Waist Size',
    type: 'single',
    dataType: 'number',
    description: 'Waist size in inches',
    options: [
      { value: '28', displayValue: '28"' },
      { value: '30', displayValue: '30"' },
      { value: '32', displayValue: '32"' },
      { value: '34', displayValue: '34"' },
      { value: '36', displayValue: '36"' },
      { value: '38', displayValue: '38"' },
      { value: '40', displayValue: '40"' },
      { value: '42', displayValue: '42"' }
    ]
  },

  // Color filter
  {
    name: 'color',
    displayName: 'Color',
    type: 'multiple',
    dataType: 'string',
    description: 'Product color',
    options: [
      { value: 'black', displayValue: 'Black', colorCode: '#000000' },
      { value: 'white', displayValue: 'White', colorCode: '#FFFFFF' },
      { value: 'blue', displayValue: 'Blue', colorCode: '#0066CC' },
      { value: 'red', displayValue: 'Red', colorCode: '#CC0000' },
      { value: 'green', displayValue: 'Green', colorCode: '#00CC00' },
      { value: 'yellow', displayValue: 'Yellow', colorCode: '#FFCC00' },
      { value: 'grey', displayValue: 'Grey', colorCode: '#808080' },
      { value: 'navy', displayValue: 'Navy', colorCode: '#000080' },
      { value: 'maroon', displayValue: 'Maroon', colorCode: '#800000' },
      { value: 'beige', displayValue: 'Beige', colorCode: '#F5F5DC' },
      { value: 'pink', displayValue: 'Pink', colorCode: '#FFC0CB' },
      { value: 'purple', displayValue: 'Purple', colorCode: '#800080' },
      { value: 'brown', displayValue: 'Brown', colorCode: '#A52A2A' },
      { value: 'orange', displayValue: 'Orange', colorCode: '#FFA500' },
      { value: 'olive', displayValue: 'Olive', colorCode: '#808000' },
      { value: 'multicolor', displayValue: 'Multi-color' }
    ]
  },

  // Fit filter
  {
    name: 'fit',
    displayName: 'Fit',
    type: 'single',
    dataType: 'string',
    description: 'Product fit type',
    options: [
      { value: 'slim_fit', displayValue: 'Slim Fit' },
      { value: 'regular_fit', displayValue: 'Regular Fit' },
      { value: 'relaxed_fit', displayValue: 'Relaxed Fit' },
      { value: 'oversized', displayValue: 'Oversized' },
      { value: 'skinny', displayValue: 'Skinny' },
      { value: 'tapered', displayValue: 'Tapered' },
      { value: 'loose', displayValue: 'Loose' }
    ]
  },

  // Fabric filter
  {
    name: 'fabric',
    displayName: 'Fabric',
    type: 'single',
    dataType: 'string',
    description: 'Fabric material',
    options: [
      { value: 'cotton', displayValue: 'Cotton' },
      { value: 'linen', displayValue: 'Linen' },
      { value: 'polyester', displayValue: 'Polyester' },
      { value: 'rayon', displayValue: 'Rayon' },
      { value: 'silk', displayValue: 'Silk' },
      { value: 'denim', displayValue: 'Denim' },
      { value: 'wool', displayValue: 'Wool' },
      { value: 'blended', displayValue: 'Blended' },
      { value: 'nylon', displayValue: 'Nylon' },
      { value: 'georgette', displayValue: 'Georgette' },
      { value: 'chiffon', displayValue: 'Chiffon' },
      { value: 'net', displayValue: 'Net' },
      { value: 'leather', displayValue: 'Leather' },
      { value: 'synthetic', displayValue: 'Synthetic' },
      { value: 'fleece', displayValue: 'Fleece' }
    ]
  },

  // Sleeve type filter
  {
    name: 'sleeve_type',
    displayName: 'Sleeve Type',
    type: 'single',
    dataType: 'string',
    description: 'Type of sleeve',
    options: [
      { value: 'full_sleeve', displayValue: 'Full Sleeve' },
      { value: 'half_sleeve', displayValue: 'Half Sleeve' },
      { value: 'sleeveless', displayValue: 'Sleeveless' },
      { value: 'three_quarter', displayValue: '3/4th Sleeve' }
    ]
  },

  // Neck/Collar type filter
  {
    name: 'neck_type',
    displayName: 'Neck/Collar Type',
    type: 'single',
    dataType: 'string',
    description: 'Type of neck or collar',
    options: [
      { value: 'round_neck', displayValue: 'Round Neck' },
      { value: 'v_neck', displayValue: 'V-Neck' },
      { value: 'polo_collar', displayValue: 'Polo Collar' },
      { value: 'mandarin_collar', displayValue: 'Mandarin Collar' },
      { value: 'crew_neck', displayValue: 'Crew Neck' },
      { value: 'hooded', displayValue: 'Hooded' }
    ]
  },

  // Pattern filter
  {
    name: 'pattern',
    displayName: 'Pattern',
    type: 'single',
    dataType: 'string',
    description: 'Pattern or design',
    options: [
      { value: 'solid', displayValue: 'Solid' },
      { value: 'striped', displayValue: 'Striped' },
      { value: 'checked', displayValue: 'Checked' },
      { value: 'printed', displayValue: 'Printed' },
      { value: 'embroidered', displayValue: 'Embroidered' },
      { value: 'floral', displayValue: 'Floral' },
      { value: 'polka_dots', displayValue: 'Polka Dots' },
      { value: 'geometric', displayValue: 'Geometric' }
    ]
  },

  // Occasion filter
  {
    name: 'occasion',
    displayName: 'Occasion',
    type: 'multiple',
    dataType: 'string',
    description: 'Suitable occasions',
    options: [
      { value: 'casual', displayValue: 'Casual' },
      { value: 'formal', displayValue: 'Formal' },
      { value: 'party', displayValue: 'Party' },
      { value: 'ethnic', displayValue: 'Ethnic' },
      { value: 'sportswear', displayValue: 'Sportswear' },
      { value: 'lounge', displayValue: 'Lounge' },
      { value: 'wedding', displayValue: 'Wedding' },
      { value: 'office', displayValue: 'Office' },
      { value: 'festive', displayValue: 'Festive' },
      { value: 'winter_wear', displayValue: 'Winter Wear' }
    ]
  },

  // Wash care filter
  {
    name: 'wash_care',
    displayName: 'Wash Care',
    type: 'single',
    dataType: 'string',
    description: 'Washing instructions',
    options: [
      { value: 'machine_wash', displayValue: 'Machine Wash' },
      { value: 'hand_wash', displayValue: 'Hand Wash' },
      { value: 'dry_clean_only', displayValue: 'Dry Clean Only' }
    ]
  },

  // Length filter (for pants, dresses, etc.)
  {
    name: 'length',
    displayName: 'Length',
    type: 'single',
    dataType: 'string',
    description: 'Product length',
    options: [
      { value: 'short', displayValue: 'Short' },
      { value: 'regular', displayValue: 'Regular' },
      { value: 'long', displayValue: 'Long' },
      { value: 'knee_length', displayValue: 'Knee Length' },
      { value: 'ankle_length', displayValue: 'Ankle Length' },
      { value: 'floor_length', displayValue: 'Floor Length' }
    ]
  },

  // Rise type filter (for pants)
  {
    name: 'rise_type',
    displayName: 'Rise Type',
    type: 'single',
    dataType: 'string',
    description: 'Rise type for pants',
    options: [
      { value: 'low_rise', displayValue: 'Low Rise' },
      { value: 'mid_rise', displayValue: 'Mid Rise' },
      { value: 'high_rise', displayValue: 'High Rise' }
    ]
  },

  // Style filter (for ethnic wear, furniture, etc.)
  {
    name: 'style',
    displayName: 'Style',
    type: 'single',
    dataType: 'string',
    description: 'Product style',
    options: [
      { value: 'anarkali', displayValue: 'Anarkali' },
      { value: 'straight', displayValue: 'Straight' },
      { value: 'a_line', displayValue: 'A-Line' },
      { value: 'indo_western', displayValue: 'Indo-Western' },
      { value: 'traditional', displayValue: 'Traditional' },
      { value: 'modern', displayValue: 'Modern' },
      { value: 'vintage', displayValue: 'Vintage' },
      { value: 'minimalist', displayValue: 'Minimalist' },
      { value: 'contemporary', displayValue: 'Contemporary' },
      { value: 'luxury', displayValue: 'Luxury' }
    ]
  },

  // Work/Embroidery filter
  {
    name: 'work_embroidery',
    displayName: 'Work/Embroidery',
    type: 'single',
    dataType: 'string',
    description: 'Type of work or embroidery',
    options: [
      { value: 'printed', displayValue: 'Printed' },
      { value: 'embroidered', displayValue: 'Embroidered' },
      { value: 'handloom', displayValue: 'Handloom' },
      { value: 'zari', displayValue: 'Zari' },
      { value: 'sequins', displayValue: 'Sequins' },
      { value: 'beads', displayValue: 'Beads' }
    ]
  },

  // Closure filter (for jackets, shoes, etc.)
  {
    name: 'closure',
    displayName: 'Closure',
    type: 'single',
    dataType: 'string',
    description: 'Type of closure',
    options: [
      { value: 'zipper', displayValue: 'Zipper' },
      { value: 'buttons', displayValue: 'Buttons' },
      { value: 'open_front', displayValue: 'Open Front' },
      { value: 'lace_up', displayValue: 'Lace-Up' },
      { value: 'slip_on', displayValue: 'Slip-On' },
      { value: 'velcro', displayValue: 'Velcro' },
      { value: 'buckle', displayValue: 'Buckle' }
    ]
  },

  // Shoe size filters
  {
    name: 'shoe_size_men',
    displayName: 'Shoe Size (Men)',
    type: 'single',
    dataType: 'number',
    description: 'Men shoe size (UK)',
    options: [
      { value: '6', displayValue: 'UK 6' },
      { value: '7', displayValue: 'UK 7' },
      { value: '8', displayValue: 'UK 8' },
      { value: '9', displayValue: 'UK 9' },
      { value: '10', displayValue: 'UK 10' },
      { value: '11', displayValue: 'UK 11' },
      { value: '12', displayValue: 'UK 12' }
    ]
  },

  {
    name: 'shoe_size_women',
    displayName: 'Shoe Size (Women)',
    type: 'single',
    dataType: 'number',
    description: 'Women shoe size (UK)',
    options: [
      { value: '3', displayValue: 'UK 3' },
      { value: '4', displayValue: 'UK 4' },
      { value: '5', displayValue: 'UK 5' },
      { value: '6', displayValue: 'UK 6' },
      { value: '7', displayValue: 'UK 7' },
      { value: '8', displayValue: 'UK 8' },
      { value: '9', displayValue: 'UK 9' }
    ]
  },

  // Shoe type filter
  {
    name: 'shoe_type',
    displayName: 'Shoe Type',
    type: 'single',
    dataType: 'string',
    description: 'Type of footwear',
    options: [
      { value: 'sneakers', displayValue: 'Sneakers' },
      { value: 'running_shoes', displayValue: 'Running Shoes' },
      { value: 'loafers', displayValue: 'Loafers' },
      { value: 'formal_shoes', displayValue: 'Formal Shoes' },
      { value: 'sandals', displayValue: 'Sandals' },
      { value: 'flip_flops', displayValue: 'Flip Flops' },
      { value: 'boots', displayValue: 'Boots' },
      { value: 'heels', displayValue: 'Heels' },
      { value: 'flats', displayValue: 'Flats' }
    ]
  },

  // Material filter
  {
    name: 'material',
    displayName: 'Material',
    type: 'single',
    dataType: 'string',
    description: 'Product material',
    options: [
      { value: 'leather', displayValue: 'Leather' },
      { value: 'synthetic', displayValue: 'Synthetic' },
      { value: 'mesh', displayValue: 'Mesh' },
      { value: 'canvas', displayValue: 'Canvas' },
      { value: 'rubber', displayValue: 'Rubber' },
      { value: 'suede', displayValue: 'Suede' },
      { value: 'fabric', displayValue: 'Fabric' },
      { value: 'metal', displayValue: 'Metal' },
      { value: 'plastic', displayValue: 'Plastic' },
      { value: 'wood', displayValue: 'Wood' },
      { value: 'glass', displayValue: 'Glass' },
      { value: 'bamboo', displayValue: 'Bamboo' },
      { value: 'ceramic', displayValue: 'Ceramic' },
      { value: 'stainless_steel', displayValue: 'Stainless Steel' },
      { value: 'aluminum', displayValue: 'Aluminum' }
    ]
  },

  // Sole type filter
  {
    name: 'sole_type',
    displayName: 'Sole Type',
    type: 'single',
    dataType: 'string',
    description: 'Type of shoe sole',
    options: [
      { value: 'rubber', displayValue: 'Rubber' },
      { value: 'eva', displayValue: 'EVA' },
      { value: 'leather_sole', displayValue: 'Leather Sole' },
      { value: 'air_cushion', displayValue: 'Air Cushion' }
    ]
  },

  // Gender filter
  {
    name: 'gender',
    displayName: 'Gender',
    type: 'single',
    dataType: 'string',
    description: 'Target gender',
    options: [
      { value: 'men', displayValue: 'Men' },
      { value: 'women', displayValue: 'Women' },
      { value: 'unisex', displayValue: 'Unisex' },
      { value: 'kids', displayValue: 'Kids' }
    ]
  },

  // Accessory type filter
  {
    name: 'accessory_type',
    displayName: 'Accessory Type',
    type: 'single',
    dataType: 'string',
    description: 'Type of accessory',
    options: [
      { value: 'handbag', displayValue: 'Handbag' },
      { value: 'backpack', displayValue: 'Backpack' },
      { value: 'sling_bag', displayValue: 'Sling Bag' },
      { value: 'tote', displayValue: 'Tote' },
      { value: 'wallet', displayValue: 'Wallet' },
      { value: 'belt', displayValue: 'Belt' },
      { value: 'cap', displayValue: 'Cap' },
      { value: 'watch', displayValue: 'Watch' },
      { value: 'sunglasses', displayValue: 'Sunglasses' }
    ]
  },

  // Furniture type filter
  {
    name: 'furniture_type',
    displayName: 'Furniture Type',
    type: 'single',
    dataType: 'string',
    description: 'Type of furniture',
    options: [
      { value: 'chair', displayValue: 'Chair' },
      { value: 'table', displayValue: 'Table' },
      { value: 'bed', displayValue: 'Bed' },
      { value: 'sofa', displayValue: 'Sofa' },
      { value: 'storage_unit', displayValue: 'Storage Unit' }
    ]
  },

  // Dimensions filter
  {
    name: 'dimensions',
    displayName: 'Dimensions',
    type: 'single',
    dataType: 'string',
    description: 'Product dimensions',
    options: [
      { value: 'small', displayValue: 'Small' },
      { value: 'medium', displayValue: 'Medium' },
      { value: 'large', displayValue: 'Large' }
    ]
  },

  // Color finish filter (for furniture)
  {
    name: 'color_finish',
    displayName: 'Color Finish',
    type: 'single',
    dataType: 'string',
    description: 'Color finish for furniture',
    options: [
      { value: 'natural_wood', displayValue: 'Natural Wood' },
      { value: 'dark_brown', displayValue: 'Dark Brown' },
      { value: 'black', displayValue: 'Black' },
      { value: 'white', displayValue: 'White' }
    ]
  },

  // Kitchenware type filter
  {
    name: 'kitchenware_type',
    displayName: 'Kitchenware Type',
    type: 'single',
    dataType: 'string',
    description: 'Type of kitchenware',
    options: [
      { value: 'cookware', displayValue: 'Cookware' },
      { value: 'dinnerware', displayValue: 'Dinnerware' },
      { value: 'storage', displayValue: 'Storage' },
      { value: 'appliances', displayValue: 'Appliances' }
    ]
  },

  // Capacity filter
  {
    name: 'capacity',
    displayName: 'Capacity',
    type: 'single',
    dataType: 'string',
    description: 'Product capacity',
    options: [
      { value: '500ml', displayValue: '500ml' },
      { value: '1l', displayValue: '1L' },
      { value: '2l', displayValue: '2L' },
      { value: '5l', displayValue: '5L+' }
    ]
  },

  // Price range filter
  {
    name: 'price_range',
    displayName: 'Price Range',
    type: 'range',
    dataType: 'number',
    description: 'Product price range',
    options: [
      { value: '0-500', displayValue: '₹0 - ₹500' },
      { value: '500-1000', displayValue: '₹500 - ₹1,000' },
      { value: '1000-5000', displayValue: '₹1,000 - ₹5,000' },
      { value: '5000+', displayValue: '₹5,000+' }
    ]
  }
];

const seedFilters = async (): Promise<void> => {
  try {

    // Connect to database
    await connectDB();

    // Clear existing filters and options
    await FilterOption.deleteMany({});
    await Filter.deleteMany({});

    let totalFilters = 0;
    let totalOptions = 0;

    for (const filterData of filtersData) {
      // Create filter
      const filter = new Filter({
        name: filterData.name,
        displayName: filterData.displayName,
        type: filterData.type,
        dataType: filterData.dataType,
        description: filterData.description,
        sortOrder: totalFilters
      });

      await filter.save();
      totalFilters++;

      // Create filter options
      const options = filterData.options.map((option, index) => ({
        filter: filter._id,
        value: option.value,
        displayValue: option.displayValue,
        colorCode: option.colorCode || null,
        sortOrder: index
      }));

      await FilterOption.insertMany(options);
      totalOptions += options.length;
      
    }

  } catch (error) {
    
  } finally {
    // Close database connection
    await mongoose.connection.close();
    
    process.exit(0);
  }
};

// Run the seeding function
if (require.main === module) {
  seedFilters();
}

export default seedFilters;