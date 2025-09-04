const mongoose = require('mongoose');

// Define the Product schema directly since we can't import from TypeScript
const productSizeSchema = new mongoose.Schema({
  size: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku: { type: String, required: true, unique: true }
});

const productVariantSchema = new mongoose.Schema({
  color: { type: String, required: true },
  colorCode: { type: String },
  sizes: [productSizeSchema],
  images: [{ type: String, required: true }]
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  brand: { type: String, required: true },
  images: [{ type: String, required: true }],
  variants: [productVariantSchema],
  specifications: { type: Object, default: {} },
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Add virtual fields
productSchema.virtual('minPrice').get(function() {
  if (!this.variants || this.variants.length === 0) return 0;
  const allPrices = this.variants.flatMap(variant => 
    variant.sizes ? variant.sizes.map(size => size.price) : []
  );
  return allPrices.length > 0 ? Math.min(...allPrices) : 0;
});

productSchema.virtual('maxPrice').get(function() {
  if (!this.variants || this.variants.length === 0) return 0;
  const allPrices = this.variants.flatMap(variant => 
    variant.sizes ? variant.sizes.map(size => size.price) : []
  );
  return allPrices.length > 0 ? Math.max(...allPrices) : 0;
});

productSchema.virtual('totalStock').get(function() {
  if (!this.variants || this.variants.length === 0) return 0;
  return this.variants.reduce((total, variant) => {
    return total + (variant.sizes ? variant.sizes.reduce((variantTotal, size) => variantTotal + (size.stock || 0), 0) : 0);
  }, 0);
});

const Product = mongoose.model('Product', productSchema);

async function fixExistingProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');

    // Find products with empty variants
    const productsWithoutVariants = await Product.find({
      $or: [
        { variants: { $exists: false } },
        { variants: { $size: 0 } }
      ]
    });

    console.log(`Found ${productsWithoutVariants.length} products without variants`);

    for (const product of productsWithoutVariants) {
      console.log(`Fixing product: ${product.name}`);
      
      // Create a default variant structure
      const defaultVariant = {
        color: 'Default',
        colorCode: '#000000',
        sizes: [{
          size: 'One Size',
          price: 999, // Default price
          originalPrice: 1299, // Default original price
          discount: 23, // 23% discount
          stock: 10, // Default stock
          sku: `${product.name.substring(0, 3).toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        }],
        images: product.images || ['https://via.placeholder.com/300x300']
      };

      // Update the product with the default variant
      await Product.findByIdAndUpdate(product._id, {
        $set: {
          variants: [defaultVariant]
        }
      });
      
      console.log(`Fixed product: ${product.name}`);
    }

    console.log('All products fixed successfully!');
    
    // Verify the fix
    const updatedProducts = await Product.find({}).limit(3);
    for (const product of updatedProducts) {
      console.log(`\nProduct: ${product.name}`);
      console.log(`Variants: ${product.variants.length}`);
      console.log(`Min Price: ${product.minPrice}`);
      console.log(`Max Price: ${product.maxPrice}`);
      console.log(`Total Stock: ${product.totalStock}`);
    }
    
  } catch (error) {
    console.error('Error fixing products:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixExistingProducts();