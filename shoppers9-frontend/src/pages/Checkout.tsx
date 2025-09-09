import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, MapPin, User, Mail, Lock, Tag, Percent, X, Smartphone, Wallet, Building2, Plus, Edit2, Shield, Star, Gift, CheckCircle, ArrowLeft, Package } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/currency';
import { orderService } from '../services/orders';
import { cartService } from '../services/cart';
import { authService } from '../services/auth';

interface Address {
  id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
}

interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface PaymentDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'cod';

interface CartSummary {
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
  couponDiscount: number;
  platformFee: number;
  deliveryFee: number;
  total: number;
  appliedCoupon?: string;
  estimatedDelivery: Date;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, localCart, cartTotal, clearCart, refreshCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('card');
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });

  // Load default address when user data is available
  useEffect(() => {
    if (user?.addresses) {
      const defaultAddress = user.addresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setShippingAddress({
          fullName: defaultAddress.name,
          email: user.email || '',
          phone: defaultAddress.phone,
          address: `${defaultAddress.addressLine1}${defaultAddress.addressLine2 ? ', ' + defaultAddress.addressLine2 : ''}`,
          city: defaultAddress.city,
          state: defaultAddress.state,
          pincode: defaultAddress.pincode,
          country: 'India'
        });
      }
    }
  }, [user]);
  
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  
  // Address management states
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  
  const cartItems = isAuthenticated ? cart?.items || [] : localCart;
  const totalAmount = cartSummary?.total || cartTotal;
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (cartItems.length === 0) {
      navigate('/cart');
    } else {
      fetchCartSummary();
      fetchSavedAddresses();
    }
  }, [cartItems, navigate, isAuthenticated]);

  const fetchSavedAddresses = async () => {
    if (!isAuthenticated) return;
    
    try {
      const addresses = await authService.getAddresses();
      setSavedAddresses(addresses);
      
      // Set default address if available
      const defaultAddress = addresses.find(addr => addr.isDefault);
      if (defaultAddress && !selectedAddressId) {
        setSelectedAddressId(defaultAddress.id);
        setShippingAddress({
          fullName: defaultAddress.name,
          email: user?.email || '',
          phone: defaultAddress.phone,
          address: defaultAddress.addressLine1 + (defaultAddress.addressLine2 ? ', ' + defaultAddress.addressLine2 : ''),
          city: defaultAddress.city,
          state: defaultAddress.state,
          pincode: defaultAddress.pincode,
          country: 'India'
        });
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  const fetchCartSummary = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { summary } = await cartService.getCartSummary();
      setCartSummary(summary);
      setAppliedCoupon(summary.appliedCoupon || null);
    } catch (error) {
      console.error('Failed to fetch cart summary:', error);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const { discount } = await cartService.applyCoupon(couponCode.trim());
      setCouponSuccess(`Coupon applied! You saved ${formatPrice(discount)}`);
      setAppliedCoupon(couponCode.trim());
      setCouponCode('');
      await fetchCartSummary();
    } catch (error: any) {
      setCouponError(error.response?.data?.message || 'Invalid coupon code');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await cartService.removeCoupon();
      setAppliedCoupon(null);
      setCouponSuccess('');
      setCouponError('');
      await fetchCartSummary();
    } catch (error) {
      console.error('Failed to remove coupon:', error);
    }
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selectedAddress = savedAddresses.find(addr => addr.id === addressId);
    if (selectedAddress) {
      setShippingAddress({
        fullName: selectedAddress.name,
        email: user?.email || '',
        phone: selectedAddress.phone,
        address: selectedAddress.addressLine1 + (selectedAddress.addressLine2 ? ', ' + selectedAddress.addressLine2 : ''),
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
        country: 'India'
      });
    }
    setShowAddressForm(false);
  };

  const handleAddNewAddress = async () => {
    if (!shippingAddress) return;
    
    setIsAddingAddress(true);
    try {
      const newAddress = await authService.addAddress({
        name: shippingAddress.fullName,
        phone: shippingAddress.phone,
        addressLine1: shippingAddress.address,
        addressLine2: '',
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        landmark: '',
        isDefault: savedAddresses.length === 0
      });
      
      await fetchSavedAddresses();
      setSelectedAddressId(newAddress.id);
      setShowAddressForm(false);
    } catch (error) {
      console.error('Failed to add address:', error);
    } finally {
      setIsAddingAddress(false);
    }
  };
  
  const handleShippingChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
  };
  
  const handlePaymentChange = (field: keyof PaymentDetails, value: string) => {
    setPaymentDetails(prev => ({ ...prev, [field]: value }));
  };
  
  const validateShipping = () => {
    const required = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'pincode'];
    return required.every(field => shippingAddress[field as keyof ShippingAddress].trim() !== '');
  };
  
  const validatePayment = () => {
    switch (selectedPaymentMethod) {
      case 'card':
        const required = ['cardNumber', 'expiryDate', 'cvv', 'cardholderName'];
        return required.every(field => paymentDetails[field as keyof PaymentDetails].trim() !== '');
      case 'upi':
        return upiId.trim() !== '' && /^[\w.-]+@[\w.-]+$/.test(upiId);
      case 'netbanking':
        return selectedBank.trim() !== '';
      case 'cod':
        return true;
      default:
        return false;
    }
  };
  
  const handlePlaceOrder = async () => {
    if (!validateShipping()) {
      alert('Please fill in all required shipping address fields');
      return;
    }
    
    if (!validatePayment()) {
      let message = 'Please complete payment information: ';
      switch (selectedPaymentMethod) {
        case 'card':
          message += 'Card number, expiry date, CVV, and cardholder name are required';
          break;
        case 'upi':
          message += 'Valid UPI ID is required';
          break;
        case 'netbanking':
          message += 'Please select a bank';
          break;
        default:
          message = 'Please complete payment information';
      }
      alert(message);
      return;
    }
    
    setIsLoading(true);
    try {
      // Map frontend payment methods to backend expected values
      const paymentMethodMap: Record<PaymentMethod, string> = {
        'card': 'CARD',
        'upi': 'UPI',
        'netbanking': 'ONLINE',
        'cod': 'COD'
      };
      
      // Transform shipping address to match backend expectations
      const orderData = {
        shippingAddress: {
          name: shippingAddress.fullName,
          phone: shippingAddress.phone,
          addressLine1: shippingAddress.address,
          addressLine2: '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          pincode: shippingAddress.pincode,
          landmark: ''
        },
        paymentMethod: paymentMethodMap[selectedPaymentMethod],
        couponCode: appliedCoupon || undefined
      };
      
      const response = await orderService.createOrder(orderData);
      
      // Clear cart after successful order
      await clearCart();
      // Refresh cart to update UI immediately
      await refreshCart();
      
      // Navigate to order confirmation
      navigate('/order-confirmation', { 
        state: { 
          orderId: response.orderId,
          totalAmount: response.totalAmount 
        } 
      });
    } catch (error: any) {
      console.error('Order creation failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to place order. Please try again.';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderOrderSummary = () => (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-brand-gold/20">
      <h3 className="text-2xl font-bold font-playfair text-brand-indigo mb-6 flex items-center">
        <Gift className="h-6 w-6 mr-3 text-brand-gold" />
        Order Summary
      </h3>
      
      <div className="space-y-4 mb-6">
        {cartItems.map((item, index) => (
          <div key={item._id || `${item.productId || item.product}-${item.variantId}-${item.size}-${index}`} className="flex items-center space-x-4">
            <img
              src={item.variant?.images?.[0] || '/placeholder-image.svg'}
              alt={item.productData?.name || 'Product'}
              className="w-16 h-16 object-cover rounded-lg border border-brand-gold/20"
            />
            <div className="flex-1">
              <h4 className="font-medium font-poppins text-brand-indigo">{item.productData?.name}</h4>
              <p className="text-sm text-brand-indigo/70 font-poppins">
                {item.variant?.color} • Size: {item.size}
              </p>
              <p className="text-sm text-brand-indigo/70 font-poppins">Qty: {item.quantity}</p>
            </div>
            <div className="text-right">
              <p className="font-medium font-poppins text-brand-indigo">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Coupon Section */}
      <div className="border-t pt-4 mb-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Have a coupon code?
          </label>
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <Tag className="text-green-600 mr-2" size={16} />
                <span className="text-green-800 font-medium">{appliedCoupon}</span>
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="text-red-600 hover:text-red-800"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isApplyingCoupon}
              />
              <button
                onClick={handleApplyCoupon}
                disabled={isApplyingCoupon || !couponCode.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isApplyingCoupon ? 'Applying...' : 'Apply'}
              </button>
            </div>
          )}
          {couponError && (
            <p className="text-red-600 text-sm mt-1">{couponError}</p>
          )}
          {couponSuccess && (
            <p className="text-green-600 text-sm mt-1">{couponSuccess}</p>
          )}
        </div>
      </div>
      
      {/* Billing Summary */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({cartSummary?.itemCount || cartItems.length} items)</span>
          <span>{formatPrice(cartSummary?.subtotal || cartTotal)}</span>
        </div>
        
        {cartSummary?.couponDiscount && cartSummary.couponDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="flex items-center">
              <Percent className="mr-1" size={14} />
              Coupon Discount
            </span>
            <span>-{formatPrice(cartSummary.couponDiscount || 0)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-gray-600">
          <span>Platform Fee</span>
          <span>{formatPrice(cartSummary?.platformFee || 2)}</span>
        </div>
        
        <div className="flex justify-between text-gray-600">
          <span>Delivery Fee</span>
          <span>{cartSummary?.deliveryFee === 0 ? 'FREE' : formatPrice(cartSummary?.deliveryFee || 99)}</span>
        </div>
        
        <div className="flex justify-between text-lg font-semibold text-gray-900 border-t pt-2">
          <span>Total Amount</span>
          <span>{formatPrice(totalAmount)}</span>
        </div>
        
        {cartSummary?.estimatedDelivery && (
          <div className="text-sm text-gray-600 mt-2">
            <span className="flex items-center">
              <Truck className="mr-1" size={14} />
              Estimated delivery: {new Date(cartSummary.estimatedDelivery).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
  
  const renderShippingForm = () => (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Shipping Address</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowAddressForm(false);
              setSelectedAddressId(null);
              setShippingAddress({
                fullName: '',
                email: user?.email || '',
                phone: '',
                address: '',
                city: '',
                state: '',
                pincode: '',
                country: 'India'
              });
            }}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} className="mr-1" />
            Add New Address
          </button>
          {savedAddresses.length > 0 && (
            <button
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {showAddressForm ? 'Cancel' : 'Choose Saved Address'}
            </button>
          )}
        </div>
      </div>
      
      {/* Default Address Display */}
      {savedAddresses.length > 0 && !showAddressForm && selectedAddressId && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center mb-2">
                <h4 className="text-md font-medium text-green-800">Selected Address</h4>
                {savedAddresses.find(addr => addr.id === selectedAddressId)?.isDefault && (
                  <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    Default
                  </span>
                )}
              </div>
              {(() => {
                const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId);
                return selectedAddress ? (
                  <div className="text-sm text-green-700">
                    <p className="font-medium">{selectedAddress.name}</p>
                    <p>{selectedAddress.phone}</p>
                    <p>
                      {selectedAddress.addressLine1}
                      {selectedAddress.addressLine2 && `, ${selectedAddress.addressLine2}`}
                    </p>
                    <p>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</p>
                  </div>
                ) : null;
              })()} 
            </div>
            <button
              onClick={() => setShowAddressForm(true)}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Change
            </button>
          </div>
        </div>
      )}
      
      {/* Saved Addresses Selection */}
      {showAddressForm && savedAddresses.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-3">Select Saved Address</h4>
          <div className="space-y-3">
            {savedAddresses.map((address) => (
              <div
                key={address.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedAddressId === address.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleAddressSelect(address.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{address.name}</p>
                    <p className="text-sm text-gray-600">{address.phone}</p>
                    <p className="text-sm text-gray-600">
                      {address.addressLine1}
                      {address.addressLine2 && `, ${address.addressLine2}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {address.city}, {address.state} - {address.pincode}
                    </p>
                    {address.isDefault && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <input
                    type="radio"
                    checked={selectedAddressId === address.id}
                    onChange={() => handleAddressSelect(address.id)}
                    className="mt-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Address Form */}
      {(!showAddressForm || selectedAddressId === null) && (
        <div>
      
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={shippingAddress?.fullName || ''}
              onChange={(e) => handleShippingChange('fullName', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your full name"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={shippingAddress?.email || ''}
              onChange={(e) => handleShippingChange('email', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Number *
          </label>
          <div className="relative">
            <input
              type="tel"
              value={`+91 ${shippingAddress?.phone || ''}`}
              onChange={(e) => {
                const value = e.target.value;
                if (value.startsWith('+91 ')) {
                  const phoneNumber = value.slice(4).replace(/\D/g, ''); // Remove +91 and non-digits
                  if (phoneNumber.length <= 10) {
                    handleShippingChange('phone', phoneNumber);
                  }
                }
              }}
              onFocus={(e) => {
                // Position cursor after +91 
                if (e.target.value === '+91 ') {
                  setTimeout(() => {
                    e.target.setSelectionRange(4, 4);
                  }, 0);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+91 9876543210"
              maxLength={14}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Enter your 10-digit mobile number
          </p>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <textarea
              value={shippingAddress?.address || ''}
              onChange={(e) => handleShippingChange('address', e.target.value)}
              rows={3}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter your complete address"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <input
            type="text"
            value={shippingAddress?.city || ''}
            onChange={(e) => handleShippingChange('city', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your city"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State *
          </label>
          <input
            type="text"
            value={shippingAddress?.state || ''}
            onChange={(e) => handleShippingChange('state', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter your state"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pincode *
          </label>
          <input
            type="text"
            value={shippingAddress?.pincode || ''}
            onChange={(e) => handleShippingChange('pincode', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter your pincode"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country *
          </label>
          <select
            value={shippingAddress?.country || ''}
            onChange={(e) => handleShippingChange('country', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="India">India</option>
          </select>
        </div>
      </div>
      
          {/* Save Address Button - only show when adding new address */}
          {!selectedAddressId && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Save this address for future orders</h4>
                  <p className="text-xs text-gray-500">This will be saved to your address book</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddNewAddress}
                disabled={isAddingAddress || !validateShipping()}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isAddingAddress ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving Address...
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-2" />
                    Save This Address for Future Use
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
  
  const renderPaymentForm = () => (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4">
          <CreditCard className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Payment Method</h3>
      </div>
      
      {/* Payment Method Selection */}
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setSelectedPaymentMethod('card')}
            className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
               selectedPaymentMethod === 'card'
                 ? 'border-blue-500 bg-blue-50 text-blue-700'
                 : 'border-gray-300 hover:border-gray-400'
             }`}
          >
            <CreditCard size={24} />
            <span className="text-sm font-medium">Card</span>
          </button>
          
          <button
            type="button"
            onClick={() => setSelectedPaymentMethod('upi')}
            className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
               selectedPaymentMethod === 'upi'
                 ? 'border-blue-500 bg-blue-50 text-blue-700'
                 : 'border-gray-300 hover:border-gray-400'
             }`}
          >
            <Smartphone size={24} />
            <span className="text-sm font-medium">UPI</span>
          </button>
          
          <button
            type="button"
            onClick={() => setSelectedPaymentMethod('netbanking')}
            className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
               selectedPaymentMethod === 'netbanking'
                 ? 'border-blue-500 bg-blue-50 text-blue-700'
                 : 'border-gray-300 hover:border-gray-400'
             }`}
          >
            <Building2 size={24} />
            <span className="text-sm font-medium">Net Banking</span>
          </button>
          
          <button
            type="button"
            onClick={() => setSelectedPaymentMethod('cod')}
            className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
               selectedPaymentMethod === 'cod'
                 ? 'border-blue-500 bg-blue-50 text-blue-700'
                 : 'border-gray-300 hover:border-gray-400'
             }`}
          >
            <Wallet size={24} />
            <span className="text-sm font-medium">COD</span>
          </button>
        </div>
      </div>
      
      {/* Payment Method Forms */}
      {selectedPaymentMethod === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Number *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={paymentDetails?.cardNumber || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
                  if (value.length <= 19) handlePaymentChange('cardNumber', value);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date *
            </label>
            <input
              type="text"
              value={paymentDetails?.expiryDate || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/, '$1/');
                if (value.length <= 5) handlePaymentChange('expiryDate', value);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="MM/YY"
              maxLength={5}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CVV *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={paymentDetails?.cvv || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 3) handlePaymentChange('cvv', value);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123"
                maxLength={3}
              />
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cardholder Name *
            </label>
            <input
              type="text"
              value={paymentDetails?.cardholderName || ''}
              onChange={(e) => handlePaymentChange('cardholderName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter cardholder name"
            />
          </div>
        </div>
      )}
      
      {selectedPaymentMethod === 'upi' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            UPI ID *
          </label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="yourname@paytm"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Enter your UPI ID (e.g., yourname@paytm, yourname@gpay)
          </p>
        </div>
      )}
      
      {selectedPaymentMethod === 'netbanking' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Your Bank *
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Choose your bank</option>
              <option value="sbi">State Bank of India</option>
              <option value="hdfc">HDFC Bank</option>
              <option value="icici">ICICI Bank</option>
              <option value="axis">Axis Bank</option>
              <option value="kotak">Kotak Mahindra Bank</option>
              <option value="pnb">Punjab National Bank</option>
              <option value="bob">Bank of Baroda</option>
              <option value="canara">Canara Bank</option>
              <option value="union">Union Bank of India</option>
              <option value="other">Other Banks</option>
            </select>
          </div>
        </div>
      )}
      
      {selectedPaymentMethod === 'cod' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Wallet className="text-yellow-600 mr-3 h-6 w-6" />
            <div>
              <h4 className="font-medium text-yellow-800">Cash on Delivery</h4>
              <p className="text-sm text-yellow-700">
                Pay with cash when your order is delivered. Additional charges may apply.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  if (cartItems.length === 0) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-white to-brand-slate/5">
      {/* Header */}
      <div className="bg-brand-indigo shadow-sm border-b border-brand-gold/20">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/cart')}
                className="mr-4 p-2 text-brand-gold hover:text-white transition-colors rounded-lg hover:bg-brand-gold/10"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold font-playfair text-brand-gold">
                Checkout
              </h1>
            </div>
            <div className="text-sm text-brand-slate font-poppins">
              Step 2 of 2
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-brand-gold/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-brand-slate/30 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-brand-indigo/50" />
                </div>
                <span className="ml-2 text-brand-indigo/50 font-poppins">Cart</span>
              </div>
              <div className="w-16 h-1 bg-brand-gold rounded"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-brand-gold rounded-full flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-brand-indigo" />
                </div>
                <span className="ml-2 font-semibold font-poppins text-brand-indigo">Checkout</span>
              </div>
            </div>
            <div className="text-sm text-brand-indigo/70 font-poppins">
              Complete your purchase
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {renderShippingForm()}
            {renderPaymentForm()}
          </div>
          
          <div className="lg:col-span-1">
            {renderOrderSummary()}
            
            {/* Security Features */}
            <div className="bg-brand-gold/10 rounded-xl p-4 mb-6 border border-brand-gold/30">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-brand-indigo font-poppins">
                  <Shield className="h-4 w-4 mr-2" />
                  <span>256-bit SSL Encryption</span>
                </div>
                <div className="flex items-center text-sm text-brand-indigo font-poppins">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Secure Payment Processing</span>
                </div>
                <div className="flex items-center text-sm text-brand-indigo font-poppins">
                  <Star className="h-4 w-4 mr-2" />
                  <span>Money Back Guarantee</span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isLoading || !validateShipping() || !validatePayment()}
              className="w-full bg-brand-gold text-brand-indigo py-4 px-6 rounded-xl font-bold font-poppins text-lg hover:bg-white hover:text-brand-indigo border border-brand-gold disabled:bg-brand-slate/30 disabled:text-brand-indigo/50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl mb-4"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Placing Order...
                </div>
              ) : (
                `Place Order ${formatPrice(totalAmount)}`
              )}
            </button>
            
            <p className="text-sm text-gray-500 text-center">
              By placing your order, you agree to our <span className="text-purple-600 hover:text-purple-700 cursor-pointer">Terms of Service</span> and <span className="text-purple-600 hover:text-purple-700 cursor-pointer">Privacy Policy</span>.
            </p>
            
            {/* Security Badge */}
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center text-sm text-gray-500">
                <Shield className="h-4 w-4 mr-2" />
                <span>Your payment information is secure and encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;