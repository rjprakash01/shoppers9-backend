const mongoose = require('mongoose');

async function syncBanners() {
  console.log('🔄 Syncing banners from admin database to main database...');
  
  try {
    // Connect to admin database and get banners
    console.log('\n📥 Fetching banners from admin database (shoppers9-admin)...');
    await mongoose.connect('mongodb://localhost:27017/shoppers9-admin');
    const adminBanners = await mongoose.connection.db.collection('banners').find({}).toArray();
    console.log(`Found ${adminBanners.length} banners in admin database`);
    
    // Clean up the banner data for main database
    const bannersToSync = adminBanners.map(banner => {
      const cleanBanner = { ...banner };
      // Remove admin-specific fields if any
      delete cleanBanner.createdBy;
      delete cleanBanner.updatedBy;
      return cleanBanner;
    });
    
    await mongoose.disconnect();
    
    // Connect to main database
    console.log('\n📤 Connecting to main database (shoppers9)...');
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    
    // Clear existing banners in main database
    console.log('🗑️ Clearing existing banners in main database...');
    const deleteResult = await mongoose.connection.db.collection('banners').deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing banners`);
    
    // Insert new banners
    console.log('📥 Inserting banners into main database...');
    const insertResult = await mongoose.connection.db.collection('banners').insertMany(bannersToSync);
    console.log(`Inserted ${insertResult.insertedCount} banners`);
    
    await mongoose.disconnect();
    
    console.log('\n✅ Banner sync completed successfully!');
    console.log('\n🔍 Verifying sync...');
    
    // Verify the sync
    await mongoose.connect('mongodb://localhost:27017/shoppers9');
    const mainBanners = await mongoose.connection.db.collection('banners').find({}).toArray();
    console.log(`\n📊 Main database now has ${mainBanners.length} banners:`);
    mainBanners.forEach((banner, i) => {
      console.log(`  ${i+1}. ${banner.title} - Active: ${banner.isActive} - Order: ${banner.order}`);
    });
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error syncing banners:', error.message);
  }
}

syncBanners();