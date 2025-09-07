import { Response } from 'express';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { Wishlist } from '../models/Wishlist';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';

/**
 * Get user's cart
 */
export const getCart = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  let cart: any = await Cart.findOne({ userId: userId })
    .populate({
      path: 'items.product',
      select: 'name images price discountPrice brand category subCategory isActive'
    })
    .lean();

  if (!cart) {
    const newCart = new Cart({ userId: userId, items: [] });
    cart = await newCart.save();
  }

  res.json({
    success: true,
    data: {
      cart
    }
  });
};

/**
 * Add item to cart
 */
export const addToCart = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { product: productId, variantId, size, quantity = 1 } = req.body;

  // Validate product exists and is active
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Find the variant
  const variant = product.variants.find(v => v._id?.toString() === variantId);
  if (!variant) {
    throw new AppError('Product variant not found', 404);
  }

  // Check if size is required and valid
  if (variant.sizes && variant.sizes.length > 0) {
    if (!size) {
      throw new AppError('Size is required for this product', 400);
    }
    const sizeOption = variant.sizes.find(s => s.size === size);
    if (!sizeOption) {
      throw new AppError('Invalid size selected', 400);
    }
    if (sizeOption.stock < quantity) {
      throw new AppError('Insufficient stock for selected size', 400);
    }
  }

  let cart = await Cart.findOne({ userId: userId });
  if (!cart) {
    cart = new Cart({ userId: userId, items: [] });
  }

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(item => 
    item.product?.toString() === productId &&
    item.variantId?.toString() === variantId &&
    item.size === size
  );

  if (existingItemIndex > -1) {
    // Update quantity
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    let price = 0;
    let originalPrice = 0;
    let discount = 0;
    
    if (variant.sizes && variant.sizes.length > 0) {
      const sizeOption = variant.sizes.find(s => s.size === size);
      if (sizeOption) {
        price = sizeOption.price;
        originalPrice = sizeOption.originalPrice;
        discount = sizeOption.discount;
      }
    }
    
    cart.items.push({
      product: productId,
      variantId,
      size,
      quantity,
      price,
      originalPrice,
      discount,
      isSelected: true
    });
  }

  await cart.save();

  // Populate and return updated cart
  await cart.populate({
    path: 'items.product',
    select: 'name images price discountPrice brand category subCategory isActive'
  });

  res.json({
    success: true,
    message: 'Item added to cart successfully',
    data: {
      cart
    }
  });
};

/**
 * Update item quantity in cart
 */
export const updateQuantity = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { itemId } = req.params;
  const { quantity } = req.body;

  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  // Fix any items that have productId but not product (backward compatibility)
  cart.items.forEach((item) => {
    const itemObj = (item as any).toObject ? (item as any).toObject() : item;
    if (itemObj.productId && !item.product) {
      item.product = itemObj.productId;
    }
  });

  const itemIndex = cart.items.findIndex(item => item._id?.toString() === itemId);
  if (itemIndex === -1) {
    throw new AppError('Item not found in cart', 404);
  }

  const item = cart.items[itemIndex];
  const itemObj = (item as any).toObject ? (item as any).toObject() : item;
  
  // Handle both 'product' and 'productId' fields for backward compatibility
  const productRef = item.product || itemObj.productId;
  if (!productRef) {
    throw new AppError('Invalid cart item: missing product reference', 400);
  }
  
  // Convert product to string if it's an ObjectId
  const productId = productRef.toString();
  
  // Fix the item if it has productId but not product
  if (itemObj.productId && !item.product) {
    item.product = itemObj.productId;
  }
  
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const variant = product.variants.find(v => v._id?.toString() === item.variantId?.toString());
  if (!variant) {
    throw new AppError('Product variant not found', 404);
  }

  let availableStock = 0;
  if (item.size && variant.sizes) {
    const sizeOption = variant.sizes.find(s => s.size === item.size);
    if (sizeOption) {
      availableStock = sizeOption.stock;
    }
  }

  if (quantity > availableStock) {
    throw new AppError('Insufficient stock', 400);
  }

  cart.items[itemIndex].quantity = quantity;
  await cart.save();

  await cart.populate({
    path: 'items.product',
    select: 'name images price discountPrice brand category subCategory isActive'
  });

  res.json({
    success: true,
    message: 'Cart updated successfully',
    data: {
      cart
    }
  });
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { itemId } = req.params;

  const cart = await Cart.findOne({ userId: userId });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  const itemIndex = cart.items.findIndex(item => item._id?.toString() === itemId);
  if (itemIndex === -1) {
    throw new AppError('Item not found in cart', 404);
  }

  cart.items.splice(itemIndex, 1);
  await cart.save();

  await cart.populate({
    path: 'items.product',
    select: 'name images price discountPrice brand category subCategory isActive'
  });

  res.json({
    success: true,
    message: 'Item removed from cart successfully',
    data: {
      cart
    }
  });
};

/**
 * Move item from cart to wishlist
 */
export const moveToWishlist = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { itemId } = req.params;

  const cart = await Cart.findOne({ userId: userId });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  const itemIndex = cart.items.findIndex(item => item._id?.toString() === itemId);
  if (itemIndex === -1) {
    throw new AppError('Item not found in cart', 404);
  }

  const item = cart.items[itemIndex];

  // Add to wishlist
  let wishlist = await Wishlist.findOne({ userId: userId });
  if (!wishlist) {
    wishlist = new Wishlist({ userId: userId, items: [] });
  }

  // Check if item already exists in wishlist
  const existsInWishlist = wishlist.items.some(wishItem => 
    wishItem.product.toString() === item.product.toString() &&
    wishItem.variantId?.toString() === item.variantId.toString()
  );

  if (!existsInWishlist) {
    wishlist.items.push({
      product: item.product,
      variantId: item.variantId,
      addedAt: new Date()
    });
    await wishlist.save();
  }

  // Remove from cart
  cart.items.splice(itemIndex, 1);
  await cart.save();

  await cart.populate({
    path: 'items.product',
    select: 'name images price discountPrice brand category subCategory isActive'
  });

  res.json({
    success: true,
    message: 'Item moved to wishlist successfully',
    data: {
      cart
    }
  });
};

/**
 * Clear all items from cart
 */
export const clearCart = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  const cart = await Cart.findOne({ userId: userId });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  cart.items = [];
  cart.appliedCoupon = undefined;
  cart.couponDiscount = 0;
  await cart.save();

  res.json({
    success: true,
    message: 'Cart cleared successfully',
    data: {
      cart
    }
  });
};

/**
 * Apply coupon to cart
 */
export const applyCoupon = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { couponCode } = req.body;

  const cart = await Cart.findOne({ userId: userId });
  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  // TODO: Implement coupon validation logic
  // For now, apply a dummy 10% discount
  const discountPercentage = 10;
  const discount = Math.round((cart.subtotal * discountPercentage) / 100);

  cart.appliedCoupon = couponCode;
  cart.couponDiscount = discount;
  await cart.save();

  await cart.populate({
    path: 'items.product',
    select: 'name images price discountPrice brand category subCategory isActive'
  });

  res.json({
    success: true,
    message: 'Coupon applied successfully',
    data: {
      cart,
      discount
    }
  });
};

/**
 * Remove coupon from cart
 */
export const removeCoupon = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  const cart = await Cart.findOne({ userId: userId });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  cart.appliedCoupon = undefined;
  cart.couponDiscount = 0;
  await cart.save();

  await cart.populate({
    path: 'items.product',
    select: 'name images price discountPrice brand category subCategory isActive'
  });

  res.json({
    success: true,
    message: 'Coupon removed successfully',
    data: {
      cart
    }
  });
};

/**
 * Get cart summary for checkout
 */
export const getCartSummary = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  const cart = await Cart.findOne({ userId: userId })
    .populate({
      path: 'items.product',
      select: 'name images price discountPrice brand category subCategory isActive'
    })
    .lean();

  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  // Calculate summary
  const platformFee = 20; // Fixed platform fee
  const deliveryFee = cart.subtotal >= 500 ? 0 : 50; // Free delivery above ₹500
  
  const summary = {
    itemCount: cart.items.length,
    totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: cart.subtotal,
    couponDiscount: cart.couponDiscount || 0,
    platformFee,
    deliveryFee,
    total: cart.subtotal - (cart.couponDiscount || 0) + platformFee + deliveryFee,
    appliedCoupon: cart.appliedCoupon,
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  };

  res.json({
    success: true,
    data: {
      cart,
      summary
    }
  });
};

export const cartController = {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  moveToWishlist,
  clearCart,
  applyCoupon,
  removeCoupon,
  getCartSummary
};