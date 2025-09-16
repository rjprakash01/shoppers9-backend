import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, MapPin, User, Mail, Lock, Tag, Percent, X, Smartphone, Wallet, Building2, Plus, Edit2, Shield, Star, Gift, CheckCircle, ArrowLeft, Package } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/currency';
import { getImageUrl } from '../utils/imageUtils';
import orderService from '../services/orderService';
import { settingsService, type PlatformSettings } from '../services/settings';
import type { CreateOrderRequest, ShippingAddress } from '../services/orderService';




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
  const [couponCode, setCouponCode] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  
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

  // Load platform settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const platformSettings = await settingsService.getSettings();
        setSettings(platformSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Calculate fees using settings
  const calculatePlatformFee = () => {
    if (!settings) return 0;
    return settingsService.calculatePlatformFee(totalAmount, settings);
  };

  const calculateDeliveryFee = () => {
    if (!settings) return 0;
    return settingsService.calculateDeliveryFee(totalAmount, settings);
  };
  
  // Calculate final amount with all fees and discounts
  const calculateFinalAmount = () => {
    let amount = totalAmount;
    const platformFee = calculatePlatformFee();
    const deliveryFee = calculateDeliveryFee();
    
    // Add platform fee and delivery fee
    amount = amount + platformFee + deliveryFee;
    
    // Apply UPI discount
    if (selectedPaymentMethod === 'upi') {
      amount = amount - 115; // ₹115 discount for UPI
    }
    
    // Apply coupon discount
    amount = amount - couponDiscount;
    
    return Math.max(0, amount);
  };
  
  // Update final amount when dependencies change
  React.useEffect(() => {
    setFinalAmount(calculateFinalAmount());
  }, [totalAmount, selectedPaymentMethod, couponDiscount, settings]);
  
  // Coupon handlers
  const handleCouponApplied = (discount: number, couponCode: string) => {
    setCouponDiscount(discount);
    setAppliedCoupon(couponCode);
  };
  
  const handleCouponRemoved = () => {
    setCouponDiscount(0);
    setAppliedCoupon('');
  };

  const handleShowAllCoupons = async () => {
    try {
      const { couponService } = await import('../services/couponService');
      const coupons = await couponService.getPublicCoupons();
      setAvailableCoupons(coupons);
      setShowCouponModal(true);
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      alert('Failed to load coupons. Please try again.');
    }
  };

  const handleSelectCoupon = (couponCode: string) => {
    setCouponCode(couponCode);
    setShowCouponModal(false);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      alert('Please enter a coupon code');
      return;
    }

    if (!isAuthenticated) {
      alert('Please login to apply coupons');
      return;
    }

    try {
      const { couponService } = await import('../services/couponService');
      const result = await couponService.applyCoupon(couponCode.trim());
      
      if (result.success) {
        setAppliedCoupon(couponCode.toUpperCase());
        setCouponDiscount(result.discount);
        setCouponCode('');
        alert(`🎉 Coupon "${couponCode.trim()}" applied successfully! You saved ₹${result.discount}`);
      } else {
        alert(result.message || 'Invalid coupon code');
      }
    } catch (error: any) {
      console.error('Error applying coupon:', error);
      if (error.response?.status === 401) {
        alert('Your session has expired. Please login again to apply coupons.');
      } else if (error.response?.status === 400) {
        alert(error.response?.data?.message || 'Invalid coupon code or coupon requirements not met.');
      } else {
        alert('Failed to apply coupon. Please check your internet connection and try again.');
      }
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      const { couponService } = await import('../services/couponService');
      await couponService.removeCoupon();
      setAppliedCoupon('');
      setCouponDiscount(0);
    } catch (error: any) {
      console.error('Error removing coupon:', error);
      setAppliedCoupon('');
      setCouponDiscount(0);
    }
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
              <div className="flex items-center mb-3">
                <h3 className="text-base font-semibold text-gray-900 flex-1">Best Coupon For You</h3>
              </div>
          
              {appliedCoupon ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Coupon Applied: {appliedCoupon}</p>
                      <p className="text-xs text-green-600">You saved {formatPrice(couponDiscount)}</p>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Have a coupon code?</span>
                      <button
                        onClick={handleShowAllCoupons}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        All Coupons
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 flex items-center border border-teal-400 rounded-lg">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Enter coupon code"
                          className="flex-1 px-3 py-2 bg-transparent text-teal-600 font-medium text-sm border-0 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 bg-[#322F61] text-white text-sm font-medium hover:bg-[#463F85] transition-colors"
                      >
                        APPLY COUPON
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                  <span className="text-sm text-gray-600">Platform Fee</span>
                  <span className="text-sm text-gray-900">{formatPrice(calculatePlatformFee())}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Delivery Fee</span>
                  <span className="text-sm text-gray-900">{formatPrice(calculateDeliveryFee())}</span>
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

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Available Coupons</h3>
              <button
                onClick={() => setShowCouponModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {availableCoupons.length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No coupons available at the moment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableCoupons.map((coupon, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 cursor-pointer transition-colors"
                      onClick={() => handleSelectCoupon(coupon.code)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Percent className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-gray-900">{coupon.code}</span>
                        </div>
                        <span className="text-sm text-green-600 font-medium">
                          {coupon.discountType === 'percentage' 
                            ? `${coupon.discountValue}% OFF`
                            : `₹${coupon.discountValue} OFF`
                          }
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{coupon.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Min order: ₹{coupon.minOrderAmount}</span>
                        <span>Valid until: {new Date(coupon.validUntil).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowCouponModal(false)}
                className="w-full bg-gray-600 text-white py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;