const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin')
  .then(() => {
    console.log('Connected to MongoDB');
    fixAdminProductsReviewStatus();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define Product schema (simplified)
const productSchema = new mongoose.Schema({
  name: String,
  reviewStatus: String,
  submittedForReviewAt: Date,
  isActive: Boolean,
  approvalStatus: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  createdAt: Date
}, { collection: 'products' });

const Product = mongoose.model('Product', productSchema);

// Define Admin schema (simplified)
const adminSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  primaryRole: String
}, { collection: 'admins' });

const Admin = mongoose.model('Admin', adminSchema);

async function fixAdminProductsReviewStatus() {
  try {
    console.log('\n=== FIXING ADMIN-CREATED PRODUCTS REVIEW STATUS ===');
    
    // Find all admin users
    const adminUsers = await Admin.find({ primaryRole: 'admin' });
    const adminIds = adminUsers.map(admin => admin._id);
    
    console.log(`Found ${adminUsers.length} admin users`);
    
    // Find all products created by admin users that need fixing
    const productsToFix = await Product.find({ 
      createdBy: { $in: adminIds },
      $or: [
        { reviewStatus: { $exists: false } },
        { reviewStatus: null },
        { reviewStatus: 'draft' },
        { reviewStatus: undefined }
      ]
    }).populate('createdBy', 'firstName lastName email primaryRole');
    
    console.log(`Found ${productsToFix.length} products that need review status fixing:`);
    
    if (productsToFix.length === 0) {
      console.log('No products need fixing.');
      return;
    }
    
    // Update each product
    const updatePromises = productsToFix.map(async (product) => {
      console.log(`\nFixing product: ${product.name}`);
      console.log(`  Current reviewStatus: ${product.reviewStatus}`);
      console.log(`  Created by: ${product.createdBy?.firstName} ${product.createdBy?.lastName}`);
      
      const updateData = {
        reviewStatus: 'PENDING_REVIEW',
        submittedForReviewAt: new Date(),
        approvalStatus: 'pending',
        isActive: false // Admin-created products should be inactive until approved
      };
      
      const result = await Product.updateOne(
        { _id: product._id },
        { $set: updateData }
      );
      
      console.log(`  Updated: ${result.modifiedCount > 0 ? 'SUCCESS' : 'FAILED'}`);
      return result;
    });
    
    const results = await Promise.all(updatePromises);
    const successCount = results.filter(r => r.modifiedCount > 0).length;
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total products processed: ${productsToFix.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Failed to update: ${productsToFix.length - successCount}`);
    
    // Verify the changes
    console.log('\n=== VERIFICATION ===');
    const pendingProducts = await Product.find({ 
      reviewStatus: 'PENDING_REVIEW' 
    }).populate('createdBy', 'firstName lastName email primaryRole');
    
    console.log(`Now there are ${pendingProducts.length} products with PENDING_REVIEW status:`);
    pendingProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - Created by: ${product.createdBy?.firstName} ${product.createdBy?.lastName}`);
    });
    
  } catch (error) {
    console.error('Error fixing products:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}