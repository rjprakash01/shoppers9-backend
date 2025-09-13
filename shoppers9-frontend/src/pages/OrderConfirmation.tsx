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
              totalAmount: stateData.totalAmount || order.totalAmount,
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
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
        {/* Success Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
              <CheckCircle className="h-10 w-10 text-green-600 animate-bounce" />
            </div>
          </div>
          <h1 className="text-2xl font-bold font-playfair text-brand-indigo mb-2">Order Confirmed!</h1>
          <p className="text-sm text-brand-indigo/70 font-poppins max-w-xl mx-auto">Thank you for your purchase! Your order has been successfully placed and we're already working on it.</p>
          
          {/* Celebration Animation */}
          <div className="mt-4 flex justify-center space-x-1">
            <Star className="h-4 w-4 text-brand-gold animate-pulse" />
            <Star className="h-5 w-5 text-brand-gold animate-bounce" />
            <Star className="h-4 w-4 text-brand-gold animate-pulse" />
          </div>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-lg shadow-lg border border-brand-gold/20 mb-4 lg:max-w-4xl lg:mx-auto">
          <div className="px-3 py-2 border-b border-brand-gold/20">
            <h2 className="text-base font-bold font-playfair text-brand-indigo flex items-center lg:justify-center">
              <Gift className="h-3 w-3 mr-1 text-brand-gold" />
              Order Details
            </h2>
          </div>
          <div className="px-4 py-3">
            <div className="bg-brand-gold/10 p-3 rounded-lg border border-brand-gold/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="h-3 w-3 text-brand-indigo mr-1" />
                    <p className="text-xs font-medium font-poppins text-brand-indigo">Order Number</p>
                  </div>
                  <p className="text-xs font-bold font-poppins text-brand-indigo">#{orderDetails.orderNumber.slice(-8).toUpperCase()}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="h-3 w-3 text-brand-indigo mr-1" />
                    <p className="text-xs font-medium font-poppins text-brand-indigo">Total Amount</p>
                  </div>
                  <p className="text-sm font-bold font-poppins text-brand-indigo">{formatPrice(orderDetails.totalAmount)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 text-brand-indigo mr-1" />
                    <p className="text-xs font-medium font-poppins text-brand-indigo">Order Status</p>
                  </div>
                  <span className="inline-flex px-2 py-0.5 text-xs font-bold font-poppins rounded-full bg-brand-gold text-brand-indigo shadow-sm">
                    {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 text-brand-indigo mr-1" />
                    <p className="text-xs font-medium font-poppins text-brand-indigo">Expected Delivery</p>
                  </div>
                  <p className="text-xs font-bold font-poppins text-brand-indigo">{formatDate(orderDetails.estimatedDelivery)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-100 mb-4 lg:max-w-4xl lg:mx-auto">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center lg:justify-center">
              <Clock className="h-4 w-4 mr-2 text-blue-600" />
              Order Timeline
            </h2>
          </div>
          <div className="px-4 py-4">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-blue-300 to-gray-300"></div>
              
              <div className="space-y-4">
                <div className="flex items-center relative">
                  <div className="flex-shrink-0 z-10">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4 bg-gradient-to-r from-green-50 to-emerald-50 p-2 rounded-lg border border-green-100 flex-1">
                    <p className="font-bold text-green-800 text-sm">Order Placed</p>
                    <p className="text-green-700 text-xs">Your order has been successfully placed and confirmed</p>
                    <p className="text-xs text-green-600 mt-0.5">Just now</p>
                  </div>
                </div>
                
                <div className="flex items-center relative">
                  <div className="flex-shrink-0 z-10">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-2 rounded-lg border border-blue-100 flex-1">
                    <p className="font-bold text-blue-800 text-sm">Processing</p>
                    <p className="text-blue-700 text-xs">We're carefully preparing your order for shipment</p>
                    <p className="text-xs text-blue-600 mt-0.5">Within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-center relative">
                  <div className="flex-shrink-0 z-10">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center shadow-md">
                      <Truck className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                  <div className="ml-4 bg-gray-50 p-2 rounded-lg border border-gray-200 flex-1">
                    <p className="font-bold text-gray-600 text-sm">Shipped</p>
                    <p className="text-gray-500 text-xs">Your order is on its way to you</p>
                    <p className="text-xs text-gray-400 mt-0.5">Pending</p>
                  </div>
                </div>
                
                <div className="flex items-center relative">
                  <div className="flex-shrink-0 z-10">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center shadow-md">
                      <Calendar className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                  <div className="ml-4 bg-gray-50 p-2 rounded-lg border border-gray-200 flex-1">
                    <p className="font-bold text-gray-600 text-sm">Delivered</p>
                    <p className="text-gray-500 text-xs">Expected delivery date</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(orderDetails.estimatedDelivery)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-white text-[#322F61] border-2 border-[#322F61] px-6 py-2 rounded-lg font-bold font-poppins text-sm hover:bg-[#322F61] hover:text-white transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center justify-center bg-[#322F61] text-white px-6 py-2 rounded-lg font-bold font-poppins text-sm hover:bg-[#463F85] transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </div>

      </div>
    </div>
  );
};

export default OrderConfirmation;