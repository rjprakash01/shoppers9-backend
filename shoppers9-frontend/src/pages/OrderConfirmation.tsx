import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, Calendar, ArrowRight, Home, ShoppingBag } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
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
                <circle cx="60" cy="60" r="50" stroke="#EF4444" strokeWidth="3" fill="none" />
                <line x1="40" y1="40" x2="80" y2="80" stroke="#EF4444" strokeWidth="3" />
                <line x1="80" y1="40" x2="40" y2="80" stroke="#EF4444" strokeWidth="3" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-8">We couldn't find your order details. Please check your order history or contact support.</p>
            <div className="space-x-4">
              <Link
                to="/"
                className="inline-flex items-center bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
              >
                <Home className="mr-2 h-5 w-5" />
                Go Home
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">Thank you for your purchase. Your order has been successfully placed.</p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-semibold text-gray-900">{orderDetails.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-semibold text-gray-900">{formatPrice(orderDetails.totalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Status</p>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(orderDetails.status)}`}>
                  {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estimated Delivery</p>
                <p className="font-semibold text-gray-900">{formatDate(orderDetails.estimatedDelivery)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Order Timeline</h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">Order Placed</p>
                  <p className="text-sm text-gray-600">Your order has been successfully placed</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-600">Processing</p>
                  <p className="text-sm text-gray-500">We're preparing your order</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Truck className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-600">Shipped</p>
                  <p className="text-sm text-gray-500">Your order is on its way</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-600">Delivered</p>
                  <p className="text-sm text-gray-500">Expected by {formatDate(orderDetails.estimatedDelivery)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">What's Next?</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-center">
              <ArrowRight className="h-4 w-4 mr-2 flex-shrink-0" />
              You'll receive an email confirmation shortly
            </li>
            <li className="flex items-center">
              <ArrowRight className="h-4 w-4 mr-2 flex-shrink-0" />
              We'll send you tracking information once your order ships
            </li>
            <li className="flex items-center">
              <ArrowRight className="h-4 w-4 mr-2 flex-shrink-0" />
              You can track your order status in your account
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
          >
            <Home className="mr-2 h-5 w-5" />
            Back to Home
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center justify-center bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;