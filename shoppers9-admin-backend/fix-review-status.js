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

async function fixReviewStatus() {
  try {
    console.log('\n=== FIXING REVIEW STATUS CASE ===');
    
    // Find products with uppercase PENDING_REVIEW
    const productsToFix = await Product.find({ reviewStatus: 'PENDING_REVIEW' });
    console.log(`\nFound ${productsToFix.length} products with uppercase 'PENDING_REVIEW' status`);
    
    if (productsToFix.length > 0) {
      // Update them to lowercase
      const result = await Product.updateMany(
        { reviewStatus: 'PENDING_REVIEW' },
        { $set: { reviewStatus: 'pending_review' } }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} products to use lowercase 'pending_review'`);
      
      // Verify the fix
      const verifyLowercase = await Product.find({ reviewStatus: 'pending_review' });
      const verifyUppercase = await Product.find({ reviewStatus: 'PENDING_REVIEW' });
      
      console.log(`\n📊 After fix:`);
      console.log(`   Products with 'pending_review' (lowercase): ${verifyLowercase.length}`);
      console.log(`   Products with 'PENDING_REVIEW' (uppercase): ${verifyUppercase.length}`);
      
      if (verifyLowercase.length > 0) {
        console.log(`\n✅ SUCCESS: Products are now using the correct lowercase status`);
        verifyLowercase.slice(0, 3).forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} - Status: ${product.reviewStatus}`);
        });
      }
    } else {
      console.log('\n✅ No products found with uppercase PENDING_REVIEW status');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

fixReviewStatus();