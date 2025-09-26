const mongoose = require('mongoose');

async function checkBannerDatabases() {
  console.log('🔍 Checking banner databases...');
  
  try {
    // Check main database (shoppers9)
    console.log('\n📊 MAIN DATABASE (shoppers9):');
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    const mainBanners = await mongoose.connection.db.collection('banners').find({}).toArray();
    console.log(`Found ${mainBanners.length} banners in main database`);
    mainBanners.forEach((banner, i) => {
      console.log(`  ${i+1}. ${banner.title} - Active: ${banner.isActive} - Order: ${banner.order}`);
    });
    await mongoose.disconnect();
    
    // Check admin database (shoppers9-admin)
    console.log('\n📊 ADMIN DATABASE (shoppers9-admin):');
    await mongoose.connect('mongodb://localhost:27017/shoppers9-admin');
    const adminBanners = await mongoose.connection.db.collection('banners').find({}).toArray();
    console.log(`Found ${adminBanners.length} banners in admin database`);
    adminBanners.forEach((banner, i) => {
      console.log(`  ${i+1}. ${banner.title} - Active: ${banner.isActive} - Order: ${banner.order}`);
    });
    await mongoose.disconnect();
    
    console.log('\n🔍 ANALYSIS:');
    console.log('- Main frontend fetches from main database (shoppers9)');
    console.log('- Admin panel creates banners in admin database (shoppers9-admin)');
    console.log('- These are separate databases, so banners don\'t sync!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkBannerDatabases();