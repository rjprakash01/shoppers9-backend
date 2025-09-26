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

async function checkBannerImages() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9-admin');
    console.log('Connected successfully!');
    
    const banners = await Banner.find({}).sort({ order: 1 });
    console.log(`\nChecking image URLs for ${banners.length} banners:`);
    console.log('='.repeat(60));
    
    banners.forEach((banner, i) => {
      console.log(`\n${i+1}. Banner: "${banner.title}"`);
      console.log(`   Order: ${banner.order}`);
      console.log(`   Image URL: ${banner.image || 'No image'}`);
      
      if (banner.image) {
        // Check if it's a full URL or relative path
        if (banner.image.startsWith('http')) {
          console.log(`   Type: Full URL`);
        } else if (banner.image.startsWith('/')) {
          console.log(`   Type: Absolute path`);
          console.log(`   Full URL would be: http://localhost:5000${banner.image}`);
        } else {
          console.log(`   Type: Relative path`);
          console.log(`   Full URL would be: http://localhost:5000/${banner.image}`);
        }
      }
    });
    
    await mongoose.disconnect();
    console.log('\n\nDisconnected from MongoDB.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkBannerImages();