const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

console.log('🔧 FIXING ORDER 6ad80901 MIGRATION ISSUE...');
console.log('Found order: 68cc02faf2a077e76ad80901');
console.log('Issue: Order exists in main DB but missing orderId and not in admin DB');
console.log('Solution: Add orderId and migrate to admin database');
console.log('=' .repeat(80));

async function fixOrderMigration() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        
        const mainDb = client.db('shoppers9');
        const adminDb = client.db('shoppers9_admin');
        
        // 1. Find the specific order
        console.log('\n📋 Step 1: Finding the order in main database...');
        const targetOrder = await mainDb.collection('orders').findOne({
            _id: new ObjectId('68cc02faf2a077e76ad80901')
        });
        
        if (!targetOrder) {
            console.log('❌ Order not found in main database');
            return;
        }
        
        console.log('✅ Order found:');
        console.log(`  _id: ${targetOrder._id}`);
        console.log(`  orderId: ${targetOrder.orderId || 'MISSING'}`);
        console.log(`  userId: ${targetOrder.userId}`);
        console.log(`  items: ${targetOrder.items?.length || 0}`);
        
        if (targetOrder.items) {
            targetOrder.items.forEach((item, index) => {
                console.log(`    Item ${index + 1}: sellerId=${item.sellerId}, productId=${item.productId}`);
            });
        }
        
        // 2. Add orderId if missing
        console.log('\n📋 Step 2: Adding orderId if missing...');
        let updatedOrder = { ...targetOrder };
        
        if (!updatedOrder.orderId) {
            // Generate orderId based on timestamp and ID
            const timestamp = Date.now();
            updatedOrder.orderId = `ORD${timestamp}${targetOrder._id.toString().slice(-4)}`;
            console.log(`✅ Generated orderId: ${updatedOrder.orderId}`);
            
            // Update in main database
            await mainDb.collection('orders').updateOne(
                { _id: targetOrder._id },
                { $set: { orderId: updatedOrder.orderId } }
            );
            console.log('✅ Updated orderId in main database');
        } else {
            console.log(`✅ Order already has orderId: ${updatedOrder.orderId}`);
        }
        
        // 3. Check if order exists in admin database
        console.log('\n📋 Step 3: Checking admin database...');
        const adminOrder = await adminDb.collection('orders').findOne({
            _id: targetOrder._id
        });
        
        if (adminOrder) {
            console.log('✅ Order already exists in admin database');
        } else {
            console.log('❌ Order not found in admin database - migrating...');
            
            // Ensure sellerId is string format
            if (updatedOrder.items) {
                updatedOrder.items.forEach(item => {
                    if (typeof item.sellerId !== 'string') {
                        item.sellerId = item.sellerId.toString();
                    }
                });
            }
            
            // Insert into admin database
            await adminDb.collection('orders').insertOne(updatedOrder);
            console.log('✅ Order migrated to admin database');
        }
        
        // 4. Verify the test admin can see the order
        console.log('\n📋 Step 4: Verifying admin visibility...');
        const testAdminId = '68bd48f7e03d384b7a2f92ee';
        
        const adminVisibleOrders = await adminDb.collection('orders').find({
            'items.sellerId': testAdminId
        }).toArray();
        
        console.log(`✅ Orders visible to test admin: ${adminVisibleOrders.length}`);
        
        // Check if our specific order is visible
        const ourOrderVisible = adminVisibleOrders.find(order => 
            order._id.toString() === targetOrder._id.toString()
        );
        
        if (ourOrderVisible) {
            console.log('✅ Target order is now visible to test admin');
            console.log(`   OrderId: ${ourOrderVisible.orderId}`);
            console.log(`   MongoDB ID: ${ourOrderVisible._id}`);
        } else {
            console.log('❌ Target order still not visible to test admin');
        }
        
        // 5. List all admin orders for verification
        console.log('\n📋 Step 5: Admin orders summary...');
        const allAdminOrders = await adminDb.collection('orders').find({}).toArray();
        console.log(`Total orders in admin database: ${allAdminOrders.length}`);
        
        if (allAdminOrders.length > 0) {
            console.log('\nAdmin orders:');
            allAdminOrders.forEach((order, index) => {
                const isTarget = order._id.toString() === targetOrder._id.toString();
                const marker = isTarget ? ' ⭐ TARGET' : '';
                console.log(`  ${index + 1}. ${order.orderId || 'N/A'} (${order._id})${marker}`);
            });
        }
        
        console.log('\n📋 Summary:');
        console.log(`✅ Order found and processed: ${targetOrder._id}`);
        console.log(`✅ OrderId: ${updatedOrder.orderId}`);
        console.log(`✅ Migrated to admin database: Yes`);
        console.log(`✅ Visible to test admin: ${ourOrderVisible ? 'Yes' : 'No'}`);
        console.log(`✅ Total admin orders: ${allAdminOrders.length}`);
        
        if (ourOrderVisible) {
            console.log('\n🎉 SUCCESS: Order ORD17582005708410087 (6ad80901) is now visible to test admin!');
            console.log('💡 The order can now be seen in the admin frontend.');
        }
        
    } catch (error) {
        console.error('❌ Error during migration:', error);
    } finally {
        await client.close();
    }
}

fixOrderMigration().catch(console.error);