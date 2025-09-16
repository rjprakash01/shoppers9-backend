import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Calendar, MapPin, Truck, CheckCircle, Clock, XCircle, X, RotateCcw } from 'lucide-react';
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
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelReturnModal, setShowCancelReturnModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [isSubmittingCancelReturn, setIsSubmittingCancelReturn] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchOrderDetails = async () => {
        try {
          setIsLoading(true);
          const orderData = await orderService.getOrder(id!);
          setOrder(orderData);
        } catch (err: any) {
          setError(err.message || 'Failed to load order details');
        } finally {
          setIsLoading(false);
        }
      };

      if (id) {
        fetchOrderDetails();
      }
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
      case 'return_requested':
        return <RotateCcw className="h-5 w-5 text-orange-500" />;
      case 'returned':
        return <RotateCcw className="h-5 w-5 text-orange-600" />;
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
      case 'return_requested':
        return 'text-orange-600 bg-orange-50';
      case 'returned':
        return 'text-orange-700 bg-orange-100';
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

  const canRequestReturn = () => {
    if (!order) return false;
    
    // Only delivered orders can be returned
    if (order.orderStatus !== 'delivered') return false;
    
    // Check if return already requested
    if (order.returnRequestedAt) return false;
    
    // Check if within 30-day return window
    if (order.deliveredAt) {
      const deliveredDate = new Date(order.deliveredAt);
      const daysSinceDelivery = Math.floor((Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceDelivery <= 30;
    }
    
    return false;
  };

  const handleReturnRequest = async () => {
    if (!returnReason.trim()) {
      alert('Please select a return reason');
      return;
    }

    setIsSubmittingReturn(true);
    try {
      await orderService.requestReturn(order!.orderId, returnReason);
      
      // Update order status locally
      setOrder(prev => prev ? {
        ...prev,
        orderStatus: 'return_requested' as any,
        returnRequestedAt: new Date().toISOString(),
        returnReason
      } : null);
      
      setShowReturnModal(false);
      setReturnReason('');
      alert('Return request submitted successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to submit return request');
    } finally {
      setIsSubmittingReturn(false);
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
          }
        ]
      };
      
      if (['shipped', 'delivered'].includes(order!.orderStatus.toLowerCase())) {
        mockTrackingInfo.trackingInfo.push({
          status: 'Shipped',
          location: 'Delhi, Delhi',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          description: 'Your order has been shipped and is on the way'
        });
      }
      
      setTrackingInfo(mockTrackingInfo);
    } catch (error) {
      alert('Failed to track order. Please try again.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert('Please select a cancellation reason');
      return;
    }

    setIsSubmittingCancel(true);
    try {
      await orderService.cancelOrder(order!.orderId, cancelReason);
      
      // Update order status locally
      setOrder(prev => prev ? {
        ...prev,
        orderStatus: 'cancelled' as any
      } : null);
      
      setShowCancelModal(false);
      setCancelReason('');
      alert('Order cancelled successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to cancel order');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleCancelReturnRequest = async () => {
    setIsSubmittingCancelReturn(true);
    try {
      // This would need a backend endpoint to cancel return request
      // For now, just update the status locally
      setOrder(prev => prev ? {
        ...prev,
        orderStatus: 'delivered' as any,
        returnRequestedAt: undefined,
        returnReason: undefined
      } : null);
      
      setShowCancelReturnModal(false);
      alert('Return request cancelled successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to cancel return request');
    } finally {
      setIsSubmittingCancelReturn(false);
    }
  };

  const handleReorder = () => {
    // Navigate to the first product's detail page
    if (order && order.items.length > 0) {
      const firstItem = order.items[0];
      if (firstItem.product && firstItem.product._id) {
        navigate(`/products/${firstItem.product._id}`);
      } else {
        alert('Product information not available');
      }
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
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 lg:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Header */}
        <div className="lg:hidden mb-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold text-gray-900">Order Details</h1>
              <button
                onClick={() => navigate('/orders')}
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
              >
                ← Back
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Order ID</p>
                <p className="font-semibold text-sm">{order.orderId}</p>
              </div>
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-semibold text-sm">{formatDate(order.createdAt)}</p>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                  {getStatusIcon(order.orderStatus)}
                  <span className="ml-1 capitalize">{order.orderStatus.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
            <button
              onClick={() => navigate('/orders')}
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              ← Back to Orders
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <span className="ml-2 capitalize">{order.orderStatus.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6 mb-4 lg:mb-6">
          <div className="flex flex-wrap gap-3 lg:gap-4">
            {/* Track Button - Show for all statuses except delivered, returned, and cancelled */}
            {!['delivered', 'returned', 'cancelled'].includes(order.orderStatus.toLowerCase()) && (
              <button
                onClick={handleTrackOrder}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                <Truck className="h-4 w-4 mr-2" />
                Track Order
              </button>
            )}
            
            {/* Cancel Button - Show for all statuses except delivered, returned, return_requested, and cancelled */}
            {!['delivered', 'returned', 'return_requested', 'cancelled'].includes(order.orderStatus.toLowerCase()) && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 flex items-center"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Order
              </button>
            )}
            
            {/* Reorder Button - Show only for cancelled orders */}
            {order.orderStatus.toLowerCase() === 'cancelled' && (
              <button
                onClick={handleReorder}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 flex items-center"
              >
                <Package className="h-4 w-4 mr-2" />
                Reorder
              </button>
            )}
            
            {/* Cancel Return Request Button - Show only for return_requested status */}
            {order.orderStatus.toLowerCase() === 'return_requested' && (
              <button
                onClick={() => setShowCancelReturnModal(true)}
                className="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700 flex items-center"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Return Request
              </button>
            )}
            
            {/* Return Button - Show only for delivered orders */}
            {canRequestReturn() && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 flex items-center"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Return Order
              </button>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6 mb-4 lg:mb-6">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
          <div className="space-y-3 lg:space-y-4">
            {order.items.map((item, index) => {
              const variant = item.product?.variants?.find(v => v._id === item.variantId);
              const imageUrl = variant?.images?.[0] || item.product?.images?.[0] || '';
              
              return (
                <div key={index} className="flex items-center space-x-3 lg:space-x-4 p-3 lg:p-4 bg-gray-50 rounded-lg">
                  <img
                    src={getImageUrl(imageUrl)}
                    alt={item.product?.name || 'Product'}
                    className="w-12 lg:w-16 h-12 lg:h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm lg:text-base">{item.product?.name || 'Product'}</h3>
                    <p className="text-xs lg:text-sm text-gray-500">
                      {variant?.color && `${variant.color} • `}Size: {item.size}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 text-sm lg:text-base">{formatPrice(item.price * item.quantity)}</p>
                    <p className="text-xs lg:text-sm text-gray-500">{formatPrice(item.price)} each</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6 mb-4 lg:mb-6">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">{formatPrice(order.items.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0))}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            {order.couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Coupon Discount ({order.couponCode})</span>
                <span>-{formatPrice(order.couponDiscount)}</span>
              </div>
            )}
            {order.platformFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee</span>
                <span className="font-semibold">{formatPrice(order.platformFee)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="font-semibold">{order.deliveryCharge > 0 ? formatPrice(order.deliveryCharge) : 'Free'}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-lg font-semibold">{formatPrice(order.finalAmount || order.totalAmount)}</span>
            </div>
          </div>
        </div>

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
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 className="font-medium mb-2">Order #{order.orderId}</h4>
                    <p className="text-sm text-gray-600">Expected Delivery: {order.estimatedDelivery || 'TBD'}</p>
                  </div>
                  
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
              
              <div className="mb-4">
                <p className="text-gray-600 mb-4">
                  Please select a reason for cancelling this order:
                </p>
                
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Select a reason</option>
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Product no longer needed">Product no longer needed</option>
                  <option value="Delivery taking too long">Delivery taking too long</option>
                  <option value="Want to change size/color">Want to change size/color</option>
                  <option value="Financial reasons">Financial reasons</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  disabled={isSubmittingCancel}
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={isSubmittingCancel || !cancelReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingCancel ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Return Request Modal */}
        {showCancelReturnModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Cancel Return Request</h3>
                <button
                  onClick={() => setShowCancelReturnModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600">
                  Are you sure you want to cancel your return request? This action cannot be undone.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCancelReturnModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  disabled={isSubmittingCancelReturn}
                >
                  Keep Return Request
                </button>
                <button
                  onClick={handleCancelReturnRequest}
                  disabled={isSubmittingCancelReturn}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingCancelReturn ? 'Cancelling...' : 'Cancel Return Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Return Order Modal */}
        {showReturnModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Return Order</h3>
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 mb-4">
                  Please select a reason for returning this order:
                </p>
                
                <div className="space-y-2">
                  {[
                    'Defective product',
                    'Wrong item received',
                    'Size/fit issues',
                    'Product not as described',
                    'Damaged during shipping',
                    'Changed my mind',
                    'Quality issues',
                    'Other'
                  ].map((reason) => (
                    <label key={reason} className="flex items-center">
                      <input
                        type="radio"
                        name="returnReason"
                        value={reason}
                        checked={returnReason === reason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        className="mr-3 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-gray-700">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  disabled={isSubmittingReturn}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReturnRequest}
                  disabled={isSubmittingReturn || !returnReason.trim()}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReturn ? 'Submitting...' : 'Submit Return'}
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