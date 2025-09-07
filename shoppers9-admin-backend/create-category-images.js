const fs = require('fs');
const path = require('path');

// Create uploads/categories directory if it doesn't exist
const categoriesDir = path.join(__dirname, 'uploads', 'categories');
if (!fs.existsSync(categoriesDir)) {
  fs.mkdirSync(categoriesDir, { recursive: true });
  console.log('Created categories directory');
}

// SVG template for category images
const createCategoryImage = (title, bgColor, textColor, icon) => `
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${bgColor.replace('#', '')}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${bgColor}dd;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" rx="15" fill="url(#grad${bgColor.replace('#', '')})"/>
  <text x="200" y="180" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="${textColor}" text-anchor="middle">${title}</text>
  <text x="200" y="120" font-family="Arial, sans-serif" font-size="48" text-anchor="middle">${icon}</text>
  <rect x="50" y="220" width="300" height="40" rx="20" fill="${textColor}" opacity="0.9"/>
  <text x="200" y="245" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="${bgColor}" text-anchor="middle">Shop Now</text>
</svg>`;

// Category configurations
const categories = [
  {
    filename: 'men.svg',
    title: 'Men',
    bgColor: '#2563EB',
    textColor: '#FFFFFF',
    icon: '👔'
  },
  {
    filename: 'women.svg',
    title: 'Women',
    bgColor: '#EC4899',
    textColor: '#FFFFFF',
    icon: '👗'
  },
  {
    filename: 'clothing.svg',
    title: 'Clothing',
    bgColor: '#7C3AED',
    textColor: '#FFFFFF',
    icon: '👕'
  },
  {
    filename: 'footwear.svg',
    title: 'Footwear',
    bgColor: '#059669',
    textColor: '#FFFFFF',
    icon: '👟'
  },
  {
    filename: 'accessories.svg',
    title: 'Accessories',
    bgColor: '#DC2626',
    textColor: '#FFFFFF',
    icon: '👜'
  },
  {
    filename: 'household.svg',
    title: 'Household',
    bgColor: '#EA580C',
    textColor: '#FFFFFF',
    icon: '🏠'
  },
  {
    filename: 't-shirt.svg',
    title: 'T-Shirts',
    bgColor: '#0891B2',
    textColor: '#FFFFFF',
    icon: '👕'
  },
  {
    filename: 'jeans.svg',
    title: 'Jeans',
    bgColor: '#1E40AF',
    textColor: '#FFFFFF',
    icon: '👖'
  },
  {
    filename: 'shoes.svg',
    title: 'Shoes',
    bgColor: '#7C2D12',
    textColor: '#FFFFFF',
    icon: '👞'
  },
  {
    filename: 'sandals.svg',
    title: 'Sandals',
    bgColor: '#B45309',
    textColor: '#FFFFFF',
    icon: '👡'
  },
  {
    filename: 'saree.svg',
    title: 'Sarees',
    bgColor: '#BE185D',
    textColor: '#FFFFFF',
    icon: '🥻'
  },
  {
    filename: 'dresses.svg',
    title: 'Dresses',
    bgColor: '#C2410C',
    textColor: '#FFFFFF',
    icon: '👗'
  },
  {
    filename: 'kitchen.svg',
    title: 'Kitchen',
    bgColor: '#059669',
    textColor: '#FFFFFF',
    icon: '🍳'
  },
  {
    filename: 'garden.svg',
    title: 'Garden',
    bgColor: '#16A34A',
    textColor: '#FFFFFF',
    icon: '🌱'
  },
  {
    filename: 'utensils.svg',
    title: 'Utensils',
    bgColor: '#4338CA',
    textColor: '#FFFFFF',
    icon: '🍴'
  },
  {
    filename: 'tools.svg',
    title: 'Tools',
    bgColor: '#6B7280',
    textColor: '#FFFFFF',
    icon: '🔧'
  }
];

// Create SVG files
categories.forEach(category => {
  const svgContent = createCategoryImage(category.title, category.bgColor, category.textColor, category.icon);
  
  const filePath = path.join(categoriesDir, category.filename);
  fs.writeFileSync(filePath, svgContent);
  console.log(`✅ Created ${category.filename}`);
});

console.log('\n🎉 All category images created successfully!');
console.log(`📁 Images saved to: ${categoriesDir}`);
console.log(`\n📋 Created ${categories.length} category images:`);
categories.forEach((category, index) => {
  console.log(`${index + 1}. ${category.title}`);
});