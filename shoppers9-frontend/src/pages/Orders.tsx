import React, { useState, useEffect } from 'react';
import { Package, Calendar, MapPin, Eye, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { orderService, type Order } from '../services/orders';
import { formatPrice } from '../utils/currency';
import { getImageUrl } from '../utils/imageUtils';
import { useNavigate } from 'react-router-dom';

const Orders: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const response = await orderService.getOrders();
        setOrders(response.orders);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load orders. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, [isAuthenticated, navigate]);
  
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
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
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const handleViewOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };
  
  if (!isAuthenticated) {
    return null; // Will redirect to login
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-8">
              <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
        
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">No orders yet</p>
              <p className="text-sm text-gray-400 mb-4">Start shopping to see your orders here</p>
              <button
                onClick={() => navigate('/products')}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(order.orderStatus)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{(order._id || '').slice(-8).toUpperCase()}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>Placed on {formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                         {(order.orderStatus || '').charAt(0).toUpperCase() + (order.orderStatus || '').slice(1)}
                      </span>
                      <button
                        onClick={() => handleViewOrder(order.orderId)}
                        className="flex items-center text-primary-600 hover:text-primary-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                  
                  {/* Order Items Preview */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Items ({order.items?.length || 0})</h4>
                        <div className="space-y-2">
                          {(order.items || []).slice(0, 2).map((item, index) => (
                            <div key={`${order._id}-item-${index}`} className="flex items-center space-x-3">
                              {item.product?.images?.[0] && (
                                <img
                                  src={getImageUrl(item.product.images[0])}
                                  alt={item.product.name}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {item.product?.name || 'Product'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Qty: {item.quantity} × {formatPrice(item.price)}
                                </p>
                              </div>
                            </div>
                          ))}
                          {(order.items?.length || 0) > 2 && (
                            <p className="text-sm text-gray-500">
                              +{(order.items?.length || 0) - 2} more items
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Total Amount:</span>
                             <span className="text-gray-900">{formatPrice(order.totalAmount)}</span>
                           </div>
                        </div>
                        
                        {/* Shipping Address */}
                        {order.shippingAddress && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              Shipping Address
                            </h4>
                            <div className="text-sm text-gray-600">
                              <p>{order.shippingAddress.addressLine1}</p>
                              {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                              <p>
                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;