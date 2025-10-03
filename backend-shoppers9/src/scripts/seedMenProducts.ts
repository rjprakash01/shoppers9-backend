import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { User } from '../models/User';
import dotenv from 'dotenv';
import { connectDB } from '../config/database';

// Load environment variables
dotenv.config();

const seedMenProducts = async () => {
  try {
    console.log('🌱 Starting men\'s product seeding...');
    
    await connectDB();
    console.log('✅ Connected to MongoDB');
    
    // Get categories
    const categories = await Category.find({}).lean();
    const menCategory = categories.find((c: any) => c.slug === 'men');
    const menClothingCategory = categories.find((c: any) => c.slug === 'men-clothing');
    const menTShirtsCategory = categories.find((c: any) => c.slug === 'men-tshirts');
    const menJeansCategory = categories.find((c: any) => c.slug === 'men-jeans');
    const menShoesCategory = categories.find((c: any) => c.slug === 'men-shoes');
    
    console.log('📂 Found categories:', {
      men: !!menCategory,
      menClothing: !!menClothingCategory,
      menTShirts: !!menTShirtsCategory,
      menJeans: !!menJeansCategory,
      menShoes: !!menShoesCategory
    });
    
    if (!menCategory) {
      throw new Error('Men category not found. Please run seedComprehensiveCategories.ts first.');
    }
    
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
    
    // Men's product data
    const menProducts: any[] = [
      // Men's T-Shirts
      {
        name: 'Premium Cotton T-Shirt',
        description: 'High-quality 100% cotton t-shirt with comfortable fit',
        price: 29.99,
        originalPrice: 39.99,
        discountedPrice: 29.99,
        category: menCategory._id,
        subCategory: menClothingCategory?._id,
        subSubCategory: menTShirtsCategory?._id,
        brand: 'ComfortWear',
        stock: 100,
        sku: 'MEN-TSHIRT-001',
        images: [
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UHJlbWl1bSBULVNoaXJ0PC90ZXh0Pgo8L3N2Zz4='
        ],
        variants: [
          {
            color: 'Black',
            colorCode: '#000000',
            size: 'M',
            price: 29.99,
            originalPrice: 39.99,
            stock: 25,
            sku: 'MEN-TSHIRT-001-BLK-M',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMDAwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QmxhY2sgVC1TaGlydDwvdGV4dD4KPC9zdmc+']
          },
          {
            color: 'White',
            colorCode: '#FFFFFF',
            size: 'L',
            price: 29.99,
            originalPrice: 39.99,
            stock: 30,
            sku: 'MEN-TSHIRT-001-WHT-L',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRkZGIiBzdHJva2U9IiNjY2MiLz4KPHRleHQgeD0iMjAwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPldoaXRlIFQtU2hpcnQ8L3RleHQ+Cjwvc3ZnPg==']
          }
        ],
        tags: ['cotton', 'casual', 'comfortable'],
        isActive: true,
        isFeatured: true,
        createdBy: adminUser._id,
        specifications: {
          material: '100% Cotton',
          fit: 'Regular',
          care: 'Machine wash cold'
        }
      },
      {
        name: 'Classic Denim Jeans',
        description: 'Timeless denim jeans with perfect fit and durability',
        price: 79.99,
        originalPrice: 99.99,
        discountedPrice: 79.99,
        category: menCategory._id,
        subCategory: menClothingCategory?._id,
        subSubCategory: menJeansCategory?._id,
        brand: 'DenimCraft',
        stock: 75,
        sku: 'MEN-JEANS-001',
        images: [
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjNEE1NTY4Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q2xhc3NpYyBKZWFuczwvdGV4dD4KPC9zdmc+'
        ],
        variants: [
          {
            color: 'Dark Blue',
            colorCode: '#1E3A8A',
            size: '32',
            price: 79.99,
            originalPrice: 99.99,
            stock: 20,
            sku: 'MEN-JEANS-001-DB-32',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMUUzQThBIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RGFyayBCbHVlIEplYW5zPC90ZXh0Pgo8L3N2Zz4=']
          },
          {
            color: 'Light Blue',
            colorCode: '#3B82F6',
            size: '34',
            price: 79.99,
            originalPrice: 99.99,
            stock: 25,
            sku: 'MEN-JEANS-001-LB-34',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjM0I4MkY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TGlnaHQgQmx1ZSBKZWFUCZWFUCY8L3RleHQ+Cjwvc3ZnPg==']
          }
        ],
        tags: ['denim', 'classic', 'versatile'],
        isActive: true,
        isFeatured: false,
        createdBy: adminUser._id,
        specifications: {
          material: '98% Cotton, 2% Elastane',
          fit: 'Slim',
          care: 'Machine wash cold, tumble dry low'
        }
      },
      {
        name: 'Casual Sneakers',
        description: 'Comfortable and stylish sneakers for everyday wear',
        price: 89.99,
        originalPrice: 119.99,
        discountedPrice: 89.99,
        category: menCategory._id,
        subCategory: menShoesCategory?._id,
        brand: 'StepComfort',
        stock: 60,
        sku: 'MEN-SHOES-001',
        images: [
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjNkI3Mjg0Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q2FzdWFsIFNuZWFrZXJzPC90ZXh0Pgo8L3N2Zz4='
        ],
        variants: [
          {
            color: 'White',
            colorCode: '#FFFFFF',
            size: '10',
            price: 89.99,
            originalPrice: 119.99,
            stock: 15,
            sku: 'MEN-SHOES-001-WHT-10',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRkZGIiBzdHJva2U9IiNjY2MiLz4KPHR leHQgeD0iMjAwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPldoaXRlIFNuZWFrZXJzPC90ZXh0Pgo8L3N2Zz4=']
          },
          {
            color: 'Black',
            colorCode: '#000000',
            size: '11',
            price: 89.99,
            originalPrice: 119.99,
            stock: 20,
            sku: 'MEN-SHOES-001-BLK-11',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMDAwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QmxhY2sgU25lYWtlcnM8L3RleHQ+Cjwvc3ZnPg==']
          }
        ],
        tags: ['sneakers', 'casual', 'comfortable'],
        isActive: true,
        isFeatured: true,
        createdBy: adminUser._id,
        specifications: {
          material: 'Canvas and Rubber',
          sole: 'Rubber',
          care: 'Wipe clean with damp cloth'
        }
      },
      {
        name: 'Formal Dress Shirt',
        description: 'Elegant formal shirt perfect for business and special occasions',
        price: 59.99,
        originalPrice: 79.99,
        discountedPrice: 59.99,
        category: menCategory._id,
        subCategory: menClothingCategory?._id,
        brand: 'FormalWear',
        stock: 40,
        sku: 'MEN-SHIRT-001',
        images: [
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMUY0OTY3Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Rm9ybWFsIFNoaXJ0PC90ZXh0Pgo8L3N2Zz4='
        ],
        variants: [
          {
            color: 'White',
            colorCode: '#FFFFFF',
            size: 'L',
            price: 59.99,
            originalPrice: 79.99,
            stock: 15,
            sku: 'MEN-SHIRT-001-WHT-L',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRkZGIiBzdHJva2U9IiNjY2MiLz4KPHR leHQgeD0iMjAwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPldoaXRlIFNoaXJ0PC90ZXh0Pgo8L3N2Zz4=']
          },
          {
            color: 'Light Blue',
            colorCode: '#DBEAFE',
            size: 'XL',
            price: 59.99,
            originalPrice: 79.99,
            stock: 12,
            sku: 'MEN-SHIRT-001-LB-XL',
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjREJFQUZFIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5MaWdodCBCbHVlIFNoaXJ0PC90ZXh0Pgo8L3N2Zz4=']
          }
        ],
        tags: ['formal', 'business', 'elegant'],
        isActive: true,
        isFeatured: false,
        createdBy: adminUser._id,
        specifications: {
          material: '100% Cotton',
          fit: 'Slim Fit',
          care: 'Dry clean recommended'
        }
      }
    ];
    
    // Insert products
    const createdProducts = await Product.insertMany(menProducts);
    console.log(`✅ Created ${createdProducts.length} men's products:`);
    
    createdProducts.forEach(product => {
      console.log(`- ${product.name} (${product.sku})`);
    });
    
    console.log('\n🎉 Men\'s products seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Men\'s product seeding failed:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedMenProducts();