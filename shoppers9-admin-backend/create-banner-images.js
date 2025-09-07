const fs = require('fs');
const path = require('path');

// Create uploads/banners directory if it doesn't exist
const bannersDir = path.join(__dirname, 'uploads', 'banners');
if (!fs.existsSync(bannersDir)) {
  fs.mkdirSync(bannersDir, { recursive: true });
  console.log('Created banners directory');
}

// SVG templates for different banner types
const createCarouselBanner = (title, subtitle, bgColor, textColor) => `
<svg width="1200" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${bgColor.replace('#', '')}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${bgColor}dd;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad${bgColor.replace('#', '')})"/>
  <text x="100" y="150" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="${textColor}">${title}</text>
  <text x="100" y="200" font-family="Arial, sans-serif" font-size="24" fill="${textColor}">${subtitle}</text>
  <rect x="100" y="250" width="150" height="50" rx="25" fill="${textColor}" opacity="0.9"/>
  <text x="175" y="280" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="${bgColor}" text-anchor="middle">Shop Now</text>
</svg>`;

const createCategoryCard = (title, subtitle, bgColor, textColor) => `
<svg width="600" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardGrad${bgColor.replace('#', '')}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${bgColor}cc;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" rx="15" fill="url(#cardGrad${bgColor.replace('#', '')})"/>
  <text x="50" y="100" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="${textColor}">${title}</text>
  <text x="50" y="140" font-family="Arial, sans-serif" font-size="18" fill="${textColor}">${subtitle}</text>
  <rect x="50" y="180" width="120" height="40" rx="20" fill="${textColor}" opacity="0.9"/>
  <text x="110" y="205" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${bgColor}" text-anchor="middle">Explore</text>
</svg>`;

// Banner configurations
const banners = [
  {
    filename: 'summer-sale.svg',
    title: 'Summer Sale 2024',
    subtitle: 'Up to 70% Off',
    bgColor: '#FF6B6B',
    textColor: '#FFFFFF',
    type: 'carousel'
  },
  {
    filename: 'new-arrivals.svg',
    title: 'New Arrivals',
    subtitle: 'Fresh Fashion Trends',
    bgColor: '#4ECDC4',
    textColor: '#FFFFFF',
    type: 'carousel'
  },
  {
    filename: 'mens-collection.svg',
    title: "Men's Collection",
    subtitle: 'Style & Comfort',
    bgColor: '#45B7D1',
    textColor: '#FFFFFF',
    type: 'both'
  },
  {
    filename: 'womens-fashion.svg',
    title: "Women's Fashion",
    subtitle: 'Elegant & Trendy',
    bgColor: '#E91E63',
    textColor: '#FFFFFF',
    type: 'both'
  },
  {
    filename: 'home-living.svg',
    title: 'Home & Living',
    subtitle: 'Transform Your Space',
    bgColor: '#8BC34A',
    textColor: '#FFFFFF',
    type: 'category'
  },
  {
    filename: 'special-offers.svg',
    title: 'Special Offers',
    subtitle: 'Limited Time Deals',
    bgColor: '#FF9800',
    textColor: '#FFFFFF',
    type: 'carousel'
  }
];

// Create SVG files
banners.forEach(banner => {
  const svgContent = banner.type === 'category' 
    ? createCategoryCard(banner.title, banner.subtitle, banner.bgColor, banner.textColor)
    : createCarouselBanner(banner.title, banner.subtitle, banner.bgColor, banner.textColor);
  
  const filePath = path.join(bannersDir, banner.filename);
  fs.writeFileSync(filePath, svgContent);
  console.log(`✅ Created ${banner.filename}`);
});

console.log('\n🎉 All banner images created successfully!');
console.log(`📁 Images saved to: ${bannersDir}`);
console.log('\n📋 Created banners:');
banners.forEach((banner, index) => {
  console.log(`${index + 1}. ${banner.title} (${banner.type})`);
});