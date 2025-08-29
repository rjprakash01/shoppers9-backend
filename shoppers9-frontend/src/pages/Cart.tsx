import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/currency';
import type { CartItem } from '../services/cart';

const Cart: React.FC = () => {
  const { cart, localCart, updateCartItem, removeFromCart, cartTotal, cartCount } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Get current cart items based on authentication status
  const cartItems = isAuthenticated ? (cart?.items || []) : localCart;

  const handleQuantityChange = async (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setIsUpdating(item._id || item.productId);
    try {
      await updateCartItem(item.productId, item.variantId, item.size, newQuantity);
    } catch (error) {
      console.error('Failed to update cart item:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = async (item: CartItem) => {
    setIsUpdating(item._id || item.productId);
    try {
      await removeFromCart(item.productId, item.variantId, item.size);
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
        <div className="flex items-center mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item: CartItem) => (
               <div key={item._id || `${item.productId}-${item.variantId}-${item.size}`} className="bg-white rounded-lg shadow-md p-6">
                 <div className="flex items-start space-x-4">
                   {/* Product Image */}
                   <div className="flex-shrink-0">
                     <img
                       src={item.variant?.images?.[0] || item.product?.images?.[0] || '/placeholder-image.jpg'}
                       alt={item.product?.name || 'Product'}
                       className="w-24 h-24 object-cover rounded-lg"
                     />
                   </div>

                   {/* Product Details */}
                   <div className="flex-1 min-w-0">
                     <Link
                       to={`/products/${item.productId}`}
                       className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                     >
                       {item.product?.name || 'Product'}
                     </Link>
                    
                    <div className="mt-1 space-y-1">
                      {item.variant?.color && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Color:</span>
                          <div className="flex items-center space-x-1">
                            {item.variant.colorCode && (
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: item.variant.colorCode }}
                              />
                            )}
                            <span className="text-sm text-gray-900">{item.variant.color}</span>
                          </div>
                        </div>
                      )}
                      {item.size && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Size:</span>
                          <span className="text-sm text-gray-900">{item.size}</span>
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold text-gray-900">
                          {formatPrice(item.price)}
                        </span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <>
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(item.originalPrice)}
                            </span>
                            <span className="text-sm text-green-600 font-medium">
                              {item.discount}% off
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end space-y-4">
                    <div className="flex items-center space-x-2">
                       <button
                         onClick={() => handleQuantityChange(item, item.quantity - 1)}
                         disabled={item.quantity <= 1 || isUpdating === (item._id || item.productId)}
                         className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         <Minus className="h-4 w-4" />
                       </button>
                       <span className="w-12 text-center font-medium">{item.quantity}</span>
                       <button
                         onClick={() => handleQuantityChange(item, item.quantity + 1)}
                         disabled={isUpdating === (item._id || item.productId)}
                         className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         <Plus className="h-4 w-4" />
                       </button>
                     </div>

                     <button
                       onClick={() => handleRemoveItem(item)}
                       disabled={isUpdating === (item._id || item.productId)}
                       className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       <Trash2 className="h-5 w-5" />
                     </button>
                  </div>
                </div>
              </div>
            ))}
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