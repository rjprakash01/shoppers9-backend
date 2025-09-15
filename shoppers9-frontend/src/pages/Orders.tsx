import React, { useState, useEffect } from 'react';
import { Package, Calendar, MapPin, Eye, Truck, CheckCircle, Clock, XCircle, Filter, Search, RefreshCw, ShoppingBag, Star, ArrowLeft, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { orderService, type Order } from '../services/orders';
import { formatPrice } from '../utils/currency';
import { getImageUrl } from '../utils/imageUtils';
import { useNavigate, Link } from 'react-router-dom';

const Orders: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { cartCount } = useCart();
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
          return (b.finalAmount || b.totalAmount) - (a.finalAmount || a.totalAmount);
        case 'amount-low':
          return (a.finalAmount || a.totalAmount) - (b.finalAmount || b.totalAmount);
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
    <div className="min-h-screen" style={{backgroundColor: 'var(--light-grey)'}}>
      {/* Desktop Header */}
      <div className="hidden lg:block" style={{backgroundColor: 'var(--cta-dark-purple)', boxShadow: 'var(--premium-shadow)'}}>
        <div className="elite-container">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold" style={{fontFamily: 'Playfair Display, serif', color: 'var(--base-white)'}}>
              My Orders
            </h1>
            <button
              onClick={handleRefresh}
              className="p-2 transition-colors duration-200"
              style={{color: 'var(--base-white)', backgroundColor: 'transparent'}}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Orders Header - Clean */}
      <div className="lg:hidden p-4">
        <div className="bg-white" style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div className="p-4 flex items-center justify-between">
            <h1 className="text-xl font-bold" style={{
              fontFamily: 'Inter, sans-serif',
              color: '#1f2937'
            }}>My Orders</h1>
            
            {/* Mobile Cart Icon */}
            <Link to="/cart" className="relative p-2 rounded-lg transition-all duration-200" style={{
              backgroundColor: 'var(--cta-dark-purple)',
              color: 'white'
            }}>
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium" style={{
                  fontSize: '10px'
                }}>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      <div className="elite-container py-3 lg:py-6">
        {/* Search and Filters */}
        <div className="postcard-box p-2 lg:p-4 mb-3 lg:mb-6" style={{backgroundColor: 'var(--base-white)', boxShadow: 'var(--card-shadow)'}}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1.5 lg:top-2.5 h-3 lg:h-4 w-3 lg:w-4" style={{color: 'var(--medium-grey)'}} />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 lg:py-2 text-xs lg:text-sm border border-gray-300 focus:outline-none focus:border-purple-500 transition-colors"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  color: 'var(--charcoal-black)',
                  backgroundColor: 'var(--base-white)',
                  borderColor: 'var(--medium-grey)',
                  borderRadius: '6px'
                }}
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <Calendar className="absolute left-2 top-1.5 lg:top-2.5 h-3 lg:h-4 w-3 lg:w-4" style={{color: 'var(--medium-grey)'}} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 lg:py-2 text-xs lg:text-sm border border-gray-300 focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  color: 'var(--charcoal-black)',
                  backgroundColor: 'var(--base-white)',
                  borderColor: 'var(--medium-grey)',
                  borderRadius: '6px'
                }}
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
          <div className="postcard-box p-4 lg:p-6" style={{backgroundColor: 'var(--base-white)', boxShadow: 'var(--card-shadow)'}}>
            <div className="text-center py-4 lg:py-8">
              {orders.length === 0 ? (
                <>
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: 'var(--gold-highlight)'}}>
                    <ShoppingBag className="h-8 w-8 lg:h-10 lg:w-10" style={{color: 'var(--charcoal-black)'}} />
                  </div>
                  <h3 className="text-lg lg:text-xl font-bold mb-2" style={{fontFamily: 'Playfair Display, serif', color: 'var(--charcoal-black)'}}>No orders yet</h3>
                  <p className="text-sm lg:text-base mb-4" style={{fontFamily: 'Inter, sans-serif', color: 'var(--medium-grey)'}}>Start shopping to see your orders here</p>
                  <button
                    onClick={() => navigate('/products')}
                    className="px-4 py-2 font-semibold transition-colors duration-200"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      backgroundColor: 'var(--cta-dark-purple)',
                      color: 'var(--base-white)',
                      border: '1px solid var(--cta-dark-purple)',
                      borderRadius: '0px',
                      fontSize: '14px'
                    }}
                  >
                    Start Shopping
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: 'var(--cta-dark-purple)'}}>
                    <Search className="h-8 w-8 lg:h-10 lg:w-10" style={{color: 'var(--gold-highlight)'}} />
                  </div>
                  <h3 className="text-lg lg:text-xl font-bold mb-2" style={{fontFamily: 'Playfair Display, serif', color: 'var(--charcoal-black)'}}>No orders found</h3>
                  <p className="text-sm lg:text-base mb-4" style={{fontFamily: 'Inter, sans-serif', color: 'var(--medium-grey)'}}>Try adjusting your search or filter criteria</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="px-4 py-2 font-semibold transition-colors duration-200"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      backgroundColor: 'var(--gold-highlight)',
                      color: 'var(--charcoal-black)',
                      border: '1px solid var(--gold-highlight)',
                      borderRadius: '0px',
                      fontSize: '14px'
                    }}
                  >
                    Clear Filters
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
             {filteredOrders.map((order) => (
               <div key={order._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                 <div className="p-4 lg:p-6">
                   {/* Order Header */}
                   <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
                       <div className="flex items-center space-x-3 mb-3 lg:mb-0">
                         <div className="p-2 rounded-full bg-gray-100">
                           {getStatusIcon(order.orderStatus)}
                         </div>
                         <div className="flex-1">
                           <h3 className="text-sm lg:text-lg font-bold text-gray-900 mb-1">
                             Order #{(order.orderId || order._id || '').slice(-8).toUpperCase()}
                           </h3>
                           <div className="flex items-center space-x-1 text-xs lg:text-sm text-gray-500">
                             <Calendar className="h-3 lg:h-4 w-3 lg:w-4" />
                             <span>Placed on {formatDate(order.createdAt)}</span>
                           </div>
                         </div>
                       </div>
                       
                       {/* Desktop Layout */}
                       <div className="hidden lg:flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                         <span className={`px-3 py-1 text-xs lg:text-sm font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                            {(order.orderStatus || '').charAt(0).toUpperCase() + (order.orderStatus || '').slice(1)}
                         </span>
                         <button
                           onClick={() => handleViewOrder(order.orderId)}
                           className="flex items-center px-4 py-2 text-white text-xs lg:text-sm font-semibold rounded-lg transition-colors duration-200"
                           style={{
                             backgroundColor: 'var(--cta-dark-purple)',
                             borderRadius: '8px'
                           }}
                           onMouseEnter={(e) => e.target.style.backgroundColor = '#4c1d95'}
                           onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--cta-dark-purple)'}
                         >
                           <Eye className="h-3 lg:h-4 w-3 lg:w-4 mr-1" />
                           View Details
                         </button>
                       </div>
                       
                       {/* Mobile Layout - Status and Button on same line */}
                       <div className="lg:hidden flex items-center justify-between">
                         <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                            {(order.orderStatus || '').charAt(0).toUpperCase() + (order.orderStatus || '').slice(1)}
                         </span>
                         <button
                           onClick={() => handleViewOrder(order.orderId)}
                           className="flex items-center px-3 py-1 text-white text-xs font-semibold rounded-lg transition-colors duration-200"
                           style={{
                             backgroundColor: 'var(--cta-dark-purple)',
                             borderRadius: '6px'
                           }}
                           onMouseEnter={(e) => e.target.style.backgroundColor = '#4c1d95'}
                           onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--cta-dark-purple)'}
                         >
                           <Eye className="h-3 w-3 mr-1" />
                           View
                         </button>
                       </div>
                     </div>
                  
                  {/* Order Items Preview */}
                   <div className="pt-4 border-t border-gray-200">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                       <div>
                         <h4 className="text-xs lg:text-base font-semibold mb-2 lg:mb-3 flex items-center text-gray-900">
                           <Package className="h-3 lg:h-5 w-3 lg:w-5 mr-1 lg:mr-2 text-blue-600" />
                           Items ({order.items?.length || 0})
                         </h4>
                         <div className="space-y-3">
                           {(order.items || []).slice(0, 2).map((item, index) => {
                             // Find the variant for this order item
                             const variant = item.product?.variants?.find(v => v._id === item.variantId);
                             const imageUrl = variant?.images?.[0] || item.product?.images?.[0];
                             
                             return (
                               <div key={`${order._id}-item-${index}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                 {imageUrl && (
                                   <img
                                     src={getImageUrl(imageUrl)}
                                     alt={item.product?.name || 'Product'}
                                     className="w-10 lg:w-14 h-10 lg:h-14 object-cover rounded-lg"
                                   />
                                 )}
                                 <div className="flex-1 min-w-0">
                                   <p className="text-xs lg:text-sm font-semibold truncate text-gray-900">
                                    {item.product?.name || 'Product'}
                                  </p>
                                  <p className="text-xs" style={{fontFamily: 'Inter, sans-serif', color: 'var(--medium-grey)'}}>
                                    {variant?.color && `${variant.color} • `}Size: {item.size}
                                  </p>
                                  <p className="text-xs font-medium" style={{fontFamily: 'Inter, sans-serif', color: 'var(--charcoal-black)'}}>
                                    Qty: {item.quantity} × {formatPrice(item.price)}
                                  </p>
                                </div>
                              </div>
                             );
                           })}
                          {(order.items?.length || 0) > 2 && (
                            <div className="p-2 lg:p-3 text-center" style={{backgroundColor: 'var(--light-grey)', borderRadius: '0px'}}>
                              <p className="text-xs lg:text-sm font-medium" style={{fontFamily: 'Inter, sans-serif', color: 'var(--cta-dark-purple)'}}>+{(order.items?.length || 0) - 2} more items</p>
                            </div>
                          )}
                         </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm lg:text-base font-semibold mb-2 lg:mb-3 flex items-center" style={{fontFamily: 'Playfair Display, serif', color: 'var(--charcoal-black)'}}>
                          <Star className="h-4 lg:h-5 w-4 lg:w-5 mr-1 lg:mr-2" style={{color: 'var(--gold-highlight)'}} />
                          Order Summary
                        </h4>
                        <div className="p-3 lg:p-4" style={{
                          background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}>
                          <div className="space-y-3 lg:space-y-4">
                            <div className="flex justify-between items-center p-2 lg:p-3" style={{
                              backgroundColor: 'rgba(99,102,241,0.05)',
                              borderRadius: '8px',
                              border: '1px solid rgba(99,102,241,0.1)'
                            }}>
                              <span className="text-xs lg:text-sm font-semibold" style={{fontFamily: 'Inter, sans-serif', color: 'var(--cta-dark-purple)'}}>
                                 Total Amount
                               </span>
                              <span className="text-sm lg:text-lg font-bold" style={{fontFamily: 'Inter, sans-serif', color: 'var(--charcoal-black)'}}>{formatPrice(order.finalAmount || order.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs lg:text-sm font-medium" style={{fontFamily: 'Inter, sans-serif', color: 'var(--medium-grey)'}}>Payment Status</span>
                              <span className={`px-2 lg:px-3 py-1 lg:py-1.5 text-xs lg:text-sm font-semibold ${
                                order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`} style={{fontFamily: 'Inter, sans-serif', borderRadius: '6px'}}>
                                {(order.paymentStatus || 'pending').charAt(0).toUpperCase() + (order.paymentStatus || 'pending').slice(1)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs lg:text-sm font-medium" style={{fontFamily: 'Inter, sans-serif', color: 'var(--medium-grey)'}}>Delivery</span>
                              <span className="text-xs lg:text-sm font-semibold px-2 py-1" style={{
                                fontFamily: 'Inter, sans-serif',
                                color: 'var(--cta-dark-purple)',
                                backgroundColor: 'rgba(99,102,241,0.1)',
                                borderRadius: '6px'
                              }}>Free</span>
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