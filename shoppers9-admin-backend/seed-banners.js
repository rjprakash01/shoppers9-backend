const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Banner schema (simplified for seeding)
const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: String,
  description: String,
  image: { type: String, required: true },
  link: String,
  buttonText: String,
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  displayType: { type: String, enum: ['carousel', 'category-card', 'both'], default: 'carousel' },
  categoryId: String
}, { timestamps: true });

const Banner = mongoose.model('Banner', bannerSchema);

// Dummy banner data
const dummyBanners = [
  {
    title: "Summer Sale 2024",
    subtitle: "Up to 70% Off",
    description: "Discover amazing deals on summer fashion and accessories",
    image: "/uploads/banners/summer-sale.svg",
    link: "/products?category=summer",
    buttonText: "Shop Now",
    isActive: true,
    order: 1,
    displayType: "carousel"
  },
  {
    title: "New Arrivals",
    subtitle: "Fresh Fashion Trends",
    description: "Check out the latest fashion trends and styles",
    image: "/uploads/banners/new-arrivals.svg",
    link: "/products?sortBy=newest",
    buttonText: "Explore",
    isActive: true,
    order: 2,
    displayType: "carousel"
  },
  {
    title: "Men's Collection",
    subtitle: "Style & Comfort",
    description: "Premium men's clothing and accessories",
    image: "/uploads/banners/mens-collection.svg",
    link: "/category/men",
    buttonText: "Shop Men's",
    isActive: true,
    order: 3,
    displayType: "both",
    categoryId: "men"
  },
  {
    title: "Women's Fashion",
    subtitle: "Elegant & Trendy",
    description: "Beautiful women's fashion for every occasion",
    image: "/uploads/banners/womens-fashion.svg",
    link: "/category/women",
    buttonText: "Shop Women's",
    isActive: true,
    order: 4,
    displayType: "both",
    categoryId: "women"
  },
  {
    title: "Home & Living",
    subtitle: "Transform Your Space",
    description: "Quality household items and home decor",
    image: "/uploads/banners/home-living.svg",
    link: "/category/household",
    buttonText: "Shop Home",
    isActive: true,
    order: 5,
    displayType: "category-card",
    categoryId: "household"
  },
  {
    title: "Special Offers",
    subtitle: "Limited Time Deals",
    description: "Don't miss out on these exclusive offers",
    image: "/uploads/banners/special-offers.svg",
    link: "/products?discount=true",
    buttonText: "Get Deals",
    isActive: true,
    order: 6,
    displayType: "carousel"
  }
];

async function seedBanners() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9');
    console.log('Connected to MongoDB');

    // Clear existing banners
    await Banner.deleteMany({});
    console.log('Cleared existing banners');

    // Insert dummy banners
    const banners = await Banner.insertMany(dummyBanners);
    console.log(`✅ Created ${banners.length} dummy banners:`);
    
    banners.forEach((banner, index) => {
      console.log(`${index + 1}. ${banner.title} (${banner.displayType})`);
    });

    console.log('\n🎉 Banner seeding completed successfully!');
    console.log('\nBanners created for:');
    console.log('- Carousel display (4 banners)');
    console.log('- Category postcards (3 banners)');
    console.log('- Mixed display (2 banners)');
    
  } catch (error) {
    console.error('Error seeding banners:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the seeding function
seedBanners();