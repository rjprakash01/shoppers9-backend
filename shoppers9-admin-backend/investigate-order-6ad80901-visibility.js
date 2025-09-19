const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

console.log('🔍 INVESTIGATING ORDER ORD17582005708410087 VISIBILITY ISSUE...');
console.log('Order ID: 6ad80901');
console.log('Issue: Order exists in super admin but not visible to test admin');
console.log('Expected: Product belongs to test admin, so order should be visible');
console.log('=' .repeat(80));

async function investigateOrderVisibility() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        
        // Check both databases
        const adminDb = client.db('shoppers9_admin');
        const mainDb = client.db('shoppers9');
        
        console.log('\n📋 Step 1: Database overview...');
        const mainOrdersCount = await mainDb.collection('orders').countDocuments();
        const adminOrdersCount = await adminDb.collection('orders').countDocuments();
        console.log(`Main DB orders: ${mainOrdersCount}`);
        console.log(`Admin DB orders: ${adminOrdersCount}`);
        
        // 2. Search for the specific order in main database
        console.log('\n📋 Step 2: Searching for order ORD17582005708410087...');
        
        // Method 1: Search by order ID
        const orderByOrderId = await mainDb.collection('orders').findOne({
            orderId: 'ORD17582005708410087'
        });
        console.log('Search by orderId in main DB:', orderByOrderId ? '✅ Found' : '❌ Not found');
        
        // Method 2: Search by any field containing 6ad80901
        const allOrders = await mainDb.collection('orders').find({}).toArray();
        console.log(`\nSearching through ${allOrders.length} orders for '6ad80901'...`);
        
        const ordersContaining6ad80901 = allOrders.filter(order => {
            const orderStr = JSON.stringify(order).toLowerCase();
            return orderStr.includes('6ad80901');
        });
        console.log(`Orders containing '6ad80901': ${ordersContaining6ad80901.length}`);
        
        if (ordersContaining6ad80901.length > 0) {
            console.log('\n📋 Found orders containing 6ad80901:');
            ordersContaining6ad80901.forEach((order, index) => {
                console.log(`\n  Order ${index + 1}:`);
                console.log(`    _id: ${order._id}`);
                console.log(`    orderId: ${order.orderId || 'N/A'}`);
                console.log(`    userId: ${order.userId || 'N/A'}`);
                console.log(`    items count: ${order.items?.length || 0}`);
                
                if (order.items) {
                    order.items.forEach((item, itemIndex) => {
                        console.log(`      Item ${itemIndex + 1}: _id=${item._id}, sellerId=${item.sellerId}, productId=${item.productId}`);
                    });
                }
            });
        }
        
        // 3. Search for orders with similar patterns
        console.log('\n📋 Step 3: Searching for similar order patterns...');
        
        // Search for orders starting with ORD175820
        const similarOrders = await mainDb.collection('orders').find({
            orderId: { $regex: '^ORD175820', $options: 'i' }
        }).toArray();
        console.log(`Orders with similar pattern (ORD175820*): ${similarOrders.length}`);
        
        if (similarOrders.length > 0) {
            console.log('\nSimilar orders found:');
            similarOrders.slice(0, 5).forEach((order, index) => {
                console.log(`  ${index + 1}. ${order.orderId} (${order._id})`);
            });
        }
        
        // 4. Check recent orders
        console.log('\n📋 Step 4: Checking recent orders...');
        const recentOrders = await mainDb.collection('orders')
            .find({})
            .sort({ _id: -1 })
            .limit(10)
            .toArray();
            
        console.log('\nRecent 10 orders:');
        recentOrders.forEach((order, index) => {
            console.log(`  ${index + 1}. ${order.orderId || 'N/A'} (${order._id}) - ${order.items?.length || 0} items`);
        });
        
        // 5. Check admin database
        console.log('\n📋 Step 5: Checking admin database...');
        
        if (adminOrdersCount > 0) {
            const adminOrders = await adminDb.collection('orders').find({}).limit(5).toArray();
            console.log('\nAdmin orders:');
            adminOrders.forEach((order, index) => {
                console.log(`  ${index + 1}. ${order.orderId || 'N/A'} (${order._id})`);
            });
            
            // Search for the order in admin DB
            const adminOrderContaining = adminOrders.filter(order => {
                const orderStr = JSON.stringify(order).toLowerCase();
                return orderStr.includes('6ad80901');
            });
            console.log(`Admin orders containing '6ad80901': ${adminOrderContaining.length}`);
        }
        
        // 6. Check if there are any users/admins that might be related
        console.log('\n📋 Step 6: Checking users and admins...');
        
        const mainUsers = await mainDb.collection('users').find({}).toArray();
        console.log(`Main DB users: ${mainUsers.length}`);
        
        const adminUsers = await mainDb.collection('admins').find({}).toArray();
        console.log(`Main DB admins: ${adminUsers.length}`);
        
        if (adminUsers.length > 0) {
            console.log('\nAdmin users:');
            adminUsers.forEach((admin, index) => {
                console.log(`  ${index + 1}. ${admin.email || admin.username || 'N/A'} (${admin._id}) - Role: ${admin.role || 'N/A'}`);
            });
        }
        
        // 7. Search for any products that might be related
        console.log('\n📋 Step 7: Checking for related products...');
        const productsContaining6ad80901 = await mainDb.collection('products').find({
            $or: [
                { _id: { $regex: '6ad80901', $options: 'i' } },
                { name: { $regex: '6ad80901', $options: 'i' } },
                { description: { $regex: '6ad80901', $options: 'i' } }
            ]
        }).toArray();
        console.log(`Products containing '6ad80901': ${productsContaining6ad80901.length}`);
        
        console.log('\n📋 Summary:');
        console.log(`- Order ORD17582005708410087 found in main DB: No`);
        console.log(`- Orders containing '6ad80901' in main DB: ${ordersContaining6ad80901.length}`);
        console.log(`- Similar orders (ORD175820*): ${similarOrders.length}`);
        console.log(`- Admin DB orders: ${adminOrdersCount}`);
        console.log(`- Products containing '6ad80901': ${productsContaining6ad80901.length}`);
        
        if (ordersContaining6ad80901.length === 0 && similarOrders.length === 0) {
            console.log('\n❌ CONCLUSION: Order ORD17582005708410087 (6ad80901) does not exist in either database');
            console.log('💡 POSSIBLE REASONS:');
            console.log('   1. Order was never created');
            console.log('   2. Order was deleted');
            console.log('   3. Order exists in a different database/environment');
            console.log('   4. Order ID format is different than expected');
        }
        
    } catch (error) {
        console.error('❌ Error during investigation:', error);
    } finally {
        await client.close();
    }
}

investigateOrderVisibility().catch(console.error);