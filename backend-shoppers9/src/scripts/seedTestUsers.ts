import mongoose from 'mongoose';
import { User } from '../models/User';
import { Cart } from '../models/Cart';
import { Wishlist } from '../models/Wishlist';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testUsers = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'Password123!',
    authMethod: 'email' as const,
    isVerified: true,
    isEmailVerified: true
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    password: 'SecurePass456@',
    authMethod: 'email' as const,
    isVerified: true,
    isEmailVerified: true
  },
  {
    name: 'Test User Phone',
    phone: '1234567890',
    authMethod: 'phone' as const,
    isVerified: true
  },
  {
    name: 'Dual Auth User',
    email: 'dual.user@example.com',
    phone: '9876543210',
    password: 'DualAuth789#',
    authMethod: 'both' as const,
    isVerified: true,
    isEmailVerified: true
  }
];

async function seedTestUsers() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shoppers9';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing test users (optional)
    console.log('Clearing existing test users...');
    await User.deleteMany({
      email: { $in: testUsers.map(u => u.email).filter(Boolean) }
    });
    await User.deleteMany({
      phone: { $in: testUsers.map(u => u.phone).filter(Boolean) }
    });

    console.log('Creating test users...');
    
    for (const userData of testUsers) {
      try {
        // Create user
        const user = new User(userData);
        await user.save();
        
        // Create cart and wishlist for the user
        await Promise.all([
          Cart.create({
            userId: user._id,
            items: [],
            totalAmount: 0,
            totalDiscount: 0,
            subtotal: 0
          }),
          Wishlist.create({
            userId: user._id,
            items: []
          })
        ]);
        
        console.log(`✅ Created user: ${user.name} (${user.email || user.phone})`);
      } catch (error: any) {
        console.error(`❌ Failed to create user ${userData.name}:`, error.message);
      }
    }

    console.log('\n🎯 Test Users Created Successfully!');
    console.log('\n📧 Email/Password Test Accounts:');
    console.log('1. Email: john.doe@example.com');
    console.log('   Password: Password123!');
    console.log('   Name: John Doe');
    console.log('');
    console.log('2. Email: jane.smith@example.com');
    console.log('   Password: SecurePass456@');
    console.log('   Name: Jane Smith');
    console.log('');
    console.log('📱 Phone/OTP Test Account:');
    console.log('   Phone: 1234567890');
    console.log('   OTP: 1234 (for testing)');
    console.log('');
    console.log('🔄 Dual Authentication Test Account:');
    console.log('   Email: dual.user@example.com');
    console.log('   Phone: 9876543210');
    console.log('   Password: DualAuth789#');
    console.log('   OTP: 1234 (for testing)');
    console.log('');
    console.log('🚀 You can now test both authentication methods!');
    
  } catch (error) {
    console.error('Error seeding test users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
if (require.main === module) {
  seedTestUsers();
}

export { seedTestUsers };