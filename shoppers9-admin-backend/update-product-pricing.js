const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define product schema
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
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
  stock: Number, // Main product stock
  isActive: Boolean,
  isFeatured: Boolean,
  tags: [String],
  createdAt: Date
});

const Product = mongoose.model('Product', productSchema);

// Define category schema
const categorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  level: Number,
  isActive: Boolean
});

const Category = mongoose.model('Category', categorySchema);

// Price ranges by category
const priceRanges = {
  'T-SHIRT': { min: 15.99, max: 89.99 },
  'JEANS': { min: 45.99, max: 199.99 },
  'SHOES': { min: 59.99, max: 299.99 },
  'SANDALS': { min: 19.99, max: 149.99 },
  'SAREE': { min: 79.99, max: 499.99 },
  'DRESSES': { min: 39.99, max: 299.99 },
  'UTENSILS': { min: 12.99, max: 399.99 },
  'TOOLS': { min: 8.99, max: 299.99 }
};

// Stock ranges by category
const stockRanges = {
  'T-SHIRT': { min: 25, max: 200 },
  'JEANS': { min: 15, max: 150 },
  'SHOES': { min: 10, max: 100 },
  'SANDALS': { min: 20, max: 180 },
  'SAREE': { min: 5, max: 75 },
  'DRESSES': { min: 12, max: 120 },
  'UTENSILS': { min: 30, max: 250 },
  'TOOLS': { min: 15, max: 200 }
};

function getRandomPrice(min, max) {
  const price = Math.random() * (max - min) + min;
  return Math.round(price * 100) / 100; // Round to 2 decimal places
}

function getRandomStock(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateVariantPricing(variants, basePrice) {
  return variants.map(variant => {
    // Variant prices can be ±20% of base price
    const variation = (Math.random() - 0.5) * 0.4; // -20% to +20%
    const variantPrice = basePrice * (1 + variation);
    
    return {
      ...variant,
      price: Math.round(variantPrice * 100) / 100,
      stock: getRandomStock(5, 50) // Individual variant stock
    };
  });
}

async function updateProductPricing() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');

    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to update`);

    let updatedCount = 0;

    for (const product of products) {
      // Get category name from product
      const categoryDoc = await Category.findById(product.category);
      const categoryName = categoryDoc ? categoryDoc.name.toUpperCase() : 'T-SHIRT';
      
      // Get price and stock ranges for this category
      const priceRange = priceRanges[categoryName] || priceRanges['T-SHIRT'];
      const stockRange = stockRanges[categoryName] || stockRanges['T-SHIRT'];
      
      // Generate new random price
      const newPrice = getRandomPrice(priceRange.min, priceRange.max);
      
      // Generate new random stock
      const newStock = getRandomStock(stockRange.min, stockRange.max);
      
      // Update variant pricing based on new base price
      const updatedVariants = updateVariantPricing(product.variants, newPrice);
      
      // Update the product
      await Product.findByIdAndUpdate(product._id, {
        price: newPrice,
        stock: newStock,
        variants: updatedVariants
      });
      
      updatedCount++;
      console.log(`✅ Updated: ${product.name} - Price: $${newPrice}, Stock: ${newStock}`);
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} products!`);
    
    // Show some statistics
    const stats = await Product.aggregate([
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          totalStock: { $sum: '$stock' },
          avgStock: { $avg: '$stock' }
        }
      }
    ]);
    
    if (stats.length > 0) {
      const stat = stats[0];
      console.log(`\n📊 Updated Statistics:`);
      console.log(`- Average Price: $${stat.avgPrice.toFixed(2)}`);
      console.log(`- Price Range: $${stat.minPrice.toFixed(2)} - $${stat.maxPrice.toFixed(2)}`);
      console.log(`- Total Stock: ${stat.totalStock} units`);
      console.log(`- Average Stock per Product: ${stat.avgStock.toFixed(0)} units`);
    }
    
    // Show category breakdown
    console.log(`\n📋 Category Breakdown:`);
    for (const [category, range] of Object.entries(priceRanges)) {
      const categoryProducts = await Product.countDocuments({
        category: { $in: await Category.find({ name: category }).distinct('_id') }
      });
      if (categoryProducts > 0) {
        console.log(`- ${category}: ${categoryProducts} products ($${range.min} - $${range.max})`);
      }
    }
    
  } catch (error) {
    console.error('Error updating product pricing:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the update function
updateProductPricing();