const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define schemas
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  subCategory: String,
  brand: String,
  images: [String],
  variants: [{
    size: String,
    color: String,
    price: Number,
    stock: Number,
    sku: String
  }],
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});

const categorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  level: Number,
  isActive: Boolean
});

const filterSchema = new mongoose.Schema({
  name: String,
  slug: String
});

const filterOptionSchema = new mongoose.Schema({
  filter: { type: mongoose.Schema.Types.ObjectId, ref: 'Filter' },
  value: String,
  displayValue: String
});

const productFilterValueSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  filter: { type: mongoose.Schema.Types.ObjectId, ref: 'Filter', required: true },
  filterOption: { type: mongoose.Schema.Types.ObjectId, ref: 'FilterOption' },
  customValue: String
});

const Product = mongoose.model('Product', productSchema);
const Category = mongoose.model('Category', categorySchema);
const Filter = mongoose.model('Filter', filterSchema);
const FilterOption = mongoose.model('FilterOption', filterOptionSchema);
const ProductFilterValue = mongoose.model('ProductFilterValue', productFilterValueSchema);

// Product data templates for different categories
const productTemplates = {
  'T-SHIRT': [
    { name: 'Classic Cotton T-Shirt', description: 'Comfortable 100% cotton t-shirt perfect for everyday wear', price: 25.99, brand: 'Nike' },
    { name: 'Vintage Graphic Tee', description: 'Retro-style graphic t-shirt with vintage print', price: 29.99, brand: 'Adidas' },
    { name: 'Premium Polo Shirt', description: 'High-quality polo shirt for casual and semi-formal occasions', price: 45.99, brand: 'Puma' },
    { name: 'Sports Performance Tee', description: 'Moisture-wicking athletic t-shirt for workouts', price: 35.99, brand: 'Nike' },
    { name: 'Organic Cotton Basic Tee', description: 'Eco-friendly organic cotton t-shirt', price: 32.99, brand: 'Uniqlo' },
    { name: 'Striped Long Sleeve Shirt', description: 'Stylish striped long sleeve t-shirt', price: 38.99, brand: 'Zara' },
    { name: 'V-Neck Essential Tee', description: 'Classic v-neck t-shirt in various colors', price: 22.99, brand: 'H&M' },
    { name: 'Henley Button Shirt', description: 'Casual henley shirt with button placket', price: 41.99, brand: 'Gap' },
    { name: 'Oversized Streetwear Tee', description: 'Trendy oversized t-shirt for street style', price: 33.99, brand: 'Forever21' },
    { name: 'Pocket Detail T-Shirt', description: 'Simple t-shirt with chest pocket detail', price: 27.99, brand: 'Levis' }
  ],
  'JEANS': [
    { name: 'Classic Straight Leg Jeans', description: 'Timeless straight leg denim jeans', price: 79.99, brand: 'Levis' },
    { name: 'Skinny Fit Dark Wash Jeans', description: 'Modern skinny fit jeans in dark wash', price: 89.99, brand: 'Zara' },
    { name: 'Relaxed Fit Vintage Jeans', description: 'Comfortable relaxed fit with vintage styling', price: 95.99, brand: 'Gap' },
    { name: 'High-Waisted Mom Jeans', description: 'Trendy high-waisted mom jeans', price: 85.99, brand: 'H&M' },
    { name: 'Distressed Ripped Jeans', description: 'Edgy distressed jeans with ripped details', price: 92.99, brand: 'Forever21' },
    { name: 'Bootcut Flare Jeans', description: 'Retro bootcut jeans with slight flare', price: 88.99, brand: 'Levis' },
    { name: 'Stretch Comfort Jeans', description: 'Comfortable stretch denim for all-day wear', price: 75.99, brand: 'Uniqlo' },
    { name: 'Raw Selvedge Denim', description: 'Premium raw selvedge denim jeans', price: 149.99, brand: 'Levis' },
    { name: 'Cropped Ankle Jeans', description: 'Stylish cropped jeans perfect for summer', price: 82.99, brand: 'Zara' },
    { name: 'Wide Leg Palazzo Jeans', description: 'Fashion-forward wide leg denim', price: 98.99, brand: 'H&M' }
  ],
  'SHOES': [
    { name: 'Classic White Sneakers', description: 'Versatile white leather sneakers', price: 120.99, brand: 'Nike' },
    { name: 'Running Athletic Shoes', description: 'High-performance running shoes', price: 145.99, brand: 'Adidas' },
    { name: 'Canvas Low-Top Sneakers', description: 'Casual canvas sneakers for everyday wear', price: 65.99, brand: 'Puma' },
    { name: 'High-Top Basketball Shoes', description: 'Professional basketball shoes with ankle support', price: 165.99, brand: 'Nike' },
    { name: 'Minimalist Training Shoes', description: 'Lightweight shoes for cross-training', price: 98.99, brand: 'Reebok' },
    { name: 'Retro Vintage Sneakers', description: 'Classic retro-style sneakers', price: 110.99, brand: 'Adidas' },
    { name: 'Slip-On Casual Shoes', description: 'Easy slip-on shoes for convenience', price: 75.99, brand: 'Puma' },
    { name: 'Hiking Trail Shoes', description: 'Durable shoes for outdoor activities', price: 135.99, brand: 'Nike' },
    { name: 'Fashion Platform Sneakers', description: 'Trendy platform sneakers for style', price: 89.99, brand: 'Reebok' },
    { name: 'Breathable Mesh Runners', description: 'Lightweight mesh running shoes', price: 125.99, brand: 'Adidas' }
  ],
  'SANDALS': [
    { name: 'Leather Strap Sandals', description: 'Comfortable leather sandals for summer', price: 55.99, brand: 'Nike' },
    { name: 'Sport Hiking Sandals', description: 'Durable sandals for outdoor adventures', price: 75.99, brand: 'Adidas' },
    { name: 'Flip Flop Beach Sandals', description: 'Classic flip flops for beach days', price: 25.99, brand: 'Puma' },
    { name: 'Platform Fashion Sandals', description: 'Stylish platform sandals for summer fashion', price: 68.99, brand: 'Zara' },
    { name: 'Adjustable Strap Sandals', description: 'Comfortable sandals with adjustable straps', price: 49.99, brand: 'H&M' },
    { name: 'Waterproof Pool Sandals', description: 'Quick-dry sandals perfect for poolside', price: 35.99, brand: 'Nike' },
    { name: 'Bohemian Beaded Sandals', description: 'Decorative sandals with beaded details', price: 62.99, brand: 'Forever21' },
    { name: 'Minimalist Slide Sandals', description: 'Simple slide sandals for easy wear', price: 42.99, brand: 'Uniqlo' },
    { name: 'Cork Footbed Sandals', description: 'Ergonomic sandals with cork footbed', price: 78.99, brand: 'Gap' },
    { name: 'Gladiator Style Sandals', description: 'Fashion-forward gladiator sandals', price: 71.99, brand: 'Zara' }
  ],
  'SAREE': [
    { name: 'Silk Traditional Saree', description: 'Elegant silk saree for special occasions', price: 199.99, brand: 'Zara' },
    { name: 'Cotton Casual Saree', description: 'Comfortable cotton saree for daily wear', price: 89.99, brand: 'H&M' },
    { name: 'Embroidered Designer Saree', description: 'Beautiful embroidered saree with intricate work', price: 299.99, brand: 'Forever21' },
    { name: 'Georgette Party Saree', description: 'Flowing georgette saree perfect for parties', price: 159.99, brand: 'Uniqlo' },
    { name: 'Printed Floral Saree', description: 'Vibrant floral printed saree', price: 129.99, brand: 'Gap' },
    { name: 'Chiffon Lightweight Saree', description: 'Airy chiffon saree for summer events', price: 139.99, brand: 'Zara' },
    { name: 'Handloom Artisan Saree', description: 'Authentic handloom saree supporting artisans', price: 249.99, brand: 'H&M' },
    { name: 'Sequin Glamour Saree', description: 'Sparkling sequin saree for glamorous events', price: 279.99, brand: 'Forever21' },
    { name: 'Border Design Saree', description: 'Classic saree with decorative border', price: 169.99, brand: 'Uniqlo' },
    { name: 'Contemporary Fusion Saree', description: 'Modern fusion saree with contemporary styling', price: 189.99, brand: 'Gap' }
  ],
  'DRESSES': [
    { name: 'Little Black Dress', description: 'Classic little black dress for any occasion', price: 125.99, brand: 'Zara' },
    { name: 'Summer Floral Sundress', description: 'Light and breezy floral sundress', price: 79.99, brand: 'H&M' },
    { name: 'Cocktail Party Dress', description: 'Elegant cocktail dress for evening events', price: 189.99, brand: 'Forever21' },
    { name: 'Casual Midi Dress', description: 'Versatile midi dress for everyday wear', price: 95.99, brand: 'Uniqlo' },
    { name: 'Maxi Boho Dress', description: 'Flowing bohemian maxi dress', price: 149.99, brand: 'Gap' },
    { name: 'Wrap Style Dress', description: 'Flattering wrap dress in solid colors', price: 109.99, brand: 'Zara' },
    { name: 'Shirt Dress Professional', description: 'Professional shirt dress for work', price: 135.99, brand: 'H&M' },
    { name: 'Off-Shoulder Party Dress', description: 'Trendy off-shoulder dress for parties', price: 159.99, brand: 'Forever21' },
    { name: 'A-Line Vintage Dress', description: 'Retro-inspired A-line dress', price: 119.99, brand: 'Uniqlo' },
    { name: 'Bodycon Fitted Dress', description: 'Form-fitting bodycon dress', price: 89.99, brand: 'Gap' }
  ],
  'UTENSILS': [
    { name: 'Stainless Steel Cookware Set', description: 'Professional 10-piece stainless steel cookware set', price: 299.99, brand: 'Nike' },
    { name: 'Non-Stick Frying Pan', description: 'High-quality non-stick frying pan', price: 45.99, brand: 'Adidas' },
    { name: 'Ceramic Dinner Plate Set', description: 'Elegant ceramic dinner plates set of 6', price: 89.99, brand: 'Puma' },
    { name: 'Silicone Cooking Utensils', description: 'Heat-resistant silicone cooking utensil set', price: 35.99, brand: 'Zara' },
    { name: 'Glass Storage Containers', description: 'Airtight glass food storage containers', price: 65.99, brand: 'H&M' },
    { name: 'Bamboo Cutting Board', description: 'Eco-friendly bamboo cutting board', price: 28.99, brand: 'Uniqlo' },
    { name: 'Stainless Steel Mixing Bowls', description: 'Nested stainless steel mixing bowl set', price: 42.99, brand: 'Gap' },
    { name: 'Cast Iron Dutch Oven', description: 'Heavy-duty cast iron dutch oven', price: 159.99, brand: 'Forever21' },
    { name: 'Measuring Cups and Spoons', description: 'Precise measuring cups and spoons set', price: 22.99, brand: 'Levis' },
    { name: 'Kitchen Knife Set', description: 'Professional kitchen knife set with block', price: 199.99, brand: 'Reebok' }
  ],
  'TOOLS': [
    { name: 'Cordless Drill Set', description: 'Powerful cordless drill with bit set', price: 149.99, brand: 'Nike' },
    { name: 'Hammer Multi-Tool', description: 'Versatile hammer with multiple functions', price: 35.99, brand: 'Adidas' },
    { name: 'Screwdriver Set', description: 'Complete screwdriver set with various sizes', price: 28.99, brand: 'Puma' },
    { name: 'Adjustable Wrench', description: 'Heavy-duty adjustable wrench', price: 22.99, brand: 'Zara' },
    { name: 'Tool Box Organizer', description: 'Portable tool box with compartments', price: 89.99, brand: 'H&M' },
    { name: 'Level Measuring Tool', description: 'Precision level for accurate measurements', price: 45.99, brand: 'Uniqlo' },
    { name: 'Pliers Set', description: 'Professional pliers set for various tasks', price: 55.99, brand: 'Gap' },
    { name: 'Utility Knife', description: 'Sharp utility knife with replaceable blades', price: 18.99, brand: 'Forever21' },
    { name: 'Socket Wrench Set', description: 'Complete socket wrench set with case', price: 125.99, brand: 'Levis' },
    { name: 'Tape Measure', description: 'Durable tape measure for construction', price: 15.99, brand: 'Reebok' }
  ]
};

// Filter value mappings
const filterValueMappings = {
  'size': ['xs', 's', 'm', 'l', 'xl', 'xxl', '6', '7', '8', '9', '10', '11', '12'],
  'color': ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'gray', 'navy'],
  'material': ['cotton', 'polyester', 'wool', 'silk', 'linen', 'denim', 'leather', 'canvas', 'nylon', 'spandex'],
  'brand': ['nike', 'adidas', 'puma', 'reebok', 'zara', 'h&m', 'uniqlo', 'levis', 'gap', 'forever21'],
  'style': ['casual', 'formal', 'sporty', 'vintage', 'bohemian', 'minimalist', 'streetwear', 'preppy'],
  'season': ['spring', 'summer', 'autumn', 'winter', 'all-season'],
  'fit-type': ['slim-fit', 'regular-fit', 'loose-fit', 'oversized', 'tailored'],
  'occasion': ['work', 'party', 'wedding', 'gym', 'travel', 'date-night', 'everyday'],
  'gender': ['men', 'women', 'unisex', 'kids']
};

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateVariants() {
  const variants = [];
  const sizes = ['S', 'M', 'L', 'XL'];
  const colors = ['Black', 'White', 'Blue', 'Red'];
  
  for (let i = 0; i < 3; i++) {
    variants.push({
      size: getRandomElement(sizes),
      color: getRandomElement(colors),
      price: Math.floor(Math.random() * 50) + 20,
      stock: Math.floor(Math.random() * 100) + 10,
      sku: `SKU${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    });
  }
  
  return variants;
}

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');

    // Get level 3 categories
    const level3Categories = await Category.find({ level: 3, isActive: true });
    console.log(`Found ${level3Categories.length} level 3 categories`);

    // Get all filters and their options
    const filters = await Filter.find({});
    const filterOptions = await FilterOption.find({}).populate('filter');
    
    console.log(`Found ${filters.length} filters and ${filterOptions.length} filter options`);

    // Clear existing products and filter values
    await Product.deleteMany({});
    await ProductFilterValue.deleteMany({});
    console.log('Cleared existing products and filter values');

    let totalProducts = 0;
    let totalFilterValues = 0;

    // Create products for each level 3 category
    for (const category of level3Categories) {
      const categoryName = category.name.toUpperCase();
      const templates = productTemplates[categoryName] || productTemplates['T-SHIRT']; // Fallback
      
      console.log(`\n📦 Creating products for category: ${categoryName}`);
      
      for (let i = 0; i < 10; i++) {
        const template = templates[i] || templates[0]; // Use template or fallback to first
        
        // Create product
        const product = new Product({
          name: template.name,
          description: template.description,
          price: template.price,
          category: category._id,
          subCategory: category._id,
          brand: template.brand,
          images: [`/uploads/products/${categoryName.toLowerCase()}_${i + 1}.jpg`],
          variants: generateVariants(),
          isActive: true,
          isFeatured: Math.random() > 0.7, // 30% chance of being featured
          tags: [categoryName.toLowerCase(), template.brand.toLowerCase(), 'new'],
        });
        
        await product.save();
        totalProducts++;
        
        // Assign random filter values
        for (const filter of filters) {
          const filterSlug = filter.slug || filter.name.toLowerCase().replace(/\s+/g, '-');
          const availableValues = filterValueMappings[filterSlug];
          
          if (availableValues) {
            const randomValue = getRandomElement(availableValues);
            
            // Find the corresponding filter option
            const filterOption = filterOptions.find(opt => 
              opt.filter._id.toString() === filter._id.toString() && 
              opt.value === randomValue
            );
            
            if (filterOption) {
              const productFilterValue = new ProductFilterValue({
                product: product._id,
                filter: filter._id,
                filterOption: filterOption._id
              });
              
              await productFilterValue.save();
              totalFilterValues++;
            }
          }
        }
        
        console.log(`  ✅ Created: ${template.name}`);
      }
    }

    console.log(`\n🎉 Product seeding completed successfully!`);
    console.log(`\n📊 Summary:`);
    console.log(`- Level 3 Categories: ${level3Categories.length}`);
    console.log(`- Total Products Created: ${totalProducts}`);
    console.log(`- Total Filter Values: ${totalFilterValues}`);
    console.log(`- Products per Category: 10`);
    
    // Verify counts
    const verifyProducts = await Product.countDocuments();
    const verifyFilterValues = await ProductFilterValue.countDocuments();
    console.log(`\n✅ Verification:`);
    console.log(`- Products in database: ${verifyProducts}`);
    console.log(`- Filter values in database: ${verifyFilterValues}`);
    
  } catch (error) {
    console.error('Error seeding products:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the seeding function
seedProducts();