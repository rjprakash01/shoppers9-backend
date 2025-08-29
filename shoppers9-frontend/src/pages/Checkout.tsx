import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, MapPin, User, Mail, Phone, Lock } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/currency';
import { orderService } from '../services/orders';

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

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, localCart, cartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
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
  
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  
  const cartItems = isAuthenticated ? cart?.items || [] : localCart;
  const shippingCost = 99;
  const totalAmount = cartTotal + shippingCost;
  
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);
  
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
    const required = ['cardNumber', 'expiryDate', 'cvv', 'cardholderName'];
    return required.every(field => paymentDetails[field as keyof PaymentDetails].trim() !== '');
  };
  
  const handlePlaceOrder = async () => {
    if (!validateShipping() || !validatePayment()) {
      alert('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    try {
      // First create the shipping address if user is authenticated
      let shippingAddressId = '';
      
      if (isAuthenticated) {
        const addressData = {
          name: shippingAddress.fullName,
          phone: shippingAddress.phone,
          addressLine1: shippingAddress.address,
          addressLine2: '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          pincode: shippingAddress.pincode,
          landmark: '',
          isDefault: false
        };
        
        const { authService } = await import('../services/auth');
        const createdAddress = await authService.addAddress(addressData);
        shippingAddressId = createdAddress.id;
      }
      
      const orderData = {
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddressId,
        paymentMethod: 'card'
      };
      
      const order = await orderService.createOrder(orderData);
      await clearCart();
      navigate(`/orders/${order._id}`);
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderOrderSummary = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
      
      <div className="space-y-4 mb-6">
        {cartItems.map((item, index) => (
          <div key={index} className="flex items-center space-x-4">
            <img
              src={item.variant?.images?.[0] || '/placeholder-image.jpg'}
              alt={item.product?.name || 'Product'}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{item.product?.name}</h4>
              <p className="text-sm text-gray-600">
                {item.variant?.color} • Size: {item.size}
              </p>
              <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatPrice(cartTotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span>{formatPrice(shippingCost)}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold text-gray-900 border-t pt-2">
          <span>Total</span>
          <span>{formatPrice(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
  
  const renderShippingForm = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <Truck className="h-6 w-6 text-primary-600 mr-3" />
        <h3 className="text-lg font-semibold text-gray-900">Shipping Address</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={shippingAddress.fullName}
              onChange={(e) => handleShippingChange('fullName', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              value={shippingAddress.email}
              onChange={(e) => handleShippingChange('email', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              value={`+91 ${shippingAddress.phone}`}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              value={shippingAddress.address}
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
            value={shippingAddress.city}
            onChange={(e) => handleShippingChange('city', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter your city"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State *
          </label>
          <input
            type="text"
            value={shippingAddress.state}
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
            value={shippingAddress.pincode}
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
            value={shippingAddress.country}
            onChange={(e) => handleShippingChange('country', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="India">India</option>
          </select>
        </div>
      </div>
    </div>
  );
  
  const renderPaymentForm = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <CreditCard className="h-6 w-6 text-primary-600 mr-3" />
        <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Number *
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={paymentDetails.cardNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
                if (value.length <= 19) handlePaymentChange('cardNumber', value);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            value={paymentDetails.expiryDate}
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
              value={paymentDetails.cvv}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 3) handlePaymentChange('cvv', value);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            value={paymentDetails.cardholderName}
            onChange={(e) => handlePaymentChange('cardholderName', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter cardholder name"
          />
        </div>
      </div>
    </div>
  );
  
  if (cartItems.length === 0) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {renderShippingForm()}
            {renderPaymentForm()}
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            {renderOrderSummary()}
            
            <button
              onClick={handlePlaceOrder}
              disabled={isLoading || !validateShipping() || !validatePayment()}
              className="w-full mt-6 bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Placing Order...' : `Place Order • ${formatPrice(totalAmount)}`}
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              By placing your order, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;