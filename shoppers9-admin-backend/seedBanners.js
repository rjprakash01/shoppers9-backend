const mongoose = require('mongoose');

// MongoDB connection string from environment or default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://prakashjetender_db_user:xRqrYjAzv6pwB1EV@mongodbshoppers9.dytfqs2.mongodb.net/admin_db?retryWrites=true&w=majority&appName=MongoDBShoppers9';

// Define Banner schema directly
const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: 300
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  image: {
    type: String,
    required: true
  },
  link: {
    type: String,
    trim: true
  },
  buttonText: {
    type: String,
    trim: true,
    maxlength: 50
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  categoryId: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const Banner = mongoose.model('Banner', bannerSchema);

async function seedBanners() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing banners
    console.log('🗑️ Clearing existing banners...');
    await Banner.deleteMany({});
    console.log('✅ Existing banners cleared');

    // Create sample banners
    const banners = [
      {
        title: 'Summer Sale',
        subtitle: 'Up to 50% Off',
        description: 'Get amazing deals on summer collection',
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNGRkY4RjAiLz4KICA8dGV4dCB4PSI2MDAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzMzNzNkYyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+U3VtbWVyIFNhbGU8L3RleHQ+Cjwvc3ZnPg==',
        link: '/products',
        buttonText: 'Shop Now',
        isActive: true,
        order: 1,
        categoryId: 'general'
      },
      {
        title: 'New Arrivals',
        subtitle: 'Fresh Collection',
        description: 'Check out our latest products',
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNGMEY4RkYiLz4KICA8dGV4dCB4PSI2MDAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzEwN2M0MSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+TmV3IEFycml2YWxzPC90ZXh0Pgo8L3N2Zz4=',
        link: '/products/new',
        buttonText: 'Explore',
        isActive: true,
        order: 2,
        categoryId: 'new'
      },
      {
        title: 'Electronics Deal',
        subtitle: 'Tech Savings',
        description: 'Best prices on electronics',
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNGRkYwRjgiLz4KICA8dGV4dCB4PSI2MDAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI2RjMjYyNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+RWxlY3Ryb25pY3MgRGVhbDwvdGV4dD4KPC9zdmc+',
        link: '/products/category/electronics',
        buttonText: 'Shop Electronics',
        isActive: true,
        order: 3,
        categoryId: 'electronics'
      }
    ];

    console.log('📝 Creating banners...');
    const createdBanners = await Banner.insertMany(banners);
    console.log(`✅ Created ${createdBanners.length} banners`);

    // Display created banners
    console.log('\n📋 Created banners:');
    createdBanners.forEach((banner, index) => {
      console.log(`${index + 1}. ${banner.title} (Order: ${banner.order}, Active: ${banner.isActive})`);
    });

    console.log('\n🎉 Banner seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding banners:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedBanners();