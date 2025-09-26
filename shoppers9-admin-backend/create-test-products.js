const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin');

// Define schemas
const categorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  level: Number
});

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String
});

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  brand: String,
  images: [String],
  variants: [{
    sku: String,
    price: Number,
    discountedPrice: Number,
    stock: Number,
    size: String,
    color: String,
    isActive: Boolean
  }],
  reviewStatus: {
    type: String,
    enum: ['draft', 'pending_review', 'approved', 'rejected', 'needs_info'],
    default: 'draft'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs_changes'],
    default: 'pending'
  },
  isActive: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedForReviewAt: Date,
  approvedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const Category = mongoose.model('Category', categorySchema);
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);

async function createTestProducts() {
  try {
    console.log('Creating test products with different review statuses...');

    // Find or create a test category
    let category = await Category.findOne({ name: 'Electronics' });
    if (!category) {
      category = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
        level: 1
      });
    }

    // Find or create a test user
    let user = await User.findOne({ email: 'admin@test.com' });
    if (!user) {
      user = await User.create({
        firstName: 'Test',
        lastName: 'Admin',
        email: 'admin@test.com'
      });
    }

    // Create test products with different statuses
    const testProducts = [
      {
        name: 'Pending Review Product',
        description: 'This product is pending review',
        category: category._id,
        brand: 'TestBrand',
        images: ['https://via.placeholder.com/300'],
        variants: [{
          sku: 'PENDING-001',
          price: 99.99,
          stock: 10,
          size: 'M',
          color: 'Blue',
          isActive: true
        }],
        reviewStatus: 'pending_review',
        approvalStatus: 'pending',
        isActive: false,
        createdBy: user._id,
        submittedForReviewAt: new Date()
      },
      {
        name: 'Approved Product',
        description: 'This product has been approved',
        category: category._id,
        brand: 'TestBrand',
        images: ['https://via.placeholder.com/300'],
        variants: [{
          sku: 'APPROVED-001',
          price: 149.99,
          stock: 15,
          size: 'L',
          color: 'Red',
          isActive: true
        }],
        reviewStatus: 'approved',
        approvalStatus: 'approved',
        isActive: true,
        createdBy: user._id,
        submittedForReviewAt: new Date(Date.now() - 86400000), // 1 day ago
        approvedAt: new Date(),
        approvedBy: user._id
      },
      {
        name: 'Rejected Product',
        description: 'This product has been rejected',
        category: category._id,
        brand: 'TestBrand',
        images: ['https://via.placeholder.com/300'],
        variants: [{
          sku: 'REJECTED-001',
          price: 79.99,
          stock: 5,
          size: 'S',
          color: 'Green',
          isActive: true
        }],
        reviewStatus: 'rejected',
        approvalStatus: 'rejected',
        isActive: false,
        createdBy: user._id,
        submittedForReviewAt: new Date(Date.now() - 172800000) // 2 days ago
      },
      {
        name: 'Changes Requested Product',
        description: 'This product needs changes',
        category: category._id,
        brand: 'TestBrand',
        images: ['https://via.placeholder.com/300'],
        variants: [{
          sku: 'CHANGES-001',
          price: 199.99,
          stock: 8,
          size: 'XL',
          color: 'Black',
          isActive: true
        }],
        reviewStatus: 'needs_info',
        approvalStatus: 'needs_changes',
        isActive: false,
        createdBy: user._id,
        submittedForReviewAt: new Date(Date.now() - 259200000) // 3 days ago
      }
    ];

    // Delete existing test products to avoid duplicates
    await Product.deleteMany({ brand: 'TestBrand' });

    // Create new test products
    const createdProducts = await Product.create(testProducts);

    console.log(`✅ Created ${createdProducts.length} test products:`);
    createdProducts.forEach(product => {
      console.log(`  - ${product.name} (${product.reviewStatus}/${product.approvalStatus})`);
    });

    // Verify the products were created correctly
    const allProducts = await Product.find({ brand: 'TestBrand' }).populate('category', 'name');
    console.log('\n📊 Test Products Summary:');
    allProducts.forEach(product => {
      console.log(`  ${product.name}:`);
      console.log(`    - Review Status: ${product.reviewStatus}`);
      console.log(`    - Approval Status: ${product.approvalStatus}`);
      console.log(`    - Is Active: ${product.isActive}`);
      console.log(`    - Category: ${product.category?.name || 'Unknown'}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test products:', error);
    process.exit(1);
  }
}

createTestProducts();