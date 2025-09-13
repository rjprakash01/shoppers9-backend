import mongoose from 'mongoose';
import Product from '../models/Product';
import Category from '../models/Category';
import connectDB from '../config/database';

const seedTestProducts = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    // Find or create categories
    let menCategory = await Category.findOne({ name: 'Men' });
    if (!menCategory) {
      menCategory = new Category({
        name: 'Men',
        slug: 'men',
        description: 'Men\'s clothing and accessories',
        isActive: true,
        level: 1
      });
      await menCategory.save();
    }
    
    console.log('Creating test products with proper variant pricing...');
    
    // Test Product 1: T-Shirt with multiple colors and sizes
    const tshirt = new Product({
      name: 'Premium Cotton T-Shirt',
      description: 'High-quality cotton t-shirt available in multiple colors and sizes',
      category: menCategory._id,
      subCategory: menCategory._id,
      brand: 'TestBrand',
      images: ['https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=T-Shirt'],
      variants: [
        {
          color: 'Blue',
          colorCode: '#4A90E2',
          size: 'M',
          price: 599,
          originalPrice: 799,
          stock: 10,
          images: ['https://via.placeholder.com/400x400/4A90E2/FFFFFF?text=Blue+M']
        },
        {
          color: 'Blue',
          colorCode: '#4A90E2',
          size: 'L',
          price: 649,
          originalPrice: 849,
          stock: 8,
          images: ['https://via.placeholder.com/400x400/4A90E2/FFFFFF?text=Blue+L']
        },
        {
          color: 'Red',
          colorCode: '#E74C3C',
          size: 'M',
          price: 599,
          originalPrice: 799,
          stock: 12,
          images: ['https://via.placeholder.com/400x400/E74C3C/FFFFFF?text=Red+M']
        },
        {
          color: 'Red',
          colorCode: '#E74C3C',
          size: 'L',
          price: 649,
          originalPrice: 849,
          stock: 6,
          images: ['https://via.placeholder.com/400x400/E74C3C/FFFFFF?text=Red+L']
        }
      ],
      specifications: {
        fabric: '100% Cotton',
        fit: 'Regular Fit',
        washCare: 'Machine wash cold'
      },
      tags: ['cotton', 'casual', 'comfortable'],
      isActive: true,
      isFeatured: true
    });
    
    await tshirt.save();
    console.log('Created T-Shirt with variants');
    
    // Test Product 2: Jeans with different sizes
    const jeans = new Product({
      name: 'Classic Denim Jeans',
      description: 'Comfortable denim jeans in various sizes',
      category: menCategory._id,
      subCategory: menCategory._id,
      brand: 'TestBrand',
      images: ['https://via.placeholder.com/400x400/2C3E50/FFFFFF?text=Jeans'],
      variants: [
        {
          color: 'Dark Blue',
          colorCode: '#2C3E50',
          size: '32',
          price: 1299,
          originalPrice: 1599,
          stock: 5,
          images: ['https://via.placeholder.com/400x400/2C3E50/FFFFFF?text=Jeans+32']
        },
        {
          color: 'Dark Blue',
          colorCode: '#2C3E50',
          size: '34',
          price: 1299,
          originalPrice: 1599,
          stock: 7,
          images: ['https://via.placeholder.com/400x400/2C3E50/FFFFFF?text=Jeans+34']
        },
        {
          color: 'Light Blue',
          colorCode: '#5DADE2',
          size: '32',
          price: 1199,
          originalPrice: 1499,
          stock: 4,
          images: ['https://via.placeholder.com/400x400/5DADE2/FFFFFF?text=Light+32']
        }
      ],
      specifications: {
        fabric: 'Denim',
        fit: 'Slim Fit',
        washCare: 'Machine wash'
      },
      tags: ['denim', 'casual', 'jeans'],
      isActive: true
    });
    
    await jeans.save();
    console.log('Created Jeans with variants');
    
    console.log('Test products created successfully!');
    console.log('Disconnecting from database...');
    await mongoose.disconnect();
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding test products:', error);
    process.exit(1);
  }
};

// Run the script
seedTestProducts();