const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin');

// Define simple product schema
const productSchema = new mongoose.Schema({
  name: String,
  reviewStatus: String,
  isActive: Boolean,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedForReviewAt: Date,
  createdAt: Date
});

const Product = mongoose.model('Product', productSchema);

async function checkProducts() {
  try {
    console.log('\n=== CHECKING PRODUCT REVIEW STATUS ===');
    
    // Get all products and their review status
    const allProducts = await Product.find({}).sort({ createdAt: -1 }).limit(20);
    
    console.log(`\nTotal products found: ${allProducts.length}`);
    
    // Group by review status
    const statusCounts = {};
    allProducts.forEach(product => {
      const status = product.reviewStatus || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('\n📊 Review Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    // Show products with PENDING_REVIEW status (both cases)
    const pendingProductsLower = allProducts.filter(p => p.reviewStatus === 'pending_review');
    const pendingProductsUpper = allProducts.filter(p => p.reviewStatus === 'PENDING_REVIEW');
    console.log(`\n🔍 Products with 'pending_review' (lowercase) status: ${pendingProductsLower.length}`);
    console.log(`🔍 Products with 'PENDING_REVIEW' (uppercase) status: ${pendingProductsUpper.length}`);
    
    const allPendingProducts = [...pendingProductsLower, ...pendingProductsUpper];
    
    if (allPendingProducts.length > 0) {
      console.log(`\n📋 All pending products (${allPendingProducts.length}):`);
      allPendingProducts.forEach((product, index) => {
        console.log(`\n   ${index + 1}. ${product.name}`);
        console.log(`      ID: ${product._id}`);
        console.log(`      Status: ${product.reviewStatus}`);
        console.log(`      Active: ${product.isActive}`);
        console.log(`      Created By: ${product.createdBy}`);
        console.log(`      Submitted: ${product.submittedForReviewAt}`);
        console.log(`      Created: ${product.createdAt}`);
      });
    }
    
    // Show products with other statuses for comparison
    const otherStatuses = ['draft', 'approved', 'rejected', 'needs_info'];
    otherStatuses.forEach(status => {
      const products = allProducts.filter(p => p.reviewStatus === status);
      if (products.length > 0) {
        console.log(`\n🔍 Products with ${status.toUpperCase()} status: ${products.length}`);
        products.slice(0, 3).forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} (ID: ${product._id})`);
        });
      }
    });
    
    // Check for products with undefined/null status
    const undefinedStatus = allProducts.filter(p => !p.reviewStatus || p.reviewStatus === null);
    if (undefinedStatus.length > 0) {
      console.log(`\n⚠️  Products with undefined/null status: ${undefinedStatus.length}`);
      undefinedStatus.slice(0, 3).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (ID: ${product._id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

checkProducts();