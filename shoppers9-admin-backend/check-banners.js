const mongoose = require('mongoose');
require('dotenv').config();

// Banner schema
const bannerSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  description: String,
  image: String,
  link: String,
  buttonText: String,
  isActive: Boolean,
  order: Number,
  startDate: Date,
  endDate: Date,
  categoryId: String,
  displayType: String
}, { timestamps: true });

const Banner = mongoose.model('Banner', bannerSchema);

async function checkBanners() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin');
    console.log('Connected successfully!');
    
    const banners = await Banner.find({}).sort({ order: 1 });
    console.log(`\nTotal banners in database: ${banners.length}`);
    
    if (banners.length === 0) {
      console.log('No banners found in the database.');
    } else {
      console.log('\nBanner details:');
      banners.forEach((banner, i) => {
        console.log(`${i+1}. Title: "${banner.title}"`);
        console.log(`   Order: ${banner.order} (${banner.order === 1 ? 'Hero Banner' : 'Grid Banner'})`);
        console.log(`   Active: ${banner.isActive}`);
        console.log(`   Category ID: ${banner.categoryId || 'None'}`);
        console.log(`   Image: ${banner.image ? 'Yes' : 'No'}`);
        console.log(`   Created: ${banner.createdAt}`);
        console.log('   ---');
      });
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkBanners();