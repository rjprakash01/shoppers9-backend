import mongoose from 'mongoose';
import { Product } from '../models/Product';
import dotenv from 'dotenv';

dotenv.config();

async function migrateApprovalStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');

    // Update all existing products to have approvalStatus: 'approved'
    // This ensures existing products remain visible on the main site
    const result = await Product.updateMany(
      { approvalStatus: { $exists: false } }, // Only update products without approvalStatus
      { $set: { approvalStatus: 'approved' } }
    );

    console.log(`Migration completed: ${result.modifiedCount} products updated with approvalStatus: 'approved'`);
    
    // Verify the migration
    const totalProducts = await Product.countDocuments({});
    const approvedProducts = await Product.countDocuments({ approvalStatus: 'approved' });
    const pendingProducts = await Product.countDocuments({ approvalStatus: 'pending' });
    
    console.log('\nMigration Summary:');
    console.log(`Total products: ${totalProducts}`);
    console.log(`Approved products: ${approvedProducts}`);
    console.log(`Pending products: ${pendingProducts}`);
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateApprovalStatus();