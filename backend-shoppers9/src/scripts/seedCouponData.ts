import mongoose from 'mongoose';
import { Coupon } from '../models/Coupon';
import { connectDB } from '../config/database';

const seedCouponData = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing coupon data
    await Coupon.deleteMany({});
    console.log('Cleared existing coupon data');

    // Create sample coupons
    const coupons = [
      {
        code: 'WELCOME10',
        description: 'Welcome offer - Get 10% off on your first order',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 500,
        maxDiscountAmount: 200,
        usageLimit: 1000,
        usedCount: 0,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        applicableCategories: [],
        applicableProducts: []
      },
      {
        code: 'SAVE20',
        description: 'Flat 20% off on orders above ₹1000',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 1000,
        maxDiscountAmount: 500,
        usageLimit: 500,
        usedCount: 25,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        applicableCategories: [],
        applicableProducts: []
      },
      {
        code: 'FLAT100',
        description: 'Flat ₹100 off on orders above ₹800',
        discountType: 'fixed',
        discountValue: 100,
        minOrderAmount: 800,
        usageLimit: 200,
        usedCount: 45,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        applicableCategories: [],
        applicableProducts: []
      },
      {
        code: 'MEGA50',
        description: 'Mega sale - 50% off on orders above ₹2000',
        discountType: 'percentage',
        discountValue: 50,
        minOrderAmount: 2000,
        maxDiscountAmount: 1000,
        usageLimit: 100,
        usedCount: 78,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        applicableCategories: [],
        applicableProducts: []
      },
      {
        code: 'EXPIRED10',
        description: 'Expired coupon - 10% off',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 300,
        maxDiscountAmount: 150,
        usageLimit: 50,
        usedCount: 50,
        isActive: false,
        validFrom: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        validUntil: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        applicableCategories: [],
        applicableProducts: []
      },
      {
        code: 'NEWUSER15',
        description: 'New user special - 15% off on first purchase',
        discountType: 'percentage',
        discountValue: 15,
        minOrderAmount: 600,
        maxDiscountAmount: 300,
        usageLimit: 1000,
        usedCount: 156,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        applicableCategories: [],
        applicableProducts: []
      },
      {
        code: 'BULK25',
        description: 'Bulk purchase discount - 25% off on orders above ₹3000',
        discountType: 'percentage',
        discountValue: 25,
        minOrderAmount: 3000,
        maxDiscountAmount: 750,
        usageLimit: 50,
        usedCount: 12,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        applicableCategories: [],
        applicableProducts: []
      },
      {
        code: 'FLASH200',
        description: 'Flash sale - Flat ₹200 off on orders above ₹1500',
        discountType: 'fixed',
        discountValue: 200,
        minOrderAmount: 1500,
        usageLimit: 300,
        usedCount: 89,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        applicableCategories: [],
        applicableProducts: []
      },
      {
        code: 'WEEKEND30',
        description: 'Weekend special - 30% off on all items',
        discountType: 'percentage',
        discountValue: 30,
        minOrderAmount: 1200,
        maxDiscountAmount: 600,
        usageLimit: 150,
        usedCount: 67,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        applicableCategories: [],
        applicableProducts: []
      },
      {
        code: 'LOYALTY500',
        description: 'Loyalty reward - Flat ₹500 off on orders above ₹5000',
        discountType: 'fixed',
        discountValue: 500,
        minOrderAmount: 5000,
        usageLimit: 25,
        usedCount: 8,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        applicableCategories: [],
        applicableProducts: []
      }
    ];

    const createdCoupons = await Coupon.insertMany(coupons);
    console.log(`Created ${createdCoupons.length} sample coupons`);

    console.log('\n=== Coupon Data Seeded Successfully ===');
    console.log(`Total Coupons: ${createdCoupons.length}`);
    console.log('\nCoupons created:');
    createdCoupons.forEach(coupon => {
      const status = coupon.isActive && new Date() <= coupon.validUntil ? 'Active' : 'Inactive/Expired';
      console.log(`- ${coupon.code}: ${coupon.description} (${status})`);
    });

    console.log('\n=== Sample Usage Instructions ===');
    console.log('You can now test the coupon system with these codes:');
    console.log('- WELCOME10: 10% off on orders above ₹500');
    console.log('- SAVE20: 20% off on orders above ₹1000');
    console.log('- FLAT100: ₹100 off on orders above ₹800');
    console.log('- MEGA50: 50% off on orders above ₹2000');
    console.log('\nUse the admin panel to manage coupons and the checkout page to apply them!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding coupon data:', error);
    process.exit(1);
  }
};

// Run the seeding script
seedCouponData();