const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/shoppers9';

async function checkBannerDisplayTypes() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db('shoppers9');
        const bannersCollection = db.collection('banners');
        
        // Get all banners
        const allBanners = await bannersCollection.find({}).toArray();
        console.log(`\n📊 Found ${allBanners.length} total banners in database`);
        
        if (allBanners.length === 0) {
            console.log('❌ No banners found in database!');
            return;
        }
        
        // Analyze each banner
        console.log('\n🔍 Banner Analysis:');
        console.log('=' .repeat(80));
        
        allBanners.forEach((banner, index) => {
            console.log(`\nBanner ${index + 1}:`);
            console.log(`  Title: ${banner.title}`);
            console.log(`  Display Type: ${banner.displayType || 'undefined (should default to carousel)'}`);
            console.log(`  Is Active: ${banner.isActive}`);
            console.log(`  Order: ${banner.order}`);
            console.log(`  Image: ${banner.image}`);
            console.log(`  Created: ${banner.createdAt}`);
        });
        
        // Check active banners
        const activeBanners = allBanners.filter(banner => banner.isActive);
        console.log(`\n✅ Active banners: ${activeBanners.length}`);
        
        // Check carousel banners (displayType is undefined or 'carousel')
        const carouselBanners = activeBanners.filter(banner => 
            !banner.displayType || banner.displayType === 'carousel'
        );
        console.log(`🎠 Carousel banners (active): ${carouselBanners.length}`);
        
        if (carouselBanners.length === 0) {
            console.log('\n❌ ISSUE FOUND: No active carousel banners!');
            console.log('\n🔧 Possible solutions:');
            console.log('1. Set displayType to "carousel" for banners that should show on main page');
            console.log('2. Make sure banners are set to isActive: true');
            console.log('3. Check if banners have the correct displayType value');
            
            // Show displayType distribution
            const displayTypeCount = {};
            activeBanners.forEach(banner => {
                const type = banner.displayType || 'undefined';
                displayTypeCount[type] = (displayTypeCount[type] || 0) + 1;
            });
            
            console.log('\n📈 Active banner displayType distribution:');
            Object.entries(displayTypeCount).forEach(([type, count]) => {
                console.log(`  ${type}: ${count}`);
            });
        } else {
            console.log('\n✅ Found carousel banners that should display!');
            carouselBanners.forEach((banner, index) => {
                console.log(`  ${index + 1}. ${banner.title} (order: ${banner.order})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
        console.log('\n🔌 Database connection closed');
    }
}

checkBannerDisplayTypes();