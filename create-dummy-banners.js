const axios = require('axios');

// Sample banner data
const bannerData = [
  {
    title: 'Summer Sale 2024',
    subtitle: 'Up to 50% Off Fashion Items',
    description: 'Discover amazing deals on summer fashion collection',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI2MDAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+U3VtbWVyIFNhbGUgMjAyNDwvdGV4dD4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl8wXzEiIHgxPSIwIiB5MT0iMCIgeDI9IjEyMDAiIHkyPSI0MDAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzNGODNGOCIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMxRDRFRDgiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K',
    link: '/products?category=fashion',
    buttonText: 'Shop Now',
    isActive: true,
    order: 1,
    categoryId: 'electronics' // Will be replaced with actual ID
  },
  {
    title: 'Electronics Mega Sale',
    subtitle: 'Latest Gadgets & Tech',
    description: 'Get the newest electronics at unbeatable prices',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI2MDAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+RWxlY3Ryb25pY3MgTWVnYSBTYWxlPC90ZXh0Pgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzBfMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMTIwMCIgeTI9IjQwMCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjRkY3MDQzIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0VGNDQ0NCIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPgo=',
    link: '/products?category=electronics',
    buttonText: 'Explore',
    isActive: true,
    order: 2,
    categoryId: 'electronics'
  },
  {
    title: 'Home & Garden Collection',
    subtitle: 'Transform Your Space',
    description: 'Beautiful home decor and garden essentials',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI2MDAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SG9tZSAmIEdhcmRlbjwvdGV4dD4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl8wXzEiIHgxPSIwIiB5MT0iMCIgeDI9IjEyMDAiIHkyPSI0MDAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzEwQjk4MSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwNTk2NjkiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K',
    link: '/products?category=home-garden',
    buttonText: 'Browse',
    isActive: true,
    order: 3,
    categoryId: 'home-garden'
  },
  {
    title: 'Book Lovers Paradise',
    subtitle: 'Expand Your Mind',
    description: 'Discover new worlds through our book collection',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI2MDAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Qm9vayBMb3ZlcnMgUGFyYWRpc2U8L3RleHQ+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMF8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxMjAwIiB5Mj0iNDAwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiM4QjVDRjYiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzA0OEU4Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+Cg==',
    link: '/products?category=books',
    buttonText: 'Read More',
    isActive: true,
    order: 4,
    categoryId: 'books'
  },
  {
    title: 'Sports & Fitness',
    subtitle: 'Stay Active, Stay Healthy',
    description: 'Premium sports equipment for all your fitness needs',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI2MDAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+U3BvcnRzICYgRml0bmVzczwvdGV4dD4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl8wXzEiIHgxPSIwIiB5MT0iMCIgeDI9IjEyMDAiIHkyPSI0MDAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iI0Y5NzMxNiIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNFQTU4MEMiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K',
    link: '/products?category=sports',
    buttonText: 'Get Active',
    isActive: true,
    order: 5,
    categoryId: 'sports'
  }
];

async function createBanners() {
  try {
    console.log('🚀 Starting banner creation...');
    
    // First, get available categories
    console.log('📋 Fetching categories...');
    const categoriesResponse = await axios.get('http://localhost:5001/api/admin/categories', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2E0OWQyOTIyYjQ5YWQ0ZjIwMzk1ZSIsImlhdCI6MTc1ODgxMTkyMywiZXhwIjoxNzU4ODk4MzIzfQ.o_e-YW0YS-R1GYorE1bGnHDw2fexyq6R6zrW40DRZD4'
      }
    });
    
    const categories = categoriesResponse.data.data?.categories || [];
    console.log(`✅ Found ${categories.length} categories`);
    
    if (categories.length === 0) {
      console.log('⚠️  No categories found. Creating banners with placeholder categoryId...');
    }
    
    // Create banners
    for (let i = 0; i < bannerData.length; i++) {
      const banner = { ...bannerData[i] };
      
      // Try to match category by slug or name
      if (categories.length > 0) {
        const matchingCategory = categories.find(cat => 
          cat.slug === banner.categoryId || 
          cat.name.toLowerCase() === banner.categoryId.toLowerCase()
        );
        
        if (matchingCategory) {
          banner.categoryId = matchingCategory.id || matchingCategory._id;
        } else {
          // Use the first available category as fallback
          banner.categoryId = categories[0].id || categories[0]._id;
        }
      } else {
        // If no categories, use a placeholder
        banner.categoryId = 'placeholder-category-id';
      }
      
      console.log(`📝 Creating banner ${i + 1}: ${banner.title}`);
      
      try {
        const response = await axios.post('http://localhost:5001/api/admin/banners', banner, {
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2E0OWQyOTIyYjQ5YWQ0ZjIwMzk1ZSIsImlhdCI6MTc1ODgxMTkyMywiZXhwIjoxNzU4ODk4MzIzfQ.o_e-YW0YS-R1GYorE1bGnHDw2fexyq6R6zrW40DRZD4',
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ Banner created successfully: ${response.data.data.title}`);
      } catch (error) {
        console.error(`❌ Failed to create banner ${i + 1}:`, error.response?.data || error.message);
      }
    }
    
    console.log('🎉 Banner creation process completed!');
    
  } catch (error) {
    console.error('💥 Error in banner creation process:', error.response?.data || error.message);
  }
}

// Run the function
createBanners();