import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, MapPin, User, Mail, Lock, Tag, Percent, X, Smartphone, Wallet, Building2, Plus, Edit2, Shield, Star, Gift, CheckCircle, ArrowLeft, Package } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/currency';
import { getImageUrl } from '../utils/imageUtils';
import orderService from '../services/orderService';
import type { CreateOrderRequest, ShippingAddress } from '../services/orderService';
import CouponInput from '../components/CouponInput';



type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'cod';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, localCart, cartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cod');
  const [currentStep, setCurrentStep] = useState<'review' | 'payment'>('payment');
  const [isLoading, setIsLoading] = useState(false);
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  
  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<string>('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  
  const [shippingAddress] = useState<ShippingAddress>({
    name: 'R J Prakash',
    phone: '8076070048',
    addressLine1: 'sai ram merchant, junglighat',
    addressLine2: '',
    city: 'Port Blair',
    state: 'Andaman and Nicobar Islands',
    pincode: '744103',
    landmark: ''
  });

  // Get current cart items based on authentication status
  const cartItems = isAuthenticated ? (cart?.items || []) : localCart;
  const totalAmount = cartTotal;
  
  // Calculate final amount with coupon discount
  const calculateFinalAmount = () => {
    const baseAmount = selectedPaymentMethod === 'upi' ? totalAmount - 115 : totalAmount;
    return Math.max(0, baseAmount - couponDiscount);
  };
  
  // Update final amount when dependencies change
  React.useEffect(() => {
    setFinalAmount(calculateFinalAmount());
  }, [totalAmount, selectedPaymentMethod, couponDiscount]);
  
  // Coupon handlers
  const handleCouponApplied = (discount: number, couponCode: string) => {
    setCouponDiscount(discount);
    setAppliedCoupon(couponCode);
  };
  
  const handleCouponRemoved = () => {
    setCouponDiscount(0);
    setAppliedCoupon('');
  };

  const handlePlaceOrder = async () => {
    try {
      setIsLoading(true);
      
      if (!isAuthenticated) {
        alert('Please login to place an order');
        navigate('/login');
        return;
      }

      // Validate shipping address
      if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.addressLine1 || 
          !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
        alert('Please fill in all required shipping address fields');
        return;
      }

      const orderData: CreateOrderRequest = {
        shippingAddress,
        paymentMethod: selectedPaymentMethod === 'card' ? 'CARD' : 
                      selectedPaymentMethod === 'upi' ? 'UPI' : 
                      selectedPaymentMethod === 'netbanking' ? 'ONLINE' : 'COD',
        totalAmount: finalAmount,
        couponCode: appliedCoupon || undefined
      };

      console.log('Placing order with data:', orderData);
      const response = await orderService.createOrder(orderData);
      console.log('Order created successfully:', response);
      
      // Clear cart and navigate to success page
      await clearCart();
      navigate('/order-confirmation', { 
        state: { 
          orderId: response.data.order._id || response.data.order.orderNumber,
          totalAmount: selectedPaymentMethod === 'upi' ? totalAmount - 115 : totalAmount
        } 
      });
    } catch (error: any) {
      console.error('Error placing order:', error);
      alert(error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-elite-light-grey flex items-center justify-center p-4">
        <div className="postcard-box p-8 text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-elite-light-grey flex items-center justify-center mx-auto mb-6">
            <Package className="h-10 w-10 text-elite-medium-grey" />
          </div>
          
          <h2 className="font-playfair text-subsection font-semibold text-elite-charcoal-black mb-3">No items to checkout</h2>
          <p className="font-inter text-body text-elite-medium-grey mb-6">
            Add items to your cart first
          </p>
          
          <button
            onClick={() => navigate('/cart')}
            className="btn-primary w-full py-3 px-4 font-medium font-inter transition-colors"
          >
            Go to Cart
          </button>
        </div>
      </div>
    );
  }



  // Elite Payment Step
  return (
    <div className="min-h-screen" style={{
      backgroundColor: 'var(--light-grey)'
    }}>
      {/* Desktop Header */}
      <div className="hidden lg:block" style={{
        backgroundColor: 'var(--cta-dark-purple)',
        boxShadow: 'var(--premium-shadow)'
      }}>
        <div className="elite-container">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold" style={{
              fontFamily: 'Playfair Display, serif',
              color: 'var(--base-white)'
            }}>Payment Method</h1>
            <button
              onClick={() => navigate('/cart')}
              className="p-2 transition-colors duration-200"
              style={{
                color: 'var(--base-white)',
                backgroundColor: 'transparent'
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Checkout Header - Clean */}
      <div className="lg:hidden p-4">
        <div className="bg-white" style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/cart')}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors" style={{
                  backgroundColor: 'rgba(99,102,241,0.1)'
                }}
              >
                <ArrowLeft className="h-4 w-4" style={{
                  color: 'var(--cta-dark-purple)'
                }} />
              </button>
              <h1 className="text-xl font-bold" style={{
                fontFamily: 'Inter, sans-serif',
                color: '#1f2937'
              }}>Checkout</h1>
            </div>
            
            <div className="text-sm font-medium" style={{
              color: 'var(--cta-dark-purple)'
            }}>
              {formatPrice(totalAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator - Mobile Only */}
      <div className="lg:hidden p-4">
        <div className="bg-white rounded-xl p-4" style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div className="flex items-center justify-center space-x-4 max-w-xs mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{
                backgroundColor: 'var(--cta-dark-purple)'
              }}>
                ✓
              </div>
              <span className="text-xs font-medium mt-1" style={{
                color: 'var(--cta-dark-purple)'
              }}>Cart</span>
            </div>
            <div className="w-12 h-px" style={{
              backgroundColor: 'var(--cta-dark-purple)'
            }}></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{
                backgroundColor: 'var(--cta-dark-purple)'
              }}>
                2
              </div>
              <span className="text-xs font-medium mt-1" style={{
                color: 'var(--cta-dark-purple)'
              }}>Payment</span>
            </div>
          </div>
        </div>
      </div>

      <div className="elite-container py-4 sm:py-6 pb-32 lg:pb-8 overflow-y-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-4 lg:space-y-0">
           {/* Left Side - Payment Methods */}
           <div className="space-y-4">
             <h2 className="font-playfair text-subsection font-semibold text-elite-charcoal-black mb-4 sm:mb-6">Select payment method</h2>
            
            {/* Elite Payment Methods */}
            <div className="space-y-3 sm:space-y-4">
          {/* Cash on Delivery */}
          <div 
            className={`postcard-box border-2 p-3 sm:p-4 cursor-pointer transition-colors ${
              selectedPaymentMethod === 'cod' 
                ? 'border-elite-cta-purple bg-elite-cta-purple/5' 
                : 'border-elite-light-grey'
            }`}
            onClick={() => setSelectedPaymentMethod('cod')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex items-center">
                  <span className="font-inter text-base font-medium text-elite-charcoal-black mr-2">Cash on Delivery</span>
                </div>
              </div>
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={selectedPaymentMethod === 'cod'}
                onChange={() => setSelectedPaymentMethod('cod')}
                className="w-5 h-5 text-elite-cta-purple border-elite-medium-grey focus:ring-elite-cta-purple"
              />
              </div>
            </div>

            {/* Pay Online */}
            <div 
              className={`postcard-box border-2 p-3 sm:p-4 cursor-pointer transition-colors ${
                selectedPaymentMethod === 'upi' 
                  ? 'border-elite-cta-purple bg-elite-cta-purple/5' 
                  : 'border-elite-light-grey'
              }`}
              onClick={() => setSelectedPaymentMethod('upi')}
            >
              <div className="flex items-center justify-between">
                <div>
                   <div className="flex items-center">
                     <span className="font-inter text-base font-medium text-elite-charcoal-black mr-2">Pay Online</span>
                     <div className="w-4 h-4 bg-elite-cta-purple flex items-center justify-center">
                       <span className="text-xs font-bold text-elite-base-white">ℹ</span>
                     </div>
                   </div>
                 </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={selectedPaymentMethod === 'upi'}
                  onChange={() => setSelectedPaymentMethod('upi')}
                  className="w-5 h-5 text-elite-cta-purple border-elite-medium-grey focus:ring-elite-cta-purple"
                />
              </div>
            </div>
            </div>
          </div>
          
          {/* Right Side - Price Details & Checkout */}
          <div className="space-y-3">
            {/* Coupon Input Section */}
             <div className="bg-white rounded-lg border border-gray-200 p-3">
               <CouponInput
                 onCouponApplied={handleCouponApplied}
                 onCouponRemoved={handleCouponRemoved}
                 appliedCoupon={appliedCoupon}
                 appliedDiscount={couponDiscount}
                 disabled={isLoading}
               />
             </div>

            {/* Price Details Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Price Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total MRP</span>
                  <span className="text-sm text-gray-900">{formatPrice(totalAmount)}</span>
                </div>
                {selectedPaymentMethod === 'upi' && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Online Discount</span>
                    <span className="text-sm text-green-600">-₹115</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Coupon Discount</span>
                    <span className="text-sm text-green-600">-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Platform & Event Fee</span>
                  <div className="text-right">
                    <span className="text-sm text-green-600">FREE</span>
                  </div>
                </div>
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">Total Amount</span>
                  <span className="text-base font-semibold text-gray-900">{formatPrice(finalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Place Order Button - Desktop Only */}
            <div className="hidden lg:block">
              <button
                onClick={handlePlaceOrder}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#322F61] text-white hover:bg-[#463F85]'
                }`}
              >
                {isLoading ? 'Processing...' : 'PLACE ORDER'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Elite Bottom Place Order Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-elite-base-white border-t border-elite-light-grey p-3 sm:p-4 shadow-premium lg:hidden z-50">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-inter text-base sm:text-lg font-semibold text-elite-charcoal-black">
              {formatPrice(finalAmount)}
            </p>
            <button 
              onClick={() => setShowPriceDetails(!showPriceDetails)}
              className="font-inter text-xs sm:text-sm text-elite-cta-purple font-medium"
            >
              VIEW PRICE DETAILS
            </button>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={isLoading}
            className={`btn-primary px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-medium font-inter transition-colors ${
              isLoading
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            {isLoading ? 'Processing...' : 'PLACE ORDER'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;