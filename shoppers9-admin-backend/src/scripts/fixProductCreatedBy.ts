import mongoose from 'mongoose';
import Product from '../models/Product';
import User from '../models/User';
import connectDB from '../config/database';

/**
 * Migration script to fix createdBy references in products
 * This script will:
 * 1. Find products with invalid createdBy references
 * 2. Try to match them with existing admin users
 * 3. Update the references to proper ObjectIds
 */
export const fixProductCreatedByReferences = async () => {
  try {
    await connectDB();
    console.log('🔄 Starting migration to fix product createdBy references...');

    // Find all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to check`);

    // Find all admin users for reference
    const adminUsers = await User.find({
      primaryRole: { $in: ['super_admin', 'admin', 'sub_admin'] },
      isActive: true
    }).select('_id firstName lastName email');
    
    console.log(`Found ${adminUsers.length} admin users`);

    let fixedCount = 0;
    let alreadyValidCount = 0;
    let noMatchCount = 0;

    for (const product of products) {
      try {
        // Check if createdBy is already a valid ObjectId reference
        if (product.createdBy && mongoose.Types.ObjectId.isValid(product.createdBy)) {
          // Verify the referenced user exists
          const userExists = await User.findById(product.createdBy);
          if (userExists) {
            alreadyValidCount++;
            continue;
          }
        }

        // If createdBy is invalid or user doesn't exist, try to fix it
        let targetUser = null;

        // If createdBy is an object with email, try to match by email
        if (product.createdBy && typeof product.createdBy === 'object' && (product.createdBy as any).email) {
          const email = (product.createdBy as any).email;
          targetUser = adminUsers.find(user => user.email === email);
          console.log(`Trying to match product ${product._id} by email: ${email}`);
        }

        // If no match found, assign to the first admin user (fallback)
        if (!targetUser && adminUsers.length > 0) {
          targetUser = adminUsers[0];
          console.log(`No match found for product ${product._id}, assigning to default admin: ${targetUser.email}`);
        }

        if (targetUser) {
          // Update the product with the correct ObjectId reference
          await Product.findByIdAndUpdate(product._id, {
            createdBy: targetUser._id
          });
          
          console.log(`✅ Fixed product ${product._id} - assigned to ${targetUser.firstName} ${targetUser.lastName} (${targetUser.email})`);
          fixedCount++;
        } else {
          console.log(`❌ Could not fix product ${product._id} - no admin users available`);
          noMatchCount++;
        }

      } catch (error) {
        console.error(`Error processing product ${product._id}:`, error);
        noMatchCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Already valid: ${alreadyValidCount}`);
    console.log(`🔧 Fixed: ${fixedCount}`);
    console.log(`❌ Could not fix: ${noMatchCount}`);
    console.log(`📝 Total processed: ${products.length}`);

    if (fixedCount > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('Products should now display "created by" information correctly.');
    } else if (alreadyValidCount === products.length) {
      console.log('\n✨ All products already have valid createdBy references!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run the migration if this file is executed directly
if (require.main === module) {
  fixProductCreatedByReferences()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default fixProductCreatedByReferences;