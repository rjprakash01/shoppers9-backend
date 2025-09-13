import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { connectDB } from '../config/database';

const fixOrderAmounts = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find all orders
    const orders = await Order.find({}).populate('items.product');
    console.log(`Found ${orders.length} orders to fix`);

    let fixedCount = 0;

    for (const order of orders) {
      try {
        // Calculate the correct original amount from items
        const originalAmount = order.items.reduce((sum, item: any) => {
          return sum + (item.originalPrice * item.quantity);
        }, 0);

        // Calculate the correct discounted amount from items
        const discountedAmount = order.items.reduce((sum, item: any) => {
          return sum + (item.price * item.quantity);
        }, 0);

        // Calculate fees based on discounted amount
        const platformFee = discountedAmount > 500 ? 0 : 20;
        const deliveryCharge = discountedAmount > 500 ? 0 : 50;

        // Calculate correct finalAmount
        const correctFinalAmount = discountedAmount + platformFee + deliveryCharge;
        const correctTotalAmount = originalAmount;

        // Update the order if amounts are different
        if (order.totalAmount !== correctTotalAmount || order.finalAmount !== correctFinalAmount) {
          await Order.updateOne(
            { _id: order._id },
            {
              totalAmount: correctTotalAmount,
              finalAmount: correctFinalAmount
            }
          );

          console.log(`Fixed order ${order.orderNumber}:`);
          console.log(`  Old totalAmount: ${order.totalAmount} -> New: ${correctTotalAmount}`);
          console.log(`  Old finalAmount: ${order.finalAmount} -> New: ${correctFinalAmount}`);
          fixedCount++;
        }
      } catch (error) {
        console.error(`Error fixing order ${order.orderNumber}:`, error);
      }
    }

    console.log(`\nFixed ${fixedCount} orders successfully`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing order amounts:', error);
    process.exit(1);
  }
};

fixOrderAmounts();