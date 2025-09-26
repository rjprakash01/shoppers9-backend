import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product';
import Category from './src/models/Category';
import { ReviewStatus } from './src/types';

dotenv.config();

async function createTestProductForReview() {
  try {
    console.log('\n=== CREATING TEST PRODUCT FOR REVIEW QUEUE ===');
    
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
    
    // Create multiple test products with different statuses
    const testProducts = [
      {
        name: 'Pending Review Shirt',
        description: 'A shirt waiting for review approval',
        category: category._id,
        subCategory: category.parentCategory,
        brand: 'TestBrand',
        images: ['https://example.com/pending-shirt.jpg'],
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
          sku: 'PENDING-BLUE-M',
          images: ['https://example.com/blue-shirt.jpg']
        }],
        displayFilters: ['color', 'size'],
        specifications: {
          fabric: 'Cotton',
          fit: 'Regular'
        },
        tags: ['test', 'pending', 'review'],
        isActive: false,
        isFeatured: false,
        isTrending: false,
        reviewStatus: ReviewStatus.PENDING_REVIEW,
        submittedForReviewAt: new Date(),
        approvalStatus: 'pending'
      },
      {
        name: 'Draft Shirt',
        description: 'A shirt in draft status',
        category: category._id,
        subCategory: category.parentCategory,
        brand: 'TestBrand',
        images: ['https://example.com/draft-shirt.jpg'],
        availableColors: [{
          name: 'Red',
          code: '#FF0000',
          images: ['https://example.com/red-shirt.jpg']
        }],
        availableSizes: [{
          name: 'L'
        }],
        variants: [{
          color: 'Red',
          colorCode: '#FF0000',
          size: 'L',
          price: 34.99,
          originalPrice: 44.99,
          stock: 15,
          sku: 'DRAFT-RED-L',
          images: ['https://example.com/red-shirt.jpg']
        }],
        displayFilters: ['color', 'size'],
        specifications: {
          fabric: 'Cotton Blend',
          fit: 'Slim'
        },
        tags: ['test', 'draft'],
        isActive: false,
        isFeatured: false,
        isTrending: false,
        reviewStatus: ReviewStatus.DRAFT,
        approvalStatus: 'pending'
      },
      {
        name: 'Needs Info Shirt',
        description: 'A shirt that needs more information',
        category: category._id,
        subCategory: category.parentCategory,
        brand: 'TestBrand',
        images: ['https://example.com/info-shirt.jpg'],
        availableColors: [{
          name: 'Green',
          code: '#00FF00',
          images: ['https://example.com/green-shirt.jpg']
        }],
        availableSizes: [{
          name: 'S'
        }],
        variants: [{
          color: 'Green',
          colorCode: '#00FF00',
          size: 'S',
          price: 24.99,
          originalPrice: 34.99,
          stock: 8,
          sku: 'INFO-GREEN-S',
          images: ['https://example.com/green-shirt.jpg']
        }],
        displayFilters: ['color', 'size'],
        specifications: {
          fabric: 'Polyester',
          fit: 'Regular'
        },
        tags: ['test', 'needs-info'],
        isActive: false,
        isFeatured: false,
        isTrending: false,
        reviewStatus: ReviewStatus.NEEDS_INFO,
        submittedForReviewAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        approvalStatus: 'needs_changes'
      }
    ];
    
    console.log('\n📦 Creating test products...');
    for (const productData of testProducts) {
      const product = await Product.create(productData);
      console.log(`✅ Created: ${product.name} (Status: ${product.reviewStatus})`);
    }
    
    // Verify products were created
    const allTestProducts = await Product.find({ brand: 'TestBrand' });
    console.log(`\n📊 Total test products created: ${allTestProducts.length}`);
    
    // Show status breakdown
    const statusCounts = await Product.aggregate([
      { $match: { brand: 'TestBrand' } },
      { $group: { _id: '$reviewStatus', count: { $sum: 1 } } }
    ]);
    
    console.log('\n📈 Status breakdown:');
    statusCounts.forEach(status => {
      console.log(`   ${status._id}: ${status.count} product(s)`);
    });
    
    console.log('\n✅ Test products created successfully!');
    console.log('\n🎯 You can now test the review queue in the admin frontend:');
    console.log('   - Navigate to the Product Review Queue');
    console.log('   - Filter by "pending" to see the pending review shirt');
    console.log('   - Filter by "changes_requested" to see the needs info shirt');
    console.log('   - Filter by "draft" to see the draft shirt');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

createTestProductForReview();