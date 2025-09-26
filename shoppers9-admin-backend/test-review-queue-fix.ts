import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product';
import Category from './src/models/Category';
import { ReviewStatus } from './src/types';

dotenv.config();

async function testReviewQueueFix() {
  try {
    console.log('\n=== TESTING REVIEW QUEUE FIX ===');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin');
    console.log('✅ Connected to database');
    
    // Find the men-clothing-shirts category
    const category = await Category.findOne({ slug: 'men-clothing-shirts' });
    if (!category) {
      console.log('❌ Category "men-clothing-shirts" not found');
      return;
    }
    console.log(`✅ Found category: ${category.name}`);
    
    // Create a test product with pending_review status
    const testProduct = {
      name: 'Test Review Queue Product',
      description: 'A test product to verify review queue functionality',
      category: category._id,
      subCategory: category.parentCategory,
      brand: 'Test Brand',
      images: ['https://example.com/test-image.jpg'],
      availableColors: [{
        name: 'Blue',
        code: '#0000FF',
        images: ['https://example.com/blue-shirt.jpg']
      }],
      availableSizes: [{
        name: 'M'
      }],
      variants: [{
        color: 'Blue',
        colorCode: '#0000FF',
        size: 'M',
        price: 29.99,
        originalPrice: 39.99,
        stock: 10,
        sku: 'TEST-BLUE-M',
        images: ['https://example.com/blue-shirt.jpg']
      }],
      displayFilters: ['color', 'size'],
      specifications: {
        fabric: 'Cotton',
        fit: 'Regular'
      },
      tags: ['test', 'review', 'queue'],
      isActive: false,
      isFeatured: false,
      isTrending: false,
      reviewStatus: ReviewStatus.PENDING_REVIEW,
      submittedForReviewAt: new Date(),
      approvalStatus: 'pending'
    };
    
    const product = await Product.create(testProduct);
    console.log(`✅ Created test product: ${product.name} (ID: ${product._id})`);
    console.log(`   Review Status: ${product.reviewStatus}`);
    
    // Test the query logic that the getReviewQueue function uses
    console.log('\n🔍 Testing query logic:');
    
    // Test 1: Query with 'pending' (frontend value)
    const frontendStatus = 'pending';
    let mappedStatus: ReviewStatus;
    switch (frontendStatus) {
      case 'pending':
        mappedStatus = ReviewStatus.PENDING_REVIEW;
        break;
      default:
        mappedStatus = ReviewStatus.PENDING_REVIEW;
    }
    
    const queryResult = await Product.find({ reviewStatus: mappedStatus });
    console.log(`   Frontend sends: '${frontendStatus}'`);
    console.log(`   Mapped to: '${mappedStatus}'`);
    console.log(`   Found ${queryResult.length} product(s)`);
    
    if (queryResult.length > 0) {
      console.log(`   ✅ SUCCESS: Product found with mapped status`);
      queryResult.forEach((p, index) => {
        console.log(`     ${index + 1}. ${p.name} - Status: ${p.reviewStatus}`);
      });
    } else {
      console.log(`   ❌ FAILED: No products found`);
    }
    
    // Test 2: Direct query with enum value
    const directQuery = await Product.find({ reviewStatus: ReviewStatus.PENDING_REVIEW });
    console.log(`\n   Direct enum query found ${directQuery.length} product(s)`);
    
    // Clean up - remove test product
    await Product.findByIdAndDelete(product._id);
    console.log(`\n🧹 Cleaned up test product`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

testReviewQueueFix();