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
      select: 'name images price discountPrice brand category subCategory isActive variants availableColors'
    })
    .lean();

  if (!cart) {
    const newCart = new Cart({ userId: userId, items: [] });
    cart = await newCart.save();
  }

  // Transform cart items to show correct variant images
  if (cart && cart.items) {
    cart.items = cart.items.map((item: any) => {
      const product = item.product;
      if (product && product.variants) {
        const variant = product.variants.find((v: any) => v._id?.toString() === item.variantId?.toString());
        if (variant && variant.images && variant.images.length > 0) {
          return {
            ...item,
            variant: {
              ...variant,
              images: variant.images
            },
            product: {
              ...product,
              images: variant.images // Use variant images for cart display
            }
          };
        }
      }
      return item;
    });
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

  // Verify the size matches the variant and check stock
  const variantObj = variant as any;
  if (variantObj.size !== size) {
    throw new AppError('Size does not match the selected variant', 400);
  }
  
  if (variantObj.stock < quantity) {
    throw new AppError('Insufficient stock for selected variant', 400);
  }

  let cart = await Cart.findOne({ userId: userId });
  if (!cart) {
    cart = new Cart({ userId: userId, items: [] });
  }
  
  // Clean up existing items with invalid pricing (price > originalPrice)
  const originalItemCount = cart.items.length;
  cart.items = cart.items.filter(item => {
    const isValid = item.price <= item.originalPrice;
    if (!isValid) {
      console.log('Removing invalid cart item:', {
        product: item.product,
        variantId: item.variantId,
        size: item.size,
        price: item.price,
        originalPrice: item.originalPrice,
        reason: 'price > originalPrice'
      });
    }
    return isValid;
  });
  
  const removedCount = originalItemCount - cart.items.length;
  if (removedCount > 0) {
    console.log(`Cleaned cart: removed ${removedCount} invalid items`);
    await cart.save();
  }
  
  console.log('Cart Controller - Current cart state:', {
    userId,
    existingItemsCount: cart.items.length,
    removedInvalidItems: removedCount,
    existingItems: cart.items.map(item => ({
      product: item.product,
      variantId: item.variantId,
      size: item.size,
      price: item.price,
      originalPrice: item.originalPrice,
      quantity: item.quantity
    }))
  });

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(item => 
    item.product?.toString() === productId &&
    item.variantId?.toString() === variantId &&
    item.size === size
  );

  if (existingItemIndex > -1) {
    // Update quantity
    console.log('Cart Controller - Updating existing item:', {
      existingItem: cart.items[existingItemIndex],
      newQuantity: cart.items[existingItemIndex].quantity + quantity
    });
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item - get pricing directly from variant
    const variantObj = variant as any;
    const price = variantObj.price || 0;
    const originalPrice = variantObj.originalPrice || variantObj.price || 0;
    
    // Validate pricing relationship
    if (price > originalPrice) {
      throw new AppError(`Invalid pricing: selling price (${price}) cannot be greater than original price (${originalPrice})`, 400);
    }
    
    const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
    
    console.log('Cart Controller - Adding item with pricing:', {
      productId,
      variantId,
      size,
      price,
      originalPrice,
      discount,
      calculation: `(${originalPrice} - ${price}) = ${originalPrice - price}`
    });
    
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
    select: 'name images price discountPrice brand category subCategory isActive variants availableColors'
  });

  // Transform cart items to show correct variant images
  const cartObj = (cart as any).toObject ? (cart as any).toObject() : cart;
  const transformedCart = {
    ...cartObj,
    items: cart.items.map(item => {
      const itemObj = (item as any).toObject ? (item as any).toObject() : item;
      const product = itemObj.product as any;
      if (product && product.variants) {
        const variant = product.variants.find((v: any) => v._id?.toString() === itemObj.variantId?.toString());
        if (variant && variant.images && variant.images.length > 0) {
          return {
            ...itemObj,
            variant: {
              ...variant,
              images: variant.images
            },
            product: {
              ...product,
              images: variant.images // Use variant images for cart display
            }
          };
        }
      }
      return itemObj;
    })
  };

  res.json({
    success: true,
    message: 'Item added to cart successfully',
    data: {
      cart: transformedCart
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

  // Get stock directly from variant
  const variantObj = variant as any;
  const availableStock = variantObj.stock || 0;

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
  try {
    const userId = req.user!.userId;
    const { itemId } = req.params;

    console.log('moveToWishlist request:', {
      userId,
      itemId,
      userObject: req.user
    });

    const cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    const itemIndex = cart.items.findIndex(item => item._id?.toString() === itemId);
    if (itemIndex === -1) {
      throw new AppError('Item not found in cart', 404);
    }

    const item = cart.items[itemIndex];

    // Validate item has required fields
    if (!item.product) {
      throw new AppError('Invalid cart item: missing product reference', 400);
    }

    if (!item.variantId) {
      throw new AppError('Invalid cart item: missing variant reference', 400);
    }

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
  } catch (error) {
    throw error;
  }
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
  
  // Calculate total with protection against negative amounts
  let total = cart.subtotal - (cart.couponDiscount || 0) + platformFee + deliveryFee;
  if (total < 0) {
    total = platformFee + deliveryFee; // Minimum amount should be fees only
  }
  
  const summary = {
    itemCount: cart.items.length,
    totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: cart.subtotal,
    couponDiscount: cart.couponDiscount || 0,
    platformFee,
    deliveryFee,
    total,
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

// /**
//  * Clean cart by removing items with invalid pricing
//  */
// export const cleanCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
//   const userId = req.user!.userId;

//   try {
//     const cart = await Cart.findOne({ userId });
//     if (!cart) {
//       return res.json({
//         success: true,
//         message: 'No cart found to clean',
//         data: { cart: null }
//       });
//     }

//     // Remove items where price > originalPrice (invalid pricing)
//     const originalItemCount = cart.items.length;
//     cart.items = cart.items.filter(item => {
//       const isValid = item.price <= item.originalPrice;
//       if (!isValid) {
//         console.log('Removing invalid cart item:', {
//           product: item.product,
//           variantId: item.variantId,
//           size: item.size,
//           price: item.price,
//           originalPrice: item.originalPrice,
//           reason: 'price > originalPrice'
//         });
//       }
//       return isValid;
//     });

//     const removedCount = originalItemCount - cart.items.length;
//     await cart.save();

//     // Populate and return cleaned cart
//     await cart.populate({
//       path: 'items.product',
//       select: 'name images price discountPrice brand category subCategory isActive variants availableColors'
//     });

//     res.json({
//       success: true,
//       message: `Cart cleaned successfully. Removed ${removedCount} invalid items.`,
//       data: {
//         cart,
//         removedCount,
//         remainingItems: cart.items.length
//       }
//     });
//   } catch (error) {
//      console.error('Error cleaning cart:', error);
//      res.status(500).json({
//        success: false,
//        message: 'Failed to clean cart',
//        error: error instanceof Error ? error.message : 'Unknown error'
//      });
//    }
//  };

export const cartController = {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  moveToWishlist,
  clearCart,
  // cleanCart,
  applyCoupon,
  removeCoupon,
  getCartSummary
};