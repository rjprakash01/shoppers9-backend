import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ReviewStatus } from './src/types';

dotenv.config();

async function testStatusMapping() {
  try {
    console.log('\n=== TESTING STATUS MAPPING ISSUE ===');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin');
    console.log('✅ Connected to database');
    
    console.log('\n📋 ReviewStatus enum values:');
    Object.entries(ReviewStatus).forEach(([key, value]) => {
      console.log(`   ${key}: '${value}'`);
    });
    
    console.log('\n📋 Frontend filter values:');
    const frontendValues = ['pending', 'approved', 'rejected', 'changes_requested'];
    frontendValues.forEach(value => {
      console.log(`   Frontend sends: '${value}'`);
      
      // Check if it matches any ReviewStatus value
      const matchingEnum = Object.values(ReviewStatus).find(enumValue => enumValue === value);
      if (matchingEnum) {
        console.log(`     ✅ Matches ReviewStatus.${Object.keys(ReviewStatus).find(key => ReviewStatus[key] === value)}`);
      } else {
        console.log(`     ❌ No matching ReviewStatus enum value`);
        
        // Suggest mapping
        if (value === 'pending') {
          console.log(`     💡 Should map to: '${ReviewStatus.PENDING_REVIEW}'`);
        } else if (value === 'changes_requested') {
          console.log(`     💡 Should map to: '${ReviewStatus.NEEDS_INFO}'`);
        }
      }
    });
    
    console.log('\n🔍 ISSUE IDENTIFIED:');
    console.log('   Frontend sends "pending" but backend expects "pending_review"');
    console.log('   Frontend sends "changes_requested" but backend expects "needs_info"');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

testStatusMapping();