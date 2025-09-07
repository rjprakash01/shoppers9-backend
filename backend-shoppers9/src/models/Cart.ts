import mongoose, { Schema } from 'mongoose';
import { ICart, ICartItem } from '../types';

const cartItemSchema = new Schema<ICartItem>({
  product: {
    type: String,
    required: true,
    ref: 'Product'
  },
  variantId: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isSelected: {
    type: Boolean,
    default: true
  }
});

const cartSchema = new Schema<ICart>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
    unique: true
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  couponDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  appliedCoupon: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
// userId already has unique index from schema definition
cartSchema.index({ 'items.product': 1 });

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next: any) {
  let totalAmount = 0;
  let totalDiscount = 0;

  this.items.forEach((item: any) => {
    if (item.isSelected) {
      const itemTotal = item.price * item.quantity;
      const itemOriginalTotal = item.originalPrice * item.quantity;
      totalAmount += itemTotal;
      totalDiscount += (itemOriginalTotal - itemTotal);
    }
  });

  this.totalAmount = totalAmount;
  this.totalDiscount = totalDiscount;
  this.subtotal = totalAmount; // Set subtotal to match totalAmount
  next();
});

// Method to add item to cart
cartSchema.methods.addItem = function(item: ICartItem) {
  const existingItemIndex = this.items.findIndex(
    (cartItem: any) => 
      cartItem.product === item.product && 
      cartItem.variantId === item.variantId && 
      cartItem.size === item.size
  );

  if (existingItemIndex > -1) {
    this.items[existingItemIndex].quantity += item.quantity;
    if (this.items[existingItemIndex].quantity > 10) {
      this.items[existingItemIndex].quantity = 10;
    }
  } else {
    this.items.push(item);
  }

  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(productId: string, variantId: string, size: string) {
  this.items = this.items.filter(
    (item: any) => 
      !(item.product === productId && 
        item.variantId === variantId && 
        item.size === size)
  );
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateQuantity = function(productId: string, variantId: string, size: string, quantity: number) {
  const item = this.items.find(
    (cartItem: any) => 
      cartItem.product === productId && 
      cartItem.variantId === variantId && 
      cartItem.size === size
  );

  if (item) {
    item.quantity = Math.max(1, Math.min(10, quantity));
  }

  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

export const Cart = mongoose.model<ICart>('Cart', cartSchema);