import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Calendar, MapPin, Truck, CheckCircle, Clock, XCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { orderService, type Order } from '../services/orders';
import { formatPrice } from '../utils/currency';
import { getImageUrl } from '../utils/imageUtils';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [comment, setComment] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchOrderDetails = async () => {
    if (!id) {
      setError('Order ID not provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const orderData = await orderService.getOrder(id);
      setOrder(orderData);
    } catch (err) {
      setError('Failed to load order details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

    fetchOrderDetails();
  }, [id, isAuthenticated, navigate]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'confirmed':
        return 'text-blue-600 bg-blue-50';
      case 'processing':
        return 'text-blue-700 bg-blue-100';
      case 'shipped':
        return 'text-purple-600 bg-purple-50';
      case 'delivered':
        return 'text-green-600 bg-green-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const cancelReasons = [
    'Changed my mind',
    'Found a better price elsewhere',
    'Ordered by mistake',
    'Product no longer needed',
    'Delivery taking too long',
    'Want to change size/color',
    'Financial reasons',
    'Other'
  ];

  const getRefundAmount = (orderStatus: string) => {
    if (!order) return 0;
    // Full refund for pending, confirmed, processing orders
    if (['pending', 'confirmed', 'processing'].includes(orderStatus.toLowerCase())) {
      return order.totalAmount;
    }
    // Partial refund for shipped orders (minus shipping)
    if (orderStatus.toLowerCase() === 'shipped') {
      return order.totalAmount * 0.9; // 90% refund
    }
    return 0;
  };

  const getRefundTimeframe = (paymentMethod: string) => {
    switch (paymentMethod.toLowerCase()) {
      case 'cod':
        return 'N/A (Cash on Delivery)';
      case 'upi':
      case 'online':
        return '3-5 business days';
      case 'card':
        return '5-7 business days';
      default:
        return '3-7 business days';
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert('Please select a cancellation reason');
      return;
    }

    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        setCancelling(true);
        await orderService.cancelOrder(order!.orderId, cancelReason);
        setOrder({ ...order!, orderStatus: 'cancelled' });
        setShowCancelModal(false);
        
        // Calculate refund amount and timeframe
        const refundAmount = getRefundAmount(order!.orderStatus);
        const refundTimeframe = getRefundTimeframe(order!.paymentMethod);
        
        alert(`Order cancelled successfully! You will receive a refund of ₹${refundAmount.toFixed(2)} within ${refundTimeframe}.`);
      } catch (error) {
        console.error('Failed to cancel order:', error);
        alert('Failed to cancel order. Please try again.');
      } finally {
        setCancelling(false);
      }
    }
  };

  const handleTrackOrder = async () => {
    try {
      setTrackingLoading(true);
      setShowTrackModal(true);
      
      // Mock tracking data for now
      const mockTrackingInfo = {
        order: order!,
        trackingInfo: [
          {
            status: 'Order Placed',
            location: 'Mumbai, Maharashtra',
            timestamp: order!.createdAt,
            description: 'Your order has been placed successfully'
          },
          {
            status: 'Order Confirmed',
            location: 'Mumbai, Maharashtra', 
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            description: 'Your order has been confirmed and is being prepared'
          },
          {
            status: 'Shipped',
            location: 'Delhi, Delhi',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            description: 'Your order has been shipped and is on the way'
          }
        ]
      };
      
      setTrackingInfo(mockTrackingInfo);
    } catch (error) {
      console.error('Failed to track order:', error);
      alert('Failed to track order. Please try again.');
    } finally {
      setTrackingLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The order you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/orders')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
            <button
              onClick={() => navigate('/orders')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Orders
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-semibold">{order.orderId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Date</p>
              <p className="font-semibold">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                {getStatusIcon(order.orderStatus)}
                <span className="ml-2 capitalize">{order.orderStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            {['shipped', 'delivered'].includes(order.orderStatus.toLowerCase()) && (
              <button
                onClick={handleTrackOrder}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                <Truck className="h-4 w-4 mr-2" />
                Track Order
              </button>
            )}
            
            {['pending', 'confirmed', 'processing'].includes(order.orderStatus.toLowerCase()) && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 flex items-center"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Order
              </button>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <img
                  src={getImageUrl(item.product.images?.[0] || '')}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                  <p className="text-sm text-gray-500">{formatPrice(item.price)} each</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">{formatPrice(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="font-semibold">Free</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-lg font-semibold">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Shipping Address
          </h2>
          <div className="text-gray-600">
            <p className="font-medium">{order.shippingAddress.name}</p>
            <p>{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
            <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-semibold capitalize">{order.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <p className={`font-semibold capitalize ${
                order.paymentStatus === 'completed' ? 'text-green-600' : 
                order.paymentStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {order.paymentStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Cancel Order Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Cancel Order</h3>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Refund Information */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-blue-900 mb-2">Refund Information</h4>
                <p className="text-sm text-blue-800">
                  Refund Amount: <span className="font-semibold">{formatPrice(getRefundAmount(order.orderStatus))}</span>
                </p>
                <p className="text-sm text-blue-800">
                  Refund Timeline: <span className="font-semibold">{getRefundTimeframe(order.paymentMethod)}</span>
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a reason</option>
                  {cancelReasons.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Comments (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Any additional details..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  disabled={cancelling}
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling || !cancelReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Track Order Modal */}
        {showTrackModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Track Your Order</h3>
                <button
                  onClick={() => setShowTrackModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {trackingLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading tracking information...</p>
                </div>
              ) : trackingInfo ? (
                <div>
                  {/* Order Info */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 className="font-medium mb-2">Order #{order.orderId}</h4>
                    <p className="text-sm text-gray-600">Expected Delivery: {order.estimatedDelivery || 'TBD'}</p>
                  </div>
                  
                  {/* Tracking Timeline */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-4">Tracking History</h4>
                    <div className="space-y-4">
                      {trackingInfo.trackingInfo.map((event: any, index: number) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-3 h-3 bg-blue-600 rounded-full mt-1"></div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{event.status}</p>
                            <p className="text-sm text-gray-600">{event.location}</p>
                            <p className="text-sm text-gray-500">{formatDate(event.timestamp)}</p>
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Delivery Address */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Delivery Address</h4>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">{order.shippingAddress.name}</p>
                      <p>{order.shippingAddress.addressLine1}</p>
                      {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                      <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No tracking information available</p>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowTrackModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;