import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product';

dotenv.config();

async function fixSaree1Images() {
  try {
    console.log('\n=== FIXING SAREE1 IMAGE DATA ===');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin');
    console.log('✅ Connected to database');
    
    // Find the saree1 product
    const saree1Product = await Product.findOne({
      name: { $regex: 'saree1', $options: 'i' }
    });
    
    if (!saree1Product) {
      console.log('❌ Saree1 product not found');
      return;
    }
    
    console.log(`\n🔍 Found product: ${saree1Product.name}`);
    console.log(`   ID: ${saree1Product._id}`);
    console.log(`   Current images: ${JSON.stringify(saree1Product.images)}`);
    
    // Analyze the corrupted data
    console.log('\n🔍 Analyzing corrupted image data:');
    const corruptedImages = saree1Product.images;
    console.log(`   Raw data: ${corruptedImages[0]}`);
    
    // The data appears to be multiple layers of JSON stringification
    // Let's try to parse it step by step
    let currentData = corruptedImages[0];
    let parseAttempts = 0;
    const maxAttempts = 10;
    
    console.log('\n🔧 Attempting to parse nested JSON:');
    while (parseAttempts < maxAttempts && typeof currentData === 'string' && currentData.startsWith('[')) {
      try {
        const parsed = JSON.parse(currentData);
        parseAttempts++;
        console.log(`   Attempt ${parseAttempts}: ${JSON.stringify(parsed)}`);
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentData = parsed[0];
        } else {
          break;
        }
      } catch (error) {
        console.log(`   Parse attempt ${parseAttempts + 1} failed: ${error.message}`);
        break;
      }
    }
    
    console.log(`\n📊 Final parsed result: ${JSON.stringify(currentData)}`);
    
    // The final result appears to be an empty array []
    // Let's set proper placeholder images for the saree
    const fixedImages = [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop', // Saree image 1
      'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&h=400&fit=crop', // Saree image 2
      'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=400&h=400&fit=crop'  // Saree image 3
    ];
    
    console.log('\n🛠️  Applying fix with proper saree images:');
    console.log(`   New images: ${JSON.stringify(fixedImages)}`);
    
    // Update the product images
    saree1Product.images = fixedImages;
    
    // Also fix variant images if they're corrupted
    if (saree1Product.variants && saree1Product.variants.length > 0) {
      saree1Product.variants.forEach((variant, index) => {
        console.log(`\n   Variant ${index + 1} current images: ${JSON.stringify(variant.images)}`);
        
        // Check if variant images are also corrupted
        if (variant.images && variant.images.length > 0 && 
            typeof variant.images[0] === 'string' && 
            variant.images[0].includes('\\\\')) {
          console.log(`   Fixing variant ${index + 1} images...`);
          variant.images = fixedImages;
        }
      });
    }
    
    // Also fix availableColors images if they exist
    if (saree1Product.availableColors && saree1Product.availableColors.length > 0) {
      saree1Product.availableColors.forEach((color, index) => {
        if (color.images && color.images.length > 0 && 
            typeof color.images[0] === 'string' && 
            color.images[0].includes('\\\\')) {
          console.log(`   Fixing color ${color.name} images...`);
          color.images = fixedImages;
        }
      });
    }
    
    // Save the updated product
    await saree1Product.save();
    
    console.log('\n✅ Successfully fixed saree1 image data!');
    
    // Verify the fix
    const updatedProduct = await Product.findById(saree1Product._id).select('name images variants availableColors');
    console.log('\n🔍 Verification - Updated product data:');
    console.log(`   Product: ${updatedProduct.name}`);
    console.log(`   Images: ${JSON.stringify(updatedProduct.images)}`);
    
    if (updatedProduct.variants && updatedProduct.variants.length > 0) {
      updatedProduct.variants.forEach((variant, index) => {
        console.log(`   Variant ${index + 1} images: ${JSON.stringify(variant.images)}`);
      });
    }
    
    console.log('\n🎯 The saree1 product images should now display properly in the frontend!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

fixSaree1Images();