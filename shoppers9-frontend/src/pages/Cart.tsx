import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Heart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/currency';
import { getImageUrl } from '../utils/imageUtils';
import type { CartItem } from '../services/cart';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { cart, localCart, cartCount, cartTotal, updateCartItem, removeFromCart, refreshCart } = useCart();
  const { isAuthenticated } = useAuth();
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
    console.log('Cart items:', cartItems);
    cartItems.forEach((item, index) => {
      console.log(`Item ${index}: ID=${item._id}, product=${item.product || item.productId}`);
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
      console.error('Failed to update cart item:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleForceRefresh = async () => {
    console.log('Force refreshing cart...');
    localStorage.removeItem('cart');
    await refreshCart();
  };

  const handleTestLogin = async () => {
    try {
      console.log('Attempting test login...');
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
      console.log('Login response:', data);
      
      if (data.success && data.data.accessToken) {
        localStorage.setItem('authToken', data.data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        console.log('Login successful! Refreshing page...');
        window.location.reload();
      }
    } catch (error) {
      console.error('Login failed:', error);
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
      console.error('Failed to remove cart item:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingBag className="mx-auto h-24 w-24 text-gray-300 mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <Link
              to="/products"
              className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Shopping Cart ({cartCount} {cartCount === 1 ? 'item' : 'items'})
            </h1>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item: CartItem) => {
              const itemKey = item._id || `${item.product || item.productId}-${item.variantId}-${item.size}`;
              const productId = item.productData?._id || item.product || item.productId;
              const productName = item.productData?.name || 'Product';
              const isUpdatingThis = isUpdating === itemKey;
              
              return (
                <div key={itemKey} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                 <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                   {/* Product Image */}
                   <div className="flex-shrink-0 w-full sm:w-auto">
                     <img
                       src={getImageUrl(item.variant?.images?.[0] || item.productData?.images?.[0])}
                       alt={productName}
                       className="w-full h-48 sm:w-24 sm:h-24 md:w-28 md:h-28 object-cover rounded-lg border border-gray-200"
                     />
                   </div>

                   {/* Product Details */}
                   <div className="flex-1 min-w-0 w-full">
                     <Link
                       to={`/products/${productId}`}
                       className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-2"
                     >
                       {productName}
                     </Link>
                    
                    <div className="mt-1 space-y-2">
                      <div className="flex flex-wrap gap-4 text-sm">
                        {item.size && (
                          <span className="text-gray-600">
                            Size: <span className="font-medium text-gray-900">{item.size}</span>
                          </span>
                        )}
                        {item.variant?.color && (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600">Color:</span>
                            <div className="flex items-center space-x-1">
                              {item.variant.colorCode && (
                                <div
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: item.variant.colorCode }}
                                />
                              )}
                              <span className="font-medium text-gray-900">{item.variant.color}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(item.price)}
                        </span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <>
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(item.originalPrice)}
                            </span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                              {item.discount}% OFF
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Controls and Actions */}
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 space-y-3 sm:space-y-0">
                     <div className="flex items-center space-x-3">
                       <span className="text-sm font-medium text-gray-700">Qty:</span>
                       <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                         <button
                           onClick={() => handleQuantityChange(item, item.quantity - 1)}
                           disabled={item.quantity <= 1 || isUpdatingThis}
                           className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                         >
                           <Minus className="w-4 h-4" />
                         </button>
                         <span className="px-4 py-2 min-w-[3rem] text-center font-medium bg-gray-50">
                           {isUpdatingThis ? '...' : item.quantity}
                         </span>
                         <button
                           onClick={() => handleQuantityChange(item, item.quantity + 1)}
                           disabled={isUpdatingThis}
                           className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                         >
                           <Plus className="w-4 h-4" />
                         </button>
                       </div>
                     </div>

                     <div className="flex items-center space-x-3">
                       <button
                         className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
                         title="Add to wishlist"
                       >
                         <Heart className="w-4 h-4" />
                         <span className="text-sm">Save</span>
                       </button>
                       <button
                         onClick={() => handleRemoveItem(item)}
                         disabled={isUpdatingThis}
                         className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                         title="Remove item"
                       >
                         {isUpdatingThis ? (
                           <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                         ) : (
                           <Trash2 className="h-4 w-4" />
                         )}
                         <span className="text-sm">Remove</span>
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
              );
             })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({cartCount} items)</span>
                  <span className="font-medium">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-semibold">{formatPrice(cartTotal)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/products"
                className="block w-full text-center text-primary-600 hover:text-primary-700 font-medium mt-4 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;