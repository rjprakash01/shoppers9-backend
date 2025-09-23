const mongoose = require('mongoose');
const AdminUser = require('./src/models/User.ts').default;

// Connect to main backend database
const mainBackendConnection = mongoose.createConnection();
const mainUserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  name: String,
  email: String,
  phone: String,
  role: String,
  roles: [String],
  primaryRole: String,
  isAdmin: Boolean,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'users' });
const MainUser = mainBackendConnection.model('User', mainUserSchema);

require('dotenv').config();

async function fixVishnuUser() {
  try {
    // Connect to admin backend
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Admin Backend MongoDB');

    // Connect to main backend
    await mainBackendConnection.openUri(process.env.MONGODB_URI);
    console.log('Connected to Main Backend MongoDB');

    // Find Vishnu in admin backend
    const vishnuAdmin = await AdminUser.findById('68ca615233f20c4845472df6');
    
    if (vishnuAdmin) {
      console.log('\n=== VISHNU IN ADMIN BACKEND ===');
      console.log('ID:', vishnuAdmin._id);
      console.log('First Name:', vishnuAdmin.firstName);
      console.log('Last Name:', vishnuAdmin.lastName);
      console.log('Email:', vishnuAdmin.email);
      console.log('Phone:', vishnuAdmin.phone);
      console.log('Primary Role:', vishnuAdmin.primaryRole);
      console.log('Roles:', vishnuAdmin.roles);
      console.log('Active:', vishnuAdmin.isActive);
      console.log('Created:', vishnuAdmin.createdAt);

      // Update user in main backend with complete data
      const updateResult = await MainUser.findByIdAndUpdate(
        '68ca615233f20c4845472df6',
        {
          firstName: vishnuAdmin.firstName,
          lastName: vishnuAdmin.lastName,
          name: `${vishnuAdmin.firstName} ${vishnuAdmin.lastName}`,
          email: vishnuAdmin.email,
          phone: vishnuAdmin.phone,
          role: 'admin',
          roles: ['admin'],
          primaryRole: vishnuAdmin.primaryRole,
          isAdmin: true,
          isActive: vishnuAdmin.isActive,
          createdAt: vishnuAdmin.createdAt,
          updatedAt: new Date()
        },
        { new: true, upsert: true }
      );

      console.log('\n=== UPDATED USER IN MAIN BACKEND ===');
      console.log('✅ Update successful');
      console.log('ID:', updateResult._id);
      console.log('Name:', updateResult.name);
      console.log('Email:', updateResult.email);
      console.log('Phone:', updateResult.phone);
      console.log('Role:', updateResult.role);
      console.log('Primary Role:', updateResult.primaryRole);
      console.log('Is Admin:', updateResult.isAdmin);
      console.log('Is Active:', updateResult.isActive);

      // Now check if this fixes the order visibility issue
      console.log('\n=== CHECKING ORDER VISIBILITY ===');
      
      // Check orders where Vishnu is the seller
      const OrderSchema = new mongoose.Schema({}, { collection: 'orders', strict: false });
      const Order = mainBackendConnection.model('Order', OrderSchema);
      
      const vishnuOrders = await Order.find({
        'items.sellerId': '68ca615233f20c4845472df6'
      }).limit(5).sort({ createdAt: -1 });
      
      console.log(`Found ${vishnuOrders.length} orders where Vishnu is the seller:`);
      vishnuOrders.forEach((order, index) => {
        console.log(`${index + 1}. Order ${order.orderNumber || order._id}`);
        console.log(`   Customer: ${order.customerId}`);
        console.log(`   Created: ${order.createdAt}`);
        console.log(`   Status: ${order.status}`);
        if (order.items) {
          order.items.forEach((item, itemIndex) => {
            if (item.sellerId === '68ca615233f20c4845472df6') {
              console.log(`   Item ${itemIndex + 1}: Product ${item.productId}, Seller: ${item.sellerId}`);
            }
          });
        }
      });

      // Check products created by Vishnu
      const ProductSchema = new mongoose.Schema({}, { collection: 'products', strict: false });
      const Product = mainBackendConnection.model('Product', ProductSchema);
      
      const vishnuProducts = await Product.find({
        createdBy: '68ca615233f20c4845472df6'
      }).limit(5).sort({ createdAt: -1 });
      
      console.log(`\nFound ${vishnuProducts.length} products created by Vishnu:`);
      vishnuProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name || product.title}`);
        console.log(`   ID: ${product._id}`);
        console.log(`   Created: ${product.createdAt}`);
        console.log(`   Status: ${product.status || 'active'}`);
      });

    } else {
      console.log('❌ Vishnu not found in admin backend');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    await mainBackendConnection.close();
    console.log('\nDisconnected from both databases');
  }
}

fixVishnuUser();