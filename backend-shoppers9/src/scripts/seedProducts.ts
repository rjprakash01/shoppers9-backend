import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { User } from '../models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const seedProducts = async () => {
  try {
    console.log('🌱 Starting product seeding...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Get categories
    const categories = await Category.find({}).lean();
    const electronicsCategory = categories.find((c: any) => c.slug === 'electronics');
    const fashionCategory = categories.find((c: any) => c.slug === 'fashion');
    const homeGardenCategory = categories.find((c: any) => c.slug === 'home-garden');
    const booksCategory = categories.find((c: any) => c.slug === 'books');
    const sportsCategory = categories.find((c: any) => c.slug === 'sports');
    
    console.log('📂 Found categories:', {
      electronics: !!electronicsCategory,
      fashion: !!fashionCategory,
      homeGarden: !!homeGardenCategory,
      books: !!booksCategory,
      sports: !!sportsCategory
    });
    
    // Get or create a default admin user for product creation
    let adminUser = await User.findOne({ email: 'admin@shoppers9.com' });
    if (!adminUser) {
      adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@shoppers9.com',
        password: 'hashedpassword', // This should be properly hashed in real scenario
        role: 'admin',
        isVerified: true
      });
      await adminUser.save();
      console.log('👤 Created admin user for products');
    }
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');
    
    // Sample product data
    const products: any[] = [
      // Electronics
      {
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with advanced camera system and A17 Pro chip',
        price: 999,
        originalPrice: 1099,
        discountedPrice: 999,
        category: electronicsCategory?._id,
        brand: 'Apple',
        stock: 50,
        sku: 'IPHONE15PRO001',
        images: [
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMUYyOTM3Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+aVBob25lIDE1IFBybzwvdGV4dD4KPC9zdmc+'
        ],
        variants: [
          {
            color: 'Space Black',
            colorCode: '#1F2937',
            size: '128GB',
            price: 999,
            originalPrice: 1099,
            stock: 15,
            sku: 'IPHONE15PRO-SB-128',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMUYyOTM3Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U3BhY2UgQmxhY2s8L3RleHQ+Cjwvc3ZnPg==']
          },
          {
            color: 'Deep Purple',
            colorCode: '#6B46C1',
            size: '256GB',
            price: 1199,
            originalPrice: 1299,
            stock: 20,
            sku: 'IPHONE15PRO-DP-256',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjNkI0NkMxIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RGVlcCBQdXJwbGU8L3RleHQ+Cjwvc3ZnPg==']
          },
          {
            color: 'Gold',
            colorCode: '#F59E0B',
            size: '512GB',
            price: 1399,
            originalPrice: 1499,
            stock: 15,
            sku: 'IPHONE15PRO-GD-512',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjU5RTBCIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+R29sZDwvdGV4dD4KPC9zdmc+']
          }
        ],
        specifications: {
          processor: 'A17 Pro chip',
          display: '6.1-inch Super Retina XDR',
          camera: '48MP Main camera',
          battery: 'Up to 23 hours video playback'
        },
        tags: ['smartphone', 'apple', 'premium', 'camera'],
        isActive: true,
        approvalStatus: 'approved',
        createdBy: adminUser._id
      },
      
      // Fashion - Men's Shirt
      {
        name: 'Premium Cotton Shirt',
        description: 'High-quality cotton shirt perfect for formal and casual occasions',
        price: 49,
        originalPrice: 69,
        discountedPrice: 49,
        category: fashionCategory?._id,
        brand: 'StyleCraft',
        stock: 100,
        sku: 'SHIRT001',
        images: [
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q290dG9uIFNoaXJ0PC90ZXh0Pgo8L3N2Zz4='
        ],
        variants: [
          {
            color: 'White',
            colorCode: '#FFFFFF',
            size: 'M',
            price: 49,
            originalPrice: 69,
            stock: 25,
            sku: 'SHIRT001-WH-M',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNjY2MiLz4KPHRleHQgeD0iMjAwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPldoaXRlIE08L3RleHQ+Cjwvc3ZnPg==']
          },
          {
            color: 'Blue',
            colorCode: '#3B82F6',
            size: 'L',
            price: 49,
            originalPrice: 69,
            stock: 30,
            sku: 'SHIRT001-BL-L',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjM0I4MkY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Qmx1ZSBMPC90ZXh0Pgo8L3N2Zz4=']
          },
          {
            color: 'Black',
            colorCode: '#000000',
            size: 'XL',
            price: 49,
            originalPrice: 69,
            stock: 20,
            sku: 'SHIRT001-BK-XL',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMDAwMDAwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QmxhY2sgWEw8L3RleHQ+Cjwvc3ZnPg==']
          }
        ],
        specifications: {
          fabric: '100% Cotton',
          fit: 'Regular Fit',
          collar: 'Spread Collar',
          care: 'Machine Wash'
        },
        tags: ['shirt', 'cotton', 'formal', 'casual'],
        isActive: true,
        approvalStatus: 'approved',
        createdBy: adminUser._id
      },
      
      // Home & Garden
      {
        name: 'Ergonomic Office Chair',
        description: 'Comfortable ergonomic office chair with lumbar support and adjustable height',
        price: 299,
        originalPrice: 399,
        discountedPrice: 299,
        category: homeGardenCategory?._id,
        brand: 'ComfortSeating',
        stock: 25,
        sku: 'CHAIR001',
        images: [
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjNEI1NTYzIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+T2ZmaWNlIENoYWlyPC90ZXh0Pgo8L3N2Zz4='
        ],
        variants: [
          {
            color: 'Black',
            colorCode: '#000000',
            size: 'Standard',
            price: 299,
            originalPrice: 399,
            stock: 15,
            sku: 'CHAIR001-BK-STD',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMDAwMDAwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QmxhY2sgQ2hhaXI8L3RleHQ+Cjwvc3ZnPg==']
          },
          {
            color: 'Gray',
            colorCode: '#6B7280',
            size: 'Standard',
            price: 299,
            originalPrice: 399,
            stock: 10,
            sku: 'CHAIR001-GR-STD',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjNkI3MjgwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+R3JheSBDaGFpcjwvdGV4dD4KPC9zdmc+']
          }
        ],
        specifications: {
          material: 'Mesh and Fabric',
          adjustable: 'Height, Armrests, Lumbar',
          weight_capacity: '300 lbs',
          warranty: '5 years'
        },
        tags: ['chair', 'office', 'ergonomic', 'furniture'],
        isActive: true,
        approvalStatus: 'approved',
        createdBy: adminUser._id
      },
      
      // Books
      {
        name: 'The Art of Programming',
        description: 'Comprehensive guide to modern programming techniques and best practices',
        price: 39,
        originalPrice: 49,
        discountedPrice: 39,
        category: booksCategory?._id,
        brand: 'TechBooks',
        stock: 75,
        sku: 'BOOK001',
        images: [
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMTBCOTgxIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UHJvZ3JhbW1pbmcgQm9vazwvdGV4dD4KPC9zdmc+'
        ],
        variants: [
          {
            color: 'Hardcover',
            colorCode: '#10B981',
            size: 'Standard',
            price: 39,
            originalPrice: 49,
            stock: 50,
            sku: 'BOOK001-HC-STD',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMTBCOTgxIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SGFyZGNvdmVyPC90ZXh0Pgo8L3N2Zz4=']
          },
          {
            color: 'Paperback',
            colorCode: '#F59E0B',
            size: 'Standard',
            price: 29,
            originalPrice: 39,
            stock: 25,
            sku: 'BOOK001-PB-STD',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjU5RTBCIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UGFwZXJiYWNrPC90ZXh0Pgo8L3N2Zz4=']
          }
        ],
        specifications: {
          pages: '450',
          publisher: 'TechBooks Publishing',
          language: 'English',
          isbn: '978-1234567890'
        },
        tags: ['book', 'programming', 'technology', 'education'],
        isActive: true,
        approvalStatus: 'approved',
        createdBy: adminUser._id
      },
      
      // Sports
      {
        name: 'Professional Tennis Racket',
        description: 'High-performance tennis racket for professional and amateur players',
        price: 149,
        originalPrice: 199,
        discountedPrice: 149,
        category: sportsCategory?._id,
        brand: 'SportsPro',
        stock: 40,
        sku: 'RACKET001',
        images: [
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRUY0NDQ0Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VGVubmlzIFJhY2tldDwvdGV4dD4KPC9zdmc+'
        ],
        variants: [
          {
            color: 'Red',
            colorCode: '#EF4444',
            size: 'Standard',
            price: 149,
            originalPrice: 199,
            stock: 20,
            sku: 'RACKET001-RD-STD',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRUY0NDQ0Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UmVkIFJhY2tldDwvdGV4dD4KPC9zdmc+']
          },
          {
            color: 'Blue',
            colorCode: '#3B82F6',
            size: 'Standard',
            price: 149,
            originalPrice: 199,
            stock: 20,
            sku: 'RACKET001-BL-STD',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjM0I4MkY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Qmx1ZSBSYWNrZXQ8L3RleHQ+Cjwvc3ZnPg==']
          }
        ],
        specifications: {
          weight: '300g',
          string_pattern: '16x19',
          head_size: '100 sq in',
          material: 'Graphite'
        },
        tags: ['tennis', 'racket', 'sports', 'professional'],
        isActive: true,
        approvalStatus: 'approved',
        createdBy: adminUser._id
      },
      
      // Additional Fashion Item - Women's Dress
      {
        name: 'Elegant Summer Dress',
        description: 'Beautiful floral summer dress perfect for casual and semi-formal occasions',
        price: 79,
        originalPrice: 99,
        discountedPrice: 79,
        category: fashionCategory?._id,
        brand: 'FashionForward',
        stock: 60,
        sku: 'DRESS001',
        images: [
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRkJCRjI0Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TdW1tZXIgRHJlc3M8L3RleHQ+Cjwvc3ZnPg=='
        ],
        variants: [
          {
            color: 'Floral Yellow',
            colorCode: '#FBBF24',
            size: 'S',
            price: 79,
            originalPrice: 99,
            stock: 15,
            sku: 'DRESS001-FY-S',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRkJCRjI0Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ZZWxsb3cgUzwvdGV4dD4KPC9zdmc+']
          },
          {
            color: 'Floral Pink',
            colorCode: '#F472B6',
            size: 'M',
            price: 79,
            originalPrice: 99,
            stock: 20,
            sku: 'DRESS001-FP-M',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjQ3MkI2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UGluayBNPC90ZXh0Pgo8L3N2Zz4=']
          },
          {
            color: 'Floral Blue',
            colorCode: '#60A5FA',
            size: 'L',
            price: 79,
            originalPrice: 99,
            stock: 25,
            sku: 'DRESS001-FB-L',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjNjBBNUZBIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Qmx1ZSBMPC90ZXh0Pgo8L3N2Zz4=']
          }
        ],
        specifications: {
          fabric: 'Cotton Blend',
          pattern: 'Floral Print',
          length: 'Knee Length',
          care: 'Machine Wash Cold'
        },
        tags: ['dress', 'summer', 'floral', 'women'],
        isActive: true,
        approvalStatus: 'approved',
        createdBy: adminUser._id
      },
      
      // Electronics - Laptop
      {
        name: 'Gaming Laptop Pro',
        description: 'High-performance gaming laptop with RTX graphics and fast processor',
        price: 1299,
        originalPrice: 1499,
        discountedPrice: 1299,
        category: electronicsCategory?._id,
        brand: 'GameTech',
        stock: 15,
        sku: 'LAPTOP001',
        images: [
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+R2FtaW5nIExhcHRvcDwvdGV4dD4KPC9zdmc+'
        ],
        variants: [
          {
            color: 'Black',
            colorCode: '#000000',
            size: '15.6 inch',
            price: 1299,
            originalPrice: 1499,
            stock: 8,
            sku: 'LAPTOP001-BK-15',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMDAwMDAwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QmxhY2sgMTUuNiI8L3RleHQ+Cjwvc3ZnPg==']
          },
          {
            color: 'Silver',
            colorCode: '#C0C0C0',
            size: '17.3 inch',
            price: 1399,
            originalPrice: 1599,
            stock: 7,
            sku: 'LAPTOP001-SL-17',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjQzBDMEMwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TaWx2ZXIgMTcuMyI8L3RleHQ+Cjwvc3ZnPg==']
          }
        ],
        specifications: {
          processor: 'Intel i7-12700H',
          graphics: 'RTX 4060',
          ram: '16GB DDR4',
          storage: '1TB SSD'
        },
        tags: ['laptop', 'gaming', 'computer', 'electronics'],
        isActive: true,
        approvalStatus: 'approved',
        createdBy: adminUser._id
      }
    ];
    
    // Calculate total stock for each product
    products.forEach((product: any) => {
      if (product.variants && product.variants.length > 0) {
        product.stock = product.variants.reduce((total: number, variant: any) => total + variant.stock, 0);
      }
    });
    
    // Insert products
    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} products successfully!`);
    
    // Log summary
    console.log('\n📊 Product Summary:');
    createdProducts.forEach((product: any) => {
      console.log(`- ${product.name}: ${product.variants?.length || 0} variants, ${product.stock} total stock`);
    });
    
    console.log('\n🎉 Product seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  } finally {
    console.log('🔌 Disconnecting from database...');
    await mongoose.disconnect();
  }
};

// Run the script
if (require.main === module) {
  seedProducts()
    .then(() => {
      console.log('✅ Products seeded successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Product seeding failed:', error);
      process.exit(1);
    });
}

export default seedProducts;