import mongoose, { Schema } from 'mongoose';
import { IWishlist, IWishlistItem } from '../types';

const wishlistItemSchema = new Schema<IWishlistItem>({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product'
  },
  variantId: {
    type: String
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const wishlistSchema = new Schema<IWishlist>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    unique: true
  },
  items: [wishlistItemSchema]
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
wishlistSchema.index({ 'items.product': 1 });
wishlistSchema.index({ 'items.addedAt': -1 });

// Method to add item to wishlist
wishlistSchema.methods.addItem = function(productId: string, variantId?: string) {
  const existingItemIndex = this.items.findIndex(
    (item: any) => item.product === productId && item.variantId === variantId
  );

  if (existingItemIndex === -1) {
    this.items.push({
      product: productId,
      variantId,
      addedAt: new Date()
    });
  }

  return this.save();
};

// Method to remove item from wishlist
wishlistSchema.methods.removeItem = function(productId: string, variantId?: string) {
  this.items = this.items.filter(
    (item: any) => !(item.product === productId && item.variantId === variantId)
  );
  return this.save();
};

// Method to check if item exists in wishlist
wishlistSchema.methods.hasItem = function(productId: string, variantId?: string) {
  return this.items.some(
    (item: any) => item.product === productId && item.variantId === variantId
  );
};

// Method to clear wishlist
wishlistSchema.methods.clearWishlist = function() {
  this.items = [];
  return this.save();
};

export const Wishlist = mongoose.model<IWishlist>('Wishlist', wishlistSchema);