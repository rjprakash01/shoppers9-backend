import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Heart, Star, Gift, Percent, Truck, Shield, CreditCard } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { formatPrice } from '../utils/currency';
import { getImageUrl } from '../utils/imageUtils';
import type { CartItem } from '../services/cart';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { cart, localCart, cartCount, cartTotal, updateCartItem, removeFromCart, refreshCart, addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { wishlist, localWishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Refresh cart data when component mounts
  React.useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    }
  }, [isAuthenticated]); // Remove refreshCart from dependencies to prevent infinite loop

  // Get current cart items based on authentication status
  const cartItems = isAuthenticated ? (cart?.items || []) : localCart;
  
  // Debug: Log cart items and their IDs
  React.useEffect(() => {
    
    cartItems.forEach((item, index) => {
      
    });
  }, [cartItems]);

  const handleQuantityChange = async (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const itemKey = item._id || `${item.product || item.productId}-${item.variantId}-${item.size}`;
    setIsUpdating(itemKey);
    try {
      if (isAuthenticated) {
        // For authenticated users, use the item._id
        await updateCartItem(item._id!, item.variantId, item.size, newQuantity);
      } else {
        // For local cart, use productId
        const productId = item.product || item.productId;
        await updateCartItem(productId!, item.variantId, item.size, newQuantity);
      }
    } catch (error) {
      
    } finally {
      setIsUpdating(null);
    }
  };

  const handleForceRefresh = async () => {
    
    localStorage.removeItem('cart');
    await refreshCart();
  };

  const handleTestLogin = async () => {
    try {
      
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: '1234567890',
          otp: '1234',
          name: 'Test User'
        })
      });
      
      const data = await response.json();

      if (data.success && data.data.accessToken) {
        localStorage.setItem('authToken', data.data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        window.location.reload();
      }
    } catch (error) {
      
    }
  };

  const handleRemoveItem = async (item: CartItem) => {
    const itemKey = item._id || `${item.product || item.productId}-${item.variantId}-${item.size}`;
    setIsUpdating(itemKey);
    try {
      if (isAuthenticated) {
        // For authenticated users, use the item._id
        await removeFromCart(item._id!, item.variantId, item.size);
      } else {
        // For local cart, use productId
        const productId = item.product || item.productId;
        await removeFromCart(productId!, item.variantId, item.size);
      }
    } catch (error) {
      
    } finally {
      setIsUpdating(null);
    }
  };

  const handleMoveToWishlist = async (item: CartItem) => {
    const itemKey = item._id || `${item.product || item.productId}-${item.variantId}-${item.size}`;
    setIsUpdating(itemKey);
    try {
      // First add to wishlist
      const product = item.productData || {
        _id: item.product || item.productId,
        name: 'Product',
        price: item.price,
        images: item.variant?.images || []
      };
      
      await addToWishlist(product, item.variantId);
      
      // Then remove from cart
      if (isAuthenticated) {
        await removeFromCart(item._id!, item.variantId, item.size);
      } else {
        const productId = item.product || item.productId;
        await removeFromCart(productId!, item.variantId, item.size);
      }
      
      // Item saved for later successfully
    } catch (error) {
      
      alert('Failed to save item for later. Please try again.');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleMoveToCart = async (wishlistItem: any, product: any) => {
    try {
      // Add to cart with default variant and size
      const defaultVariantId = product?.variants?.[0]?._id || 'default';
      const defaultSize = product?.variants?.[0]?.sizes?.[0]?.size || 'M';
      
      await addToCart(product, defaultVariantId, defaultSize, 1);
      
      // Remove from wishlist
      await removeFromWishlist(product._id || product.id);
      
      // Item moved to cart successfully
    } catch (error) {
      
      alert('Failed to move item to cart. Please try again.');
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      // Item removed from saved items successfully
    } catch (error) {
      
      alert('Failed to remove item. Please try again.');
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-lg w-full">
          <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <ShoppingBag className="h-16 w-16 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Discover amazing products and start building your perfect collection!
          </p>
          
          <div className="space-y-4">
            <Link
              to="/products"
              className="inline-flex items-center bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <ShoppingBag className="mr-3 h-6 w-6" />
              Start Shopping
            </Link>

            <div className="text-sm text-gray-500 mt-6">
              <Link to="/" className="text-purple-600 hover:text-purple-700 font-medium">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-white to-brand-slate/5">
      {/* Header */}
      <div className="bg-brand-indigo shadow-sm border-b border-brand-gold/20">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 text-brand-gold hover:text-white transition-colors rounded-lg hover:bg-brand-gold/10"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold font-playfair text-brand-gold">
                Shopping Cart
              </h1>
              <span className="ml-3 px-3 py-1 bg-brand-gold/20 text-brand-gold rounded-full text-sm font-semibold font-poppins">
                {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!isAuthenticated && (
                <button 
                  onClick={handleTestLogin}
                  className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Test Login
                </button>
              )}
              <button 
                onClick={handleForceRefresh}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Force Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-brand-gold/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-brand-gold rounded-full flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-brand-indigo" />
                </div>
                <span className="ml-2 font-semibold font-poppins text-brand-indigo">Cart</span>
              </div>
              <div className="w-16 h-1 bg-brand-slate/30 rounded"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-brand-slate/30 rounded-full flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-brand-indigo/50" />
                </div>
                <span className="ml-2 text-brand-indigo/50 font-poppins">Checkout</span>
              </div>
            </div>
            <div className="text-sm text-brand-indigo/70 font-poppins">
              Step 1 of 2
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item: CartItem) => {
              const itemKey = item._id || `${item.product || item.productId}-${item.variantId}-${item.size}`;
              const productId = item.productData?._id || item.product || item.productId;
              const productName = item.productData?.name || 'Product';
              const isUpdatingThis = isUpdating === itemKey;
              
              return (
                <div key={itemKey} className="bg-white rounded-2xl shadow-lg border border-brand-gold/20 p-6 hover:shadow-xl hover:border-brand-gold transition-all duration-300">
                 <div className="flex flex-col lg:flex-row items-start space-y-6 lg:space-y-0 lg:space-x-6">
                   {/* Product Image */}
                   <div className="flex-shrink-0">
                     <Link to={`/products/${productId}`}>
                       <img
                         src={getImageUrl(item.variant?.images?.[0] || item.productData?.images?.[0])}
                         alt={productName}
                         className="w-32 h-32 object-cover rounded-2xl border-2 border-brand-gold/20 cursor-pointer hover:border-brand-gold transition-all duration-300 shadow-md hover:shadow-lg"
                       />
                     </Link>
                   </div>

                   {/* Product Details */}
                   <div className="flex-1 min-w-0">
                     <Link
                       to={`/products/${productId}`}
                       className="text-xl font-bold font-poppins text-brand-indigo hover:text-brand-gold transition-colors line-clamp-2 block mb-3"
                     >
                       {productName}
                     </Link>
                    
                    {/* Variant Info */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-4">
                        {item.size && (
                          <div className="bg-brand-gold/10 px-3 py-2 rounded-lg border border-brand-gold/30">
                            <span className="text-sm text-brand-indigo font-medium font-poppins">Size: {item.size}</span>
                          </div>
                        )}
                        {item.variant?.color && (
                          <div className="bg-brand-gold/10 px-3 py-2 rounded-lg border border-brand-gold/30 flex items-center space-x-2">
                            {item.variant.colorCode && (
                              <div
                                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                style={{ backgroundColor: item.variant.colorCode }}
                              />
                            )}
                            <span className="text-sm text-brand-indigo font-medium font-poppins">{item.variant.color}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mt-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl font-bold font-poppins text-brand-indigo">
                          {formatPrice(item.price)}
                        </span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <>
                            <span className="text-lg text-brand-indigo/50 line-through font-poppins">
                              {formatPrice(item.originalPrice)}
                            </span>
                            <span className="bg-brand-gold/20 text-brand-indigo px-3 py-1 rounded-full text-sm font-bold font-poppins shadow-sm">
                              {item.discount}% OFF
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Controls and Actions */}
                   <div className="mt-6">
                     <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                       {/* Quantity Controls */}
                       <div className="flex items-center space-x-4">
                         <span className="text-sm font-semibold font-poppins text-brand-indigo">Quantity:</span>
                         <div className="flex items-center bg-brand-gold/10 border-2 border-brand-gold/30 rounded-xl overflow-hidden shadow-sm">
                           <button
                             onClick={() => handleQuantityChange(item, item.quantity - 1)}
                             disabled={item.quantity <= 1 || isUpdatingThis}
                             className="p-3 hover:bg-brand-gold/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-brand-indigo"
                           >
                             <Minus className="h-4 w-4" />
                           </button>
                           <span className="px-6 py-3 text-center min-w-[4rem] font-bold text-lg font-poppins bg-white text-brand-indigo">
                             {isUpdatingThis ? '...' : item.quantity}
                           </span>
                           <button
                             onClick={() => handleQuantityChange(item, item.quantity + 1)}
                             disabled={isUpdatingThis}
                             className="p-3 hover:bg-brand-gold/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-brand-indigo"
                           >
                             <Plus className="h-4 w-4" />
                           </button>
                         </div>
                       </div>

                       {/* Item Total */}
                       <div className="text-right">
                         <p className="text-sm text-brand-indigo/70 font-poppins mb-1">Item Total</p>
                         <p className="text-2xl font-bold font-poppins text-brand-indigo">
                           {formatPrice(item.price * item.quantity)}
                         </p>
                       </div>
                     </div>

                     {/* Action Buttons */}
                     <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-brand-gold/20">
                       <button
                         onClick={() => handleMoveToWishlist(item)}
                         disabled={isUpdatingThis}
                         className="flex items-center justify-center space-x-2 bg-brand-gold/10 text-brand-indigo hover:bg-brand-gold/20 px-6 py-3 rounded-xl transition-all duration-200 font-semibold font-poppins border border-brand-gold/30 hover:border-brand-gold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         <Heart className="w-5 h-5" />
                         <span>Save for Later</span>
                       </button>
                       <button
                         onClick={() => handleRemoveItem(item)}
                         disabled={isUpdatingThis}
                         className="flex items-center justify-center space-x-2 bg-brand-indigo/10 text-brand-indigo hover:bg-brand-indigo/20 px-6 py-3 rounded-xl transition-all duration-200 font-semibold font-poppins border border-brand-indigo/30 hover:border-brand-indigo shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         {isUpdatingThis ? (
                           <div className="w-5 h-5 border-2 border-brand-indigo border-t-transparent rounded-full animate-spin" />
                         ) : (
                           <Trash2 className="w-5 h-5" />
                         )}
                         <span>Remove</span>
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
              );
             })}
          </div>
          
          {/* Checkout Box - Right Side */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-8 sticky top-8 border border-brand-gold/20">
              <h2 className="text-2xl font-bold font-playfair text-brand-indigo mb-6 flex items-center">
                <Gift className="h-6 w-6 mr-3 text-brand-gold" />
                Order Summary
              </h2>
              
              {/* Summary Details */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-brand-indigo/70 font-medium font-poppins">Subtotal ({cartCount} items)</span>
                  <span className="font-bold text-lg font-poppins text-brand-indigo">{formatPrice(cartTotal)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-brand-indigo/70 font-medium font-poppins flex items-center">
                    <Truck className="h-4 w-4 mr-2 text-brand-gold" />
                    Shipping
                  </span>
                  <span className="font-bold font-poppins text-brand-gold">FREE</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-brand-indigo/70 font-medium font-poppins">Platform Fee</span>
                  <span className="font-bold font-poppins text-brand-indigo">₹2</span>
                </div>
                
                <div className="border-t-2 border-brand-gold/20 pt-4 flex justify-between items-center">
                  <span className="text-xl font-bold font-playfair text-brand-indigo">Total</span>
                  <span className="text-2xl font-bold font-poppins text-brand-indigo">{formatPrice(cartTotal + 2)}</span>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-brand-gold/10 rounded-xl p-4 mb-6 border border-brand-gold/30">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-brand-indigo font-poppins">
                    <Shield className="h-4 w-4 mr-2" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center text-sm text-brand-indigo font-poppins">
                    <Truck className="h-4 w-4 mr-2" />
                    <span>Free Delivery on orders above ₹499</span>
                  </div>
                  <div className="flex items-center text-sm text-brand-indigo font-poppins">
                    <Percent className="h-4 w-4 mr-2" />
                    <span>Easy Returns & Exchanges</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-brand-gold text-brand-indigo py-4 px-6 rounded-xl font-bold font-poppins text-lg hover:bg-white hover:text-brand-indigo border border-brand-gold transition-all duration-300 shadow-lg hover:shadow-xl mb-4"
              >
                Proceed to Checkout
              </button>

              {/* Continue Shopping */}
              <Link
                to="/products"
                className="block w-full text-center text-brand-indigo hover:text-brand-gold font-semibold font-poppins py-3 px-6 border-2 border-brand-gold/30 rounded-xl hover:border-brand-gold hover:bg-brand-gold/10 transition-all duration-200"
              >
                Continue Shopping
              </Link>
              
              {/* Security Badge */}
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <Shield className="h-4 w-4 mr-2" />
                  <span>SSL Secured Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Saved for Later / Wishlist Section */}
        {((isAuthenticated && wishlist?.items.length > 0) || (!isAuthenticated && localWishlist.length > 0)) && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Saved for Later ({isAuthenticated ? wishlist?.items.length || 0 : localWishlist.length})
              </h3>
              
              <div className="space-y-4">
                {(isAuthenticated ? wishlist?.items || [] : localWishlist).map((item: any, index: number) => {
                  const product = isAuthenticated ? item.product : item.product;
                  const productId = product?._id || product?.id;
                  const productName = product?.name || 'Product';
                  const wishlistItemKey = `wishlist-${productId}-${index}`;
                  
                  return (
                    <div key={wishlistItemKey} className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4 p-4 border border-gray-200 rounded-lg">
                      {/* Product Image */}
                      <div className="flex-shrink-0 w-full sm:w-auto">
                        <Link to={`/products/${productId}`}>
                          <img
                            src={getImageUrl(product?.images?.[0])}
                            alt={productName}
                            className="w-full h-32 sm:w-20 sm:h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        </Link>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 w-full">
                        <Link
                          to={`/products/${productId}`}
                          className="text-base font-medium text-gray-900 hover:text-pink-600 transition-colors line-clamp-2"
                        >
                          {productName}
                        </Link>
                        
                        <div className="mt-1">
                          <span className="text-sm text-gray-600">
                            Price: <span className="font-medium text-gray-900">{formatPrice(product?.price || 0)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <button
                          onClick={() => handleMoveToCart(item, product)}
                          className="flex items-center space-x-1 text-pink-600 hover:text-pink-700 hover:bg-pink-50 px-3 py-2 rounded-md transition-colors text-sm font-medium"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>Move to Cart</span>
                        </button>
                        <button
                          onClick={() => handleRemoveFromWishlist(productId)}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md transition-colors text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;