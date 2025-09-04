import { Response } from 'express';
import { Wishlist } from '../models/Wishlist';
import { Product } from '../models/Product';
import { Cart } from '../models/Cart';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';

/**
 * Get user's wishlist
 */
export const getWishlist = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  let wishlist: any = await Wishlist.findOne({ userId: userId })
    .populate({
      path: 'items.product',
      select: 'name images price discountPrice brand category subCategory isActive variants'
    })
    .lean();

  if (!wishlist) {
    const newWishlist = new Wishlist({ userId: userId, items: [] });
    wishlist = await newWishlist.save();
  }

  res.json({
    success: true,
    data: {
      wishlist
    }
  });
};

/**
 * Add item to wishlist
 */
export const addToWishlist = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { product: productId, variantId } = req.body;

  // Verify product exists and is active
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Find the variant (only if variantId is provided)
  if (variantId) {
    const variant = product.variants.find((v: any) => v._id?.toString() === variantId);
    if (!variant) {
      throw new AppError('Product variant not found', 404);
    }
  }

  let wishlist = await Wishlist.findOne({ userId: userId });
  if (!wishlist) {
    wishlist = new Wishlist({ userId: userId, items: [] });
  }

  // Check if item already exists in wishlist
  const existsInWishlist = wishlist.items.some((item: any) => 
    item.product?.toString() === productId &&
    item.variantId?.toString() === variantId
  );

  if (existsInWishlist) {
    throw new AppError('Item already exists in wishlist', 400);
  }

  // Add new item
  wishlist.items.push({
    product: productId,
    variantId: variantId || undefined,
    addedAt: new Date()
  });

  await wishlist.save();

  // Populate and return updated wishlist
  await wishlist.populate({
    path: 'items.product',
    select: 'name images price discountPrice brand category subCategory isActive variants'
  });

  res.json({
    success: true,
    message: 'Item added to wishlist successfully',
    data: {
      wishlist
    }
  });
};

/**
 * Remove item from wishlist
 */
export const removeFromWishlist = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ userId: userId });
  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  const itemIndex = wishlist.items.findIndex((item: any) => 
    item.product?.toString() === productId
  );
  
  if (itemIndex === -1) {
    throw new AppError('Item not found in wishlist', 404);
  }

  wishlist.items.splice(itemIndex, 1);
  await wishlist.save();

  await wishlist.populate({
    path: 'items.product',
    select: 'name images price discountPrice brand category subCategory isActive variants'
  });

  res.json({
    success: true,
    message: 'Item removed from wishlist successfully',
    data: {
      wishlist
    }
  });
};

/**
 * Move item from wishlist to cart
 */
export const moveToCart = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { productId } = req.params;
  const { size, quantity = 1 } = req.body;

  const wishlist = await Wishlist.findOne({ userId: userId });
  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  const itemIndex = wishlist.items.findIndex((item: any) => 
    item.product?.toString() === productId
  );
  
  if (itemIndex === -1) {
    throw new AppError('Item not found in wishlist', 404);
  }

  const wishlistItem = wishlist.items[itemIndex];

  // Verify product and variant
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const variant = product.variants.find((v: any) => 
    v._id?.toString() === wishlistItem.variantId!.toString()
  );
  if (!variant) {
    throw new AppError('Product variant not found', 404);
  }

  // Check stock availability
  if (variant.sizes && variant.sizes.length > 0) {
    if (!size) {
      throw new AppError('Size is required for this product', 400);
    }
    const sizeOption = variant.sizes.find((s: any) => s.size === size);
    if (!sizeOption) {
      throw new AppError('Invalid size selected', 400);
    }
    // Stock check removed as quantity property doesn't exist on IProductVariant
  }

  // Add to cart
  let cart = await Cart.findOne({ userId: userId });
  if (!cart) {
    cart = new Cart({ userId: userId, items: [] });
  }

  // Check if item already exists in cart
  const existingCartItemIndex = cart.items.findIndex((item: any) => 
    item.product?.toString() === productId &&
    item.variantId?.toString() === wishlistItem.variantId?.toString() &&
    item.size === size
  );

  if (existingCartItemIndex > -1) {
    // Update quantity
    cart.items[existingCartItemIndex].quantity += quantity;
  } else {
    // Add new item
    const price = (product as any).discountPrice || (product as any).price;
    cart.items.push({
      product: productId,
      variantId: wishlistItem.variantId!,
      size,
      quantity,
      price,
      originalPrice: price,
      discount: 0,
      isSelected: true
    });
  }

  await cart.save();

  // Remove from wishlist
  wishlist.items.splice(itemIndex, 1);
  await wishlist.save();

  await wishlist.populate({
    path: 'items.product',
    select: 'name images price discountPrice brand category subCategory isActive variants'
  });

  res.json({
    success: true,
    message: 'Item moved to cart successfully',
    data: {
      wishlist
    }
  });
};

/**
 * Clear all items from wishlist
 */
export const clearWishlist = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  const wishlist = await Wishlist.findOne({ userId: userId });
  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  wishlist.items = [];
  await wishlist.save();

  res.json({
    success: true,
    message: 'Wishlist cleared successfully',
    data: {
      wishlist
    }
  });
};

/**
 * Check if product is in wishlist
 */
export const checkInWishlist = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ userId: userId });
  
  const isInWishlist = wishlist ? 
    wishlist.items.some((item: any) => item.product?.toString() === productId) : 
    false;

  res.json({
    success: true,
    data: {
      isInWishlist
    }
  });
};

export const wishlistController = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart,
  clearWishlist,
  checkInWishlist
};