import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, Calendar, ArrowRight, Home, ShoppingBag, Star, Gift, Shield, Clock, MapPin, Phone, Mail, CreditCard } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { orderService } from '../services/orders';

interface OrderDetails {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  estimatedDelivery: string;
  status: string;
  items?: any[];
  shippingAddress?: any;
}

const OrderConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // Get order details from navigation state
        const stateData = location.state as { orderId: string; totalAmount: number } | null;
        
        if (stateData?.orderId) {
          // Try to fetch full order details from API
          try {
            const order = await orderService.getOrder(stateData.orderId);
            setOrderDetails({
              orderId: order._id,
              orderNumber: order.orderNumber || order._id,
              totalAmount: order.totalAmount || stateData.totalAmount,
              estimatedDelivery: order.estimatedDelivery || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              status: order.orderStatus || 'pending',
              items: order.items,
              shippingAddress: order.shippingAddress
            });
          } catch (apiError) {
            // Fallback to state data if API fails
            setOrderDetails({
              orderId: stateData.orderId,
              orderNumber: stateData.orderId,
              totalAmount: stateData.totalAmount,
              estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'pending'
            });
          }
        } else {
          setError('Order information not found');
        }
      } catch (err) {
        setError('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [location.state]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'confirmed':
        return 'text-blue-600 bg-blue-100';
      case 'processing':
        return 'text-purple-600 bg-purple-100';
      case 'shipped':
        return 'text-indigo-600 bg-indigo-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-white to-brand-slate/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold"></div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-white to-brand-slate/5 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="mx-auto mb-8">
              <svg
                width="120"
                height="120"
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto"
              >
                <circle cx="60" cy="60" r="50" stroke="#C9A646" strokeWidth="3" fill="none" />
                <line x1="40" y1="40" x2="80" y2="80" stroke="#C9A646" strokeWidth="3" />
                <line x1="80" y1="40" x2="40" y2="80" stroke="#C9A646" strokeWidth="3" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold font-playfair text-brand-indigo mb-4">Order Not Found</h1>
            <p className="text-brand-indigo/70 font-poppins mb-8">We couldn't find your order details. Please check your order history or contact support.</p>
            <div className="space-x-4">
              <Link
                to="/"
                className="inline-flex items-center bg-brand-gold text-brand-indigo px-6 py-3 rounded-xl font-semibold font-poppins hover:bg-white hover:text-brand-indigo border border-brand-gold transition-colors"
              >
                <Home className="mr-2 h-5 w-5" />
                Go Home
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center bg-brand-indigo text-brand-gold px-6 py-3 rounded-xl font-semibold font-poppins hover:bg-brand-indigo/90 transition-colors"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-white to-brand-slate/5">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="mx-auto mb-8">
            <div className="w-32 h-32 bg-brand-gold rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle className="h-16 w-16 text-brand-indigo" />
            </div>
          </div>
          <h1 className="text-4xl font-bold font-playfair text-brand-indigo mb-4">Order Confirmed!</h1>
          <p className="text-xl text-brand-indigo/70 font-poppins max-w-2xl mx-auto">Thank you for your purchase! Your order has been successfully placed and we're already working on it.</p>
          
          {/* Celebration Animation */}
          <div className="mt-8 flex justify-center space-x-2">
            <Star className="h-6 w-6 text-brand-gold animate-pulse" />
            <Star className="h-8 w-8 text-brand-gold animate-bounce" />
            <Star className="h-6 w-6 text-brand-gold animate-pulse" />
          </div>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-brand-gold/20 mb-8">
          <div className="px-8 py-6 border-b border-brand-gold/20">
            <h2 className="text-2xl font-bold font-playfair text-brand-indigo flex items-center">
              <Gift className="h-6 w-6 mr-3 text-brand-gold" />
              Order Details
            </h2>
          </div>
          <div className="px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-brand-gold/10 p-6 rounded-xl border border-brand-gold/30">
                <div className="flex items-center mb-3">
                  <Package className="h-5 w-5 text-brand-indigo mr-2" />
                  <p className="text-sm font-medium font-poppins text-brand-indigo">Order Number</p>
                </div>
                <p className="text-xl font-bold font-poppins text-brand-indigo">#{orderDetails.orderNumber.slice(-8).toUpperCase()}</p>
              </div>
              <div className="bg-brand-gold/10 p-6 rounded-xl border border-brand-gold/30">
                <div className="flex items-center mb-3">
                  <CreditCard className="h-5 w-5 text-brand-indigo mr-2" />
                  <p className="text-sm font-medium font-poppins text-brand-indigo">Total Amount</p>
                </div>
                <p className="text-2xl font-bold font-poppins text-brand-indigo">{formatPrice(orderDetails.totalAmount)}</p>
              </div>
              <div className="bg-brand-gold/10 p-6 rounded-xl border border-brand-gold/30">
                <div className="flex items-center mb-3">
                  <Clock className="h-5 w-5 text-brand-indigo mr-2" />
                  <p className="text-sm font-medium font-poppins text-brand-indigo">Order Status</p>
                </div>
                <span className="inline-flex px-4 py-2 text-sm font-bold font-poppins rounded-full bg-brand-gold text-brand-indigo shadow-sm">
                  {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
                </span>
              </div>
              <div className="bg-brand-gold/10 p-6 rounded-xl border border-brand-gold/30">
                <div className="flex items-center mb-3">
                  <Calendar className="h-5 w-5 text-brand-indigo mr-2" />
                  <p className="text-sm font-medium font-poppins text-brand-indigo">Expected Delivery</p>
                </div>
                <p className="text-lg font-bold font-poppins text-brand-indigo">{formatDate(orderDetails.estimatedDelivery)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8">
          <div className="px-8 py-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Clock className="h-6 w-6 mr-3 text-blue-600" />
              Order Timeline
            </h2>
          </div>
          <div className="px-8 py-8">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-blue-300 to-gray-300"></div>
              
              <div className="space-y-8">
                <div className="flex items-center relative">
                  <div className="flex-shrink-0 z-10">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-6 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100 flex-1">
                    <p className="font-bold text-green-800 text-lg">Order Placed</p>
                    <p className="text-green-700">Your order has been successfully placed and confirmed</p>
                    <p className="text-sm text-green-600 mt-1">Just now</p>
                  </div>
                </div>
                
                <div className="flex items-center relative">
                  <div className="flex-shrink-0 z-10">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 flex-1">
                    <p className="font-bold text-blue-800 text-lg">Processing</p>
                    <p className="text-blue-700">We're carefully preparing your order for shipment</p>
                    <p className="text-sm text-blue-600 mt-1">Within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-center relative">
                  <div className="flex-shrink-0 z-10">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center shadow-lg">
                      <Truck className="h-6 w-6 text-gray-500" />
                    </div>
                  </div>
                  <div className="ml-6 bg-gray-50 p-4 rounded-xl border border-gray-200 flex-1">
                    <p className="font-bold text-gray-600 text-lg">Shipped</p>
                    <p className="text-gray-500">Your order is on its way to you</p>
                    <p className="text-sm text-gray-400 mt-1">Pending</p>
                  </div>
                </div>
                
                <div className="flex items-center relative">
                  <div className="flex-shrink-0 z-10">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center shadow-lg">
                      <Calendar className="h-6 w-6 text-gray-500" />
                    </div>
                  </div>
                  <div className="ml-6 bg-gray-50 p-4 rounded-xl border border-gray-200 flex-1">
                    <p className="font-bold text-gray-600 text-lg">Delivered</p>
                    <p className="text-gray-500">Expected delivery date</p>
                    <p className="text-sm text-gray-400 mt-1">{formatDate(orderDetails.estimatedDelivery)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-8 mb-8">
          <h3 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
            <Shield className="h-6 w-6 mr-3" />
            What's Next?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-bold text-blue-900 mb-2">Email Confirmation</h4>
              <p className="text-blue-700 text-sm">You'll receive an email confirmation with order details shortly</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-bold text-blue-900 mb-2">Tracking Info</h4>
              <p className="text-blue-700 text-sm">We'll send you tracking information once your order ships</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-bold text-blue-900 mb-2">Order Tracking</h4>
              <p className="text-blue-700 text-sm">Track your order status anytime in your account</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-brand-gold text-brand-indigo px-10 py-4 rounded-xl font-bold font-poppins text-lg hover:bg-white hover:text-brand-indigo border border-brand-gold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Home className="mr-3 h-6 w-6" />
            Back to Home
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center justify-center bg-brand-indigo text-brand-gold px-10 py-4 rounded-xl font-bold font-poppins text-lg hover:bg-brand-indigo/90 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <ShoppingBag className="mr-3 h-6 w-6" />
            Continue Shopping
          </Link>
        </div>
        
        {/* Security & Support */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-brand-gold/20">
            <div className="flex items-center justify-center space-x-8">
              <div className="flex items-center text-brand-indigo">
                <Shield className="h-5 w-5 mr-2 text-brand-gold" />
                <span className="text-sm font-medium font-poppins">Secure Checkout</span>
              </div>
              <div className="flex items-center text-brand-indigo">
                <Phone className="h-5 w-5 mr-2 text-brand-gold" />
                <span className="text-sm font-medium font-poppins">24/7 Support</span>
              </div>
              <div className="flex items-center text-brand-indigo">
                <Star className="h-5 w-5 mr-2 text-brand-gold" />
                <span className="text-sm font-medium font-poppins">Quality Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;