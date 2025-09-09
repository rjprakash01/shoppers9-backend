import React, { useState, useEffect } from 'react';
import { Package, Calendar, MapPin, Eye, Truck, CheckCircle, Clock, XCircle, Filter, Search, RefreshCw, ShoppingBag, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { orderService, type Order } from '../services/orders';
import { formatPrice } from '../utils/currency';
import { getImageUrl } from '../utils/imageUtils';
import { useNavigate } from 'react-router-dom';

const Orders: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
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

  // Filter and sort orders
  useEffect(() => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.orderStatus.toLowerCase() === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items?.some(item => 
          item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort orders
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount-high':
          return b.totalAmount - a.totalAmount;
        case 'amount-low':
          return a.totalAmount - b.totalAmount;
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchTerm, sortBy]);

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const response = await orderService.getOrders();
      setOrders(response.orders);
    } catch (err) {
      console.error('Failed to refresh orders:', err);
      setError('Failed to refresh orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
          <p className="mt-6 text-gray-600 text-lg font-medium">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-white to-brand-slate/5">
      {/* Header */}
      <div className="bg-brand-indigo shadow-sm border-b border-brand-gold/20">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold font-playfair text-brand-gold">
              My Orders
            </h1>
            <button
              onClick={handleRefresh}
              className="p-2 text-brand-gold hover:text-white transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-brand-gold/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white appearance-none"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <Calendar className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white appearance-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount-high">Highest Amount</option>
                <option value="amount-low">Lowest Amount</option>
              </select>
            </div>
          </div>
        </div>
        
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-brand-gold/20">
            <div className="text-center py-12">
              {orders.length === 0 ? (
                <>
                  <div className="w-20 h-20 bg-brand-gold rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="h-10 w-10 text-brand-indigo" />
                  </div>
                  <h3 className="text-2xl font-bold font-playfair text-brand-indigo mb-2">No orders yet</h3>
                  <p className="text-brand-indigo/70 font-poppins mb-8">Start shopping to see your orders here</p>
                  <button
                    onClick={() => navigate('/products')}
                    className="bg-brand-gold text-brand-indigo px-8 py-3 rounded-xl font-semibold font-poppins hover:bg-white hover:text-brand-indigo border border-brand-gold transition-all duration-300"
                  >
                    Start Shopping
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-brand-indigo rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="h-10 w-10 text-brand-gold" />
                  </div>
                  <h3 className="text-2xl font-bold font-playfair text-brand-indigo mb-2">No orders found</h3>
                  <p className="text-brand-indigo/70 font-poppins mb-8">Try adjusting your search or filter criteria</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="bg-brand-gold text-brand-indigo px-8 py-3 rounded-xl font-semibold font-poppins hover:bg-white hover:text-brand-indigo border border-brand-gold transition-all duration-300"
                  >
                    Clear Filters
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
             {filteredOrders.map((order) => (
               <div key={order._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                 <div className="p-6">
                   {/* Order Header */}
                   <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
                     <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                       <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-3 rounded-xl">
                         {getStatusIcon(order.orderStatus)}
                       </div>
                       <div>
                         <h3 className="text-xl font-bold text-gray-900">
                           Order #{(order.orderId || order._id || '').slice(-8).toUpperCase()}
                         </h3>
                         <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                           <Calendar className="h-4 w-4" />
                           <span>Placed on {formatDate(order.createdAt)}</span>
                         </div>
                       </div>
                     </div>
                     
                     <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                       <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${getStatusColor(order.orderStatus)} shadow-sm`}>
                          {(order.orderStatus || '').charAt(0).toUpperCase() + (order.orderStatus || '').slice(1)}
                       </span>
                       <button
                         onClick={() => handleViewOrder(order.orderId)}
                         className="flex items-center bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                       >
                         <Eye className="h-4 w-4 mr-2" />
                         View Details
                       </button>
                     </div>
                   </div>
                  
                  {/* Order Items Preview */}
                   <div className="border-t border-gray-100 pt-6">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                       <div>
                         <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                           <Package className="h-5 w-5 mr-2 text-purple-600" />
                           Items ({order.items?.length || 0})
                         </h4>
                         <div className="space-y-3">
                           {(order.items || []).slice(0, 2).map((item, index) => (
                             <div key={`${order._id}-item-${index}`} className="flex items-center space-x-4 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl">
                               {item.product?.images?.[0] && (
                                 <img
                                   src={getImageUrl(item.product.images[0])}
                                   alt={item.product.name}
                                   className="w-16 h-16 object-cover rounded-xl shadow-md"
                                 />
                               )}
                               <div className="flex-1 min-w-0">
                                 <p className="text-sm font-semibold text-gray-900 truncate">
                                  {item.product?.name || 'Product'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Qty: {item.quantity} × {formatPrice(item.price)}
                                </p>
                              </div>
                            </div>
                          ))}
                          {(order.items?.length || 0) > 2 && (
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-xl text-center">
                              <p className="text-sm text-purple-600 font-medium">+{(order.items?.length || 0) - 2} more items</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Star className="h-5 w-5 mr-2 text-yellow-500" />
                          Order Summary
                        </h4>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 font-medium">Total Amount</span>
                              <span className="text-2xl font-bold text-gray-900">{formatPrice(order.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 font-medium">Payment Status</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {(order.paymentStatus || 'pending').charAt(0).toUpperCase() + (order.paymentStatus || 'pending').slice(1)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 font-medium">Delivery</span>
                              <span className="text-green-600 font-semibold">Free</span>
                            </div>
                          </div>
                        </div>
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