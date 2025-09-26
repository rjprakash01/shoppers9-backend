import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Edit, Plus, Trash2, Check, X, Camera, Settings, CreditCard, Bell, LogOut, ShoppingCart, ChevronDown, ArrowLeft, Package, Clock, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService, type Address } from '../services/auth';
import { orderService } from '../services/orders';
import { useLocation, useNavigate } from 'react-router-dom';

interface EditableUser {
  name: string;
  email: string;
}

interface AddressForm {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  isDefault: boolean;
}

const Profile: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [mobileCurrentPage, setMobileCurrentPage] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [profileForm, setProfileForm] = useState<EditableUser>({
    name: user?.name || '',
    email: user?.email || ''
  });

  const [addressForm, setAddressForm] = useState<AddressForm>({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    isDefault: false
  });

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Update profileForm when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const menuItems = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'logout', label: 'Logout', icon: LogOut, isAction: true },
  ];

  // Load addresses from user data
  useEffect(() => {
    if (user?.addresses) {
      setAddresses(user.addresses);
    }
  }, [user]);

  const validatePhoneNumber = (phone: string): boolean => {
    // Allow test phone number or valid Indian mobile numbers starting with 6-9
    return phone === '1234567890' || /^[6-9]\d{9}$/.test(phone);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    if (!validatePhoneNumber(addressForm.phone)) {
      alert('Please enter a valid 10-digit Indian mobile number starting with 6-9, or use 1234567890 for testing');
      return;
    }
    
    setIsLoading(true);

    try {
      const newAddress = await authService.addAddress(addressForm);
      setAddresses(prev => [...prev, newAddress]);
      setAddressForm({
        name: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        isDefault: false
      });
      setIsAddingAddress(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateAddress = async (addressId: string, e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    if (!validatePhoneNumber(addressForm.phone)) {
      alert('Please enter a valid 10-digit Indian mobile number starting with 6-9, or use 1234567890 for testing');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const updatedAddress = await authService.updateAddress(addressId, addressForm);
      setAddresses(prev => prev.map(addr => 
        addr.id === addressId ? updatedAddress : addr
      ));
      setEditingAddressId(null);
      setAddressForm({
        name: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        isDefault: false
      });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteAddress = async (addressId: string) => {
    // Validate addressId
    if (!addressId) {
      alert('Error: Cannot delete address. Invalid address ID.');
      return;
    }
    
    // Prevent deletion if already loading
    if (isLoading) {
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this address?');
    if (!confirmed) {
      return;
    }

    setIsLoading(true);
    
    try {
      await authService.deleteAddress(addressId);

      // Update local state only after successful API call
      setAddresses(prev => {
        const filtered = prev.filter(addr => addr.id !== addressId);
        return filtered;
      });
      
      // Refresh user data to keep context in sync
      try {
        const updatedUser = await authService.fetchCurrentUser();
        updateUser(updatedUser);
      } catch (refreshError) {
        // If refresh fails, we still have the local state updated
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete address. Please try again.';
      alert(errorMessage);
      
      // If deletion failed, refresh the addresses from user context to restore state
      if (user?.addresses) {
        setAddresses(user.addresses);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const startEditingAddress = (address: Address) => {
    setAddressForm({
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || '',
      isDefault: address.isDefault
    });
    setEditingAddressId(address.id);
  };
  
  const cancelEditing = () => {
    setEditingAddressId(null);
    setIsAddingAddress(false);
    setAddressForm({
      name: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      isDefault: false
    });
  };

  // Fetch user orders
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const response = await orderService.getOrders();
      console.log('Orders response:', response);
      setOrders(response.orders || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setOrdersError(error.message || 'Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fetch orders when orders tab is selected or mobile orders page is opened
  useEffect(() => {
    if (activeTab === 'orders' || mobileCurrentPage === 'orders') {
      console.log('Fetching orders for user:', user);
      console.log('User ID:', user?.id || user?._id);
      fetchOrders();
    }
  }, [activeTab, mobileCurrentPage, user]);

  const handleLogoutConfirm = () => {
    logout();
    // Stay on the same page after logout
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updatedUser = await authService.updateProfile(profileForm);
      updateUser(updatedUser);
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelProfileEdit = () => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || ''
    });
    setIsEditingProfile(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Menu View */}
      <div className="lg:hidden min-h-screen bg-gray-50">
        {!mobileCurrentPage ? (
          <div className="p-2">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-3">
                <h1 className="text-lg font-semibold mb-3 text-black" style={{
                  fontFamily: 'Inter, sans-serif'
                }}>My Profile</h1>
                
                {/* Mobile Profile Header */}
                <div className="mb-3 p-2 bg-black rounded-lg">
                  <div className="text-center">
                    <div className="relative inline-block mb-2">
                      <div className="w-12 h-12 flex items-center justify-center mx-auto bg-gray-800 rounded-lg">
                        <User className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1" style={{
                      fontFamily: 'Inter, sans-serif'
                    }}>{user.name || 'User'}</h3>
                    <p className="text-gray-300 text-sm" style={{
                      fontFamily: 'Inter, sans-serif'
                    }}>{user.email}</p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    if (item.isAction) {
                      return (
                        <button
                          key={item.id}
                          onClick={() => setShowLogoutConfirm(true)}
                          className="w-full flex items-center space-x-3 px-3 py-2 text-left font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            color: '#dc2626'
                          }}
                        >
                          <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-100">
                            <Icon className="h-4 w-4 text-red-600" />
                          </div>
                          <span className="text-sm">{item.label}</span>
                        </button>
                      );
                    }
                    return (
                      <button
                        key={item.id}
                        onClick={() => setMobileCurrentPage(item.id)}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-left font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          color: '#374151'
                        }}
                      >
                        <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-100">
                          <Icon className="h-4 w-4 text-gray-600" />
                        </div>
                        <span className="text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                  

                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            {mobileCurrentPage === 'profile' && (
              <div className="bg-white" style={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <div className="px-4 py-3 bg-gray-100" style={{
                  borderRadius: '24px 24px 0 0'
                }}>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setMobileCurrentPage(null)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-300"
                    >
                      <ArrowLeft className="h-3 w-3 text-gray-700" />
                    </button>
                    <div>
                      <h2 className="text-base font-bold text-black" style={{
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '-0.025em'
                      }}>Profile Information</h2>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <div className="space-y-1.5">
                    <div className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center bg-gray-300">
                          <User className="h-2.5 w-2.5 text-gray-700" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-600" style={{
                            fontFamily: 'Inter, sans-serif'
                          }}>Full Name</p>
                          <p className="text-xs font-semibold text-black" style={{
                            fontFamily: 'Inter, sans-serif'
                          }}>{user.name || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center bg-gray-300">
                          <Mail className="h-2.5 w-2.5 text-gray-700" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-600" style={{
                            fontFamily: 'Inter, sans-serif'
                          }}>Email Address</p>
                          <p className="text-xs font-semibold text-black" style={{
                            fontFamily: 'Inter, sans-serif'
                          }}>{user.email || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center bg-gray-300">
                          <Phone className="h-2.5 w-2.5 text-gray-700" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-600" style={{
                            fontFamily: 'Inter, sans-serif'
                          }}>Mobile Number</p>
                          <p className="text-xs font-semibold text-black" style={{
                            fontFamily: 'Inter, sans-serif'
                          }}>+91 {user.phone || '1234567890'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {mobileCurrentPage === 'orders' && (
              <div className="bg-white" style={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <div className="px-3 py-2 bg-gray-100 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setMobileCurrentPage(null)}
                      className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-300"
                    >
                      <ArrowLeft className="h-4 w-4 text-gray-700" />
                    </button>
                    <div>
                      <h2 className="text-base font-bold text-black" style={{
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '-0.025em'
                      }}>My Orders</h2>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  {ordersLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                      <p className="text-gray-600" style={{fontFamily: 'Inter, sans-serif'}}>Loading your orders...</p>
                    </div>
                  ) : ordersError ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-gray-100 rounded-lg border border-gray-200">
                        <X className="h-8 w-8 text-black" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{fontFamily: 'Inter, sans-serif'}}>Error Loading Orders</h3>
                      <p className="text-gray-600 mb-6" style={{fontFamily: 'Inter, sans-serif'}}>{ordersError}</p>
                      <button 
                        onClick={fetchOrders}
                        className="px-6 py-3 font-medium bg-black text-white rounded-lg" style={{
                          fontFamily: 'Inter, sans-serif'
                        }}>
                        Try Again
                      </button>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-gray-100 rounded-lg border border-gray-200">
                        <ShoppingCart className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{fontFamily: 'Inter, sans-serif'}}>No Orders Yet</h3>
                      <p className="text-gray-600 mb-6" style={{fontFamily: 'Inter, sans-serif'}}>Start shopping to see your orders here</p>
                      <button 
                        onClick={() => navigate('/products')}
                        className="px-6 py-3 font-medium bg-black text-white rounded-xl" style={{
                          fontFamily: 'Inter, sans-serif'
                        }}>
                        Browse Products
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {orders.map((order) => (
                        <div key={order._id} className="border border-gray-200 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-black">
                                {order.orderStatus === 'delivered' ? <Package className="h-2.5 w-2.5 text-white" /> :
                                 order.orderStatus === 'shipped' ? <Truck className="h-2.5 w-2.5 text-white" /> :
                                 order.orderStatus === 'cancelled' ? <X className="h-2.5 w-2.5 text-white" /> :
                                 <Clock className="h-2.5 w-2.5 text-white" />}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 text-sm" style={{fontFamily: 'Inter, sans-serif'}}>
                                  Order #{(order.orderNumber || order._id || '').slice(-8).toUpperCase()}
                                </h4>
                                <p className="text-xs text-gray-600" style={{fontFamily: 'Inter, sans-serif'}}>
                                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900 text-sm" style={{fontFamily: 'Inter, sans-serif'}}>
                                ₹{(order.finalAmount || order.totalAmount || 0).toLocaleString()}
                              </p>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`} style={{fontFamily: 'Inter, sans-serif'}}>
                                {order.orderStatus?.charAt(0).toUpperCase() + order.orderStatus?.slice(1) || 'Pending'}
                              </span>
                            </div>
                          </div>
                          
                          {order.items && order.items.length > 0 && (
                            <div className="border-t pt-1.5 mt-1.5">
                              <p className="text-xs text-gray-600 mb-1.5" style={{fontFamily: 'Inter, sans-serif'}}>
                                {order.items.length} item{order.items.length > 1 ? 's' : ''}
                              </p>
                              <div className="flex space-x-0.5">
                                {order.items.slice(0, 4).map((item: any, index: number) => (
                                  <div key={index} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                    {item.productData?.images?.[0] ? (
                                      <img 
                                        src={item.productData.images[0]} 
                                        alt={item.productData?.name || 'Product'}
                                        className="w-full h-full object-cover rounded-lg"
                                      />
                                    ) : (
                                      <Package className="h-4 w-4 text-gray-400" />
                                    )}
                                  </div>
                                ))}
                                {order.items.length > 4 && (
                                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <span className="text-xs text-gray-600" style={{fontFamily: 'Inter, sans-serif'}}>+{order.items.length - 4}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center mt-2 pt-1.5 border-t">
                            <button 
                              onClick={() => navigate(`/orders/${order.orderNumber || order._id}`)}
                              className="text-black hover:text-gray-700 font-medium text-xs" style={{fontFamily: 'Inter, sans-serif'}}
                            >
                              View Details
                            </button>
                            {order.orderStatus === 'delivered' && (
                              <button className="text-gray-600 hover:text-gray-700 font-medium text-xs" style={{fontFamily: 'Inter, sans-serif'}}>
                                Reorder
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {mobileCurrentPage === 'addresses' && (
              <div className="bg-white" style={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <div className="px-4 py-3 bg-gray-100" style={{
                  borderRadius: '24px 24px 0 0'
                }}>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setMobileCurrentPage(null)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-300"
                    >
                      <ArrowLeft className="h-4 w-4 text-gray-700" />
                    </button>
                    <div>
                      <h2 className="text-base font-bold text-black" style={{
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '-0.025em'
                      }}>Saved Addresses</h2>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  {addresses.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3" style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <MapPin className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1" style={{fontFamily: 'Inter, sans-serif'}}>No Addresses Saved</h3>
                      <p className="text-sm text-gray-600 mb-4" style={{fontFamily: 'Inter, sans-serif'}}>Add an address to get started</p>
                      <button 
                        onClick={() => setIsAddingAddress(true)}
                        className="px-4 py-2 font-medium text-sm" style={{
                        fontFamily: 'Inter, sans-serif',
                        background: 'linear-gradient(135deg, var(--cta-dark-purple) 0%, #6366f1 100%)',
                        color: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(99,102,241,0.2)'
                      }}>
                        Add Address
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((address) => (
                        <div key={address.id} className="p-3" style={{
                          background: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center mt-0.5 bg-gray-200">
                                <MapPin className="h-3 w-3 text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900" style={{fontFamily: 'Inter, sans-serif'}}>{address.name}</p>
                                <p className="text-xs text-gray-600" style={{fontFamily: 'Inter, sans-serif'}}>{address.phone}</p>
                                <p className="text-xs text-gray-900 mt-1" style={{fontFamily: 'Inter, sans-serif'}}>{address.addressLine1}</p>
                                {address.addressLine2 && (
                                  <p className="text-xs text-gray-900" style={{fontFamily: 'Inter, sans-serif'}}>{address.addressLine2}</p>
                                )}
                                <p className="text-xs text-gray-600" style={{fontFamily: 'Inter, sans-serif'}}>
                                  {address.city}, {address.state} {address.pincode}
                                </p>
                                {address.landmark && (
                                  <p className="text-xs text-gray-600" style={{fontFamily: 'Inter, sans-serif'}}>Landmark: {address.landmark}</p>
                                )}
                                {address.isDefault && (
                                  <span className="inline-block text-xs px-2 py-0.5 rounded-full mt-1 bg-black text-white" style={{
                                    fontFamily: 'Inter, sans-serif'
                                  }}>
                                    Default
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => setIsAddingAddress(true)}
                        className="w-full px-4 py-2 font-medium text-sm" style={{
                        fontFamily: 'Inter, sans-serif',
                        background: 'linear-gradient(135deg, var(--cta-dark-purple) 0%, #6366f1 100%)',
                        color: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(99,102,241,0.2)'
                      }}>
                        Add New Address
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            

            
            {mobileCurrentPage === 'notifications' && (
              <div className="bg-white overflow-hidden" style={{
                borderRadius: '24px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 8px 25px rgba(0,0,0,0.06)',
                border: '1px solid rgba(255,255,255,0.8)',
                backdropFilter: 'blur(20px)'
              }}>
                <div className="px-4 py-3 bg-gray-100" style={{
                  borderRadius: '24px 24px 0 0'
                }}>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setMobileCurrentPage(null)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-300"
                    >
                      <ArrowLeft className="h-4 w-4 text-gray-700" />
                    </button>
                    <div>
                      <h2 className="text-base font-bold text-black" style={{
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '-0.025em'
                      }}>Notifications</h2>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-5 h-5 rounded-md flex items-center justify-center mr-2 bg-gray-300">
                            <Bell className="h-2.5 w-2.5 text-gray-700" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900" style={{fontFamily: 'Inter, sans-serif'}}>Email Notifications</h3>
                            <p className="text-xs text-gray-600" style={{fontFamily: 'Inter, sans-serif'}}>Order updates via email</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 peer-checked:bg-black"></div>
                        </label>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-5 h-5 rounded-md flex items-center justify-center mr-2 bg-gray-300">
                            <Bell className="h-2.5 w-2.5 text-gray-700" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900" style={{fontFamily: 'Inter, sans-serif'}}>SMS Notifications</h3>
                            <p className="text-xs text-gray-600" style={{fontFamily: 'Inter, sans-serif'}}>Order updates via SMS</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 peer-checked:bg-black"></div>
                        </label>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-5 h-5 rounded-md flex items-center justify-center mr-2 bg-gray-300">
                            <Bell className="h-2.5 w-2.5 text-gray-700" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900" style={{fontFamily: 'Inter, sans-serif'}}>Marketing</h3>
                            <p className="text-xs text-gray-600" style={{fontFamily: 'Inter, sans-serif'}}>Promotional offers</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 peer-checked:bg-black"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen bg-gray-50">
        <div className="elite-container py-4">
          <div className="lg:grid lg:grid-cols-12 lg:gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-4">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                {/* Profile Header */}
                <div className="px-4 py-4 text-center bg-gray-100 border-b border-gray-200">
                  <div className="relative inline-block">
                    <div className="w-12 h-12 flex items-center justify-center mx-auto mb-2 bg-gray-300 rounded-full">
                      <User className="h-6 w-6 text-gray-700" />
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-black mb-1" style={{
                    fontFamily: 'Inter, sans-serif'
                  }}>{user.name || 'User'}</h3>
                  <p className="text-gray-600 text-sm" style={{
                    fontFamily: 'Inter, sans-serif'
                  }}>{user.email}</p>
                </div>

                {/* Navigation Menu */}
                <nav className="p-4">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    if (item.isAction) {
                      return (
                        <button
                          key={item.id}
                          onClick={() => setShowLogoutConfirm(true)}
                          className="w-full flex items-center space-x-3 px-3 py-2 text-left text-sm font-medium mb-1 rounded-lg text-red-600 hover:bg-red-50"
                          style={{
                            fontFamily: 'Inter, sans-serif'
                          }}
                        >
                          <div className="w-6 h-6 rounded flex items-center justify-center bg-red-100">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{item.label}</span>
                        </button>
                      );
                    }
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-left text-sm font-medium mb-1 rounded-lg ${
                          activeTab === item.id 
                            ? 'bg-black text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        style={{
                          fontFamily: 'Inter, sans-serif'
                        }}
                      >
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${
                          activeTab === item.id 
                            ? 'bg-gray-800'
                            : 'bg-gray-200'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                  

                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-8">
              {activeTab === 'profile' && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gray-300">
                          <User className="h-3 w-3 text-gray-700" />
                        </div>
                        <div>
                          <h2 className="text-base font-semibold text-black" style={{
                            fontFamily: 'Inter, sans-serif'
                          }}>Profile Information</h2>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="flex items-center px-3 py-2 bg-white text-black font-medium text-sm rounded-lg hover:bg-gray-100"
                        style={{
                          fontFamily: 'Inter, sans-serif'
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    {isEditingProfile ? (
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2" style={{
                              fontFamily: 'Inter, sans-serif'
                            }}>Full Name</label>
                            <input
                              type="text"
                              value={profileForm.name}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              style={{
                                fontFamily: 'Inter, sans-serif'
                              }}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2" style={{
                              fontFamily: 'Inter, sans-serif'
                            }}>Email Address</label>
                            <input
                              type="email"
                              value={profileForm.email}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              style={{
                                fontFamily: 'Inter, sans-serif'
                              }}
                              required
                            />
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300"
                            style={{
                              fontFamily: 'Inter, sans-serif'
                            }}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            {isLoading ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelProfileEdit}
                            className="flex items-center bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                            style={{
                              fontFamily: 'Inter, sans-serif'
                            }}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-black">
                              <User className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-1 text-gray-600" style={{
                                fontFamily: 'Inter, sans-serif'
                              }}>Full Name</p>
                              <p className="text-base font-semibold text-black" style={{
                                fontFamily: 'Inter, sans-serif'
                              }}>{user.name || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black">
                              <Mail className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-1 text-gray-600" style={{
                                fontFamily: 'Inter, sans-serif'
                              }}>Email Address</p>
                              <p className="text-base font-semibold text-black" style={{
                                fontFamily: 'Inter, sans-serif'
                              }}>{user.email || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-3 md:col-span-2" style={{
                          background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }}>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            }}>
                              <Phone className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-1" style={{
                                fontFamily: 'Inter, sans-serif',
                                color: '#64748b'
                              }}>Mobile Number</p>
                              <p className="text-base font-semibold" style={{
                                fontFamily: 'Inter, sans-serif',
                                color: '#1e293b'
                              }}>+91 {user.phone || '1234567890'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gray-300">
                        <ShoppingCart className="h-3 w-3 text-gray-700" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-black" style={{
                          fontFamily: 'Inter, sans-serif'
                        }}>My Orders</h2>
                        <p className="text-gray-600 text-sm" style={{fontFamily: 'Inter, sans-serif'}}>Track your order history</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    {ordersLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                        <p className="text-gray-600" style={{fontFamily: 'Inter, sans-serif'}}>Loading your orders...</p>
                      </div>
                    ) : ordersError ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 flex items-center justify-center mx-auto mb-4 bg-gray-100 rounded-lg border border-gray-200">
                          <X className="h-6 w-6 text-red-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{fontFamily: 'Inter, sans-serif'}}>Error Loading Orders</h3>
                        <p className="text-gray-600 mb-6" style={{fontFamily: 'Inter, sans-serif'}}>{ordersError}</p>
                        <button 
                          onClick={fetchOrders}
                          className="px-4 py-2 font-medium bg-black text-white rounded-lg hover:bg-gray-800" style={{
                            fontFamily: 'Inter, sans-serif'
                          }}>
                          Try Again
                        </button>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 flex items-center justify-center mx-auto mb-4 bg-gray-100 rounded-lg border border-gray-200">
                          <ShoppingCart className="h-6 w-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{fontFamily: 'Inter, sans-serif'}}>No Orders Yet</h3>
                        <p className="text-gray-600 mb-6" style={{fontFamily: 'Inter, sans-serif'}}>Start shopping to see your orders here</p>
                        <button 
                          onClick={() => navigate('/products')}
                          className="px-4 py-2 font-medium bg-black text-white rounded-lg hover:bg-gray-800" style={{
                            fontFamily: 'Inter, sans-serif'
                          }}>
                          Browse Products
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((order) => (
                          <div key={order._id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-black">
                                  {order.orderStatus === 'delivered' ? <Package className="h-3 w-3 text-white" /> :
                                   order.orderStatus === 'shipped' ? <Truck className="h-3 w-3 text-white" /> :
                                   order.orderStatus === 'cancelled' ? <X className="h-3 w-3 text-white" /> :
                                   <Clock className="h-3 w-3 text-white" />}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900" style={{fontFamily: 'Inter, sans-serif'}}>
                                    Order #{(order.orderNumber || order._id || '').slice(-8).toUpperCase()}
                                  </h4>
                                  <p className="text-sm text-gray-600" style={{fontFamily: 'Inter, sans-serif'}}>
                                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900" style={{fontFamily: 'Inter, sans-serif'}}>
                                  ₹{(order.finalAmount || order.totalAmount || 0).toLocaleString()}
                                </p>
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                                  order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                  order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`} style={{fontFamily: 'Inter, sans-serif'}}>
                                  {order.orderStatus?.charAt(0).toUpperCase() + order.orderStatus?.slice(1) || 'Pending'}
                                </span>
                              </div>
                            </div>
                            
                            {order.items && order.items.length > 0 && (
                              <div className="border-t pt-3">
                                <p className="text-sm text-gray-600 mb-2" style={{fontFamily: 'Inter, sans-serif'}}>
                                  {order.items.length} item{order.items.length > 1 ? 's' : ''}
                                </p>
                                <div className="flex space-x-2">
                                  {order.items.slice(0, 3).map((item: any, index: number) => (
                                    <div key={index} className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                      {item.productData?.images?.[0] ? (
                                        <img 
                                          src={item.productData.images[0]} 
                                          alt={item.productData?.name || 'Product'}
                                          className="w-full h-full object-cover rounded-lg"
                                        />
                                      ) : (
                                        <Package className="h-6 w-6 text-gray-400" />
                                      )}
                                    </div>
                                  ))}
                                  {order.items.length > 3 && (
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                      <span className="text-xs text-gray-600" style={{fontFamily: 'Inter, sans-serif'}}>+{order.items.length - 3}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center mt-4 pt-3 border-t">
                              <button 
                                onClick={() => navigate(`/orders/${order.orderNumber || order._id}`)}
                                className="text-black hover:text-gray-700 font-medium text-sm" style={{fontFamily: 'Inter, sans-serif'}}
                              >
                                View Details
                              </button>
                              {order.orderStatus === 'delivered' && (
                                <button className="text-gray-600 hover:text-gray-700 font-medium text-sm" style={{fontFamily: 'Inter, sans-serif'}}>
                                  Reorder
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'addresses' && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="px-6 py-4 bg-gray-100 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gray-300">
                          <MapPin className="h-3 w-3 text-gray-700" />
                        </div>
                        <div>
                          <h2 className="text-base font-semibold text-black" style={{
                            fontFamily: 'Inter, sans-serif'
                          }}>Saved Addresses</h2>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsAddingAddress(true)}
                        className="flex items-center px-3 py-2 bg-white text-black font-medium text-sm rounded-lg hover:bg-gray-100"
                        style={{
                          fontFamily: 'Inter, sans-serif'
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Address
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    {/* Add Address Form */}
                    {isAddingAddress && (
                      <form onSubmit={handleAddAddress} className="mb-6 p-4 border border-gray-200 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Address</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              value={addressForm?.name || ''}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Enter full name"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              value={addressForm?.phone || ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                if (value.length <= 10) {
                                  setAddressForm(prev => ({ ...prev, phone: value }));
                                }
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Enter 10-digit phone number"
                              maxLength={10}
                              required
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Address Line 1 *
                            </label>
                            <input
                              type="text"
                              value={addressForm?.addressLine1 || ''}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine1: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="House/Flat/Block No., Building Name"
                              required
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Address Line 2
                            </label>
                            <input
                              type="text"
                              value={addressForm?.addressLine2 || ''}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Street Name, Area, Colony (Optional)"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City *
                            </label>
                            <input
                              type="text"
                              value={addressForm?.city || ''}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Enter city"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              State *
                            </label>
                            <input
                              type="text"
                              value={addressForm?.state || ''}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Enter state"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              PIN Code *
                            </label>
                            <input
                              type="text"
                              value={addressForm?.pincode || ''}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, pincode: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Enter PIN code"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Landmark
                            </label>
                            <input
                              type="text"
                              value={addressForm?.landmark || ''}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, landmark: e.target.value }))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Nearby landmark (Optional)"
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={addressForm.isDefault}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">Set as default address</span>
                            </label>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3 mt-4">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {isLoading ? 'Adding...' : 'Add Address'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="flex items-center bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                    
                    {/* Address List */}
                    <div className="space-y-4">
                      {addresses.length === 0 ? (
                        <div className="text-center py-8">
                          <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                          <p className="text-gray-500">No addresses saved yet</p>
                          <p className="text-sm text-gray-400">Add an address to get started</p>
                        </div>
                      ) : (
                        addresses.map((address) => (
                          <div key={address.id} className="p-4" style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
                          }}>
                            {editingAddressId === address.id ? (
                              <form onSubmit={(e) => handleUpdateAddress(address.id, e)}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1" style={{fontFamily: 'Inter, sans-serif'}}>
                                      Full Name *
                                    </label>
                                    <input
                                      type="text"
                                      value={addressForm?.name || ''}
                                      onChange={(e) => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                                      style={{fontFamily: 'Inter, sans-serif'}}
                                      required
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Phone Number *
                                    </label>
                                    <input
                                      type="tel"
                                      value={addressForm?.phone || ''}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                        if (value.length <= 10) {
                                          setAddressForm(prev => ({ ...prev, phone: value }));
                                        }
                                      }}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                      placeholder="Enter 10-digit phone number"
                                      maxLength={10}
                                      required
                                    />
                                  </div>
                                  
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Address Line 1 *
                                    </label>
                                    <input
                                      type="text"
                                      value={addressForm?.addressLine1 || ''}
                                      onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine1: e.target.value }))}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                      required
                                    />
                                  </div>
                                  
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Address Line 2
                                    </label>
                                    <input
                                      type="text"
                                      value={addressForm?.addressLine2 || ''}
                                      onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      City *
                                    </label>
                                    <input
                                      type="text"
                                      value={addressForm?.city || ''}
                                      onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                      required
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      State *
                                    </label>
                                    <input
                                      type="text"
                                      value={addressForm?.state || ''}
                                      onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                      required
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      PIN Code *
                                    </label>
                                    <input
                                      type="text"
                                      value={addressForm?.pincode || ''}
                                      onChange={(e) => setAddressForm(prev => ({ ...prev, pincode: e.target.value }))}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                      required
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Landmark
                                    </label>
                                    <input
                                      type="text"
                                      value={addressForm?.landmark || ''}
                                      onChange={(e) => setAddressForm(prev => ({ ...prev, landmark: e.target.value }))}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                  </div>
                                  
                                  <div className="md:col-span-2">
                                    <label className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={addressForm.isDefault}
                                        onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                                        className="mr-2"
                                      />
                                      <span className="text-sm text-gray-700">Set as default address</span>
                                    </label>
                                  </div>
                                </div>
                                
                                <div className="flex space-x-3 mt-4">
                                  <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    {isLoading ? 'Updating...' : 'Update'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditing}
                                    className="flex items-center bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <>
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start">
                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center mr-2 mt-0.5 bg-gray-200">
                                      <MapPin className="h-3 w-3 text-gray-600" />
                                    </div>
                                    <div>
                                      <p className="text-gray-900 font-medium text-sm" style={{fontFamily: 'Inter, sans-serif'}}>{address.name}</p>
                                      <p className="text-gray-600 text-xs" style={{fontFamily: 'Inter, sans-serif'}}>{address.phone}</p>
                                      <p className="text-gray-900 text-xs mt-1" style={{fontFamily: 'Inter, sans-serif'}}>{address.addressLine1}</p>
                                      {address.addressLine2 && (
                                        <p className="text-gray-900 text-xs" style={{fontFamily: 'Inter, sans-serif'}}>{address.addressLine2}</p>
                                      )}
                                      <p className="text-gray-600 text-xs" style={{fontFamily: 'Inter, sans-serif'}}>
                                        {address.city}, {address.state} {address.pincode}
                                      </p>
                                      {address.landmark && (
                                        <p className="text-gray-600 text-xs" style={{fontFamily: 'Inter, sans-serif'}}>Landmark: {address.landmark}</p>
                                      )}
                                      {address.isDefault && (
                                        <span className="inline-block text-xs px-2 py-0.5 rounded-full mt-1 bg-black text-white" style={{
                                          fontFamily: 'Inter, sans-serif'
                                        }}>
                                          Default
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() => startEditingAddress(address)}
                                      className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleDeleteAddress(address.id || address._id);
                                      }}
                                      className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}



              {activeTab === 'notifications' && (
                <div className="bg-white overflow-hidden" style={{
                  borderRadius: '24px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 8px 25px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(20px)'
                }}>
                  <div className="px-4 py-3 bg-gray-100" style={{
                    borderRadius: '24px 24px 0 0'
                  }}>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-300">
                        <Bell className="h-3 w-3 text-gray-700" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-black" style={{
                          fontFamily: 'Inter, sans-serif'
                        }}>Notification Preferences</h2>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-5 h-5 rounded-md flex items-center justify-center mr-2 bg-gray-300">
                              <Bell className="h-2.5 w-2.5 text-gray-700" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900" style={{fontFamily: 'Inter, sans-serif'}}>Email Notifications</h3>
                              <p className="text-xs text-gray-600" style={{fontFamily: 'Inter, sans-serif'}}>Receive order updates and promotions via email</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 peer-checked:bg-green-600"></div>
                          </label>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-5 h-5 rounded-md flex items-center justify-center mr-2 bg-gray-300">
                              <Bell className="h-2.5 w-2.5 text-gray-700" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900" style={{fontFamily: 'Inter, sans-serif'}}>SMS Notifications</h3>
                              <p className="text-xs text-gray-600" style={{fontFamily: 'Inter, sans-serif'}}>Get order updates via SMS</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 peer-checked:bg-black"></div>
                          </label>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-5 h-5 rounded-md flex items-center justify-center mr-2 bg-gray-300">
                              <Bell className="h-2.5 w-2.5 text-gray-700" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900" style={{fontFamily: 'Inter, sans-serif'}}>Marketing Communications</h3>
                              <p className="text-xs text-gray-600" style={{fontFamily: 'Inter, sans-serif'}}>Promotional offers and new product updates</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 peer-checked:bg-black"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-3 w-full max-w-xs border border-gray-200 rounded-lg shadow-sm">
            <div className="text-center">
              <div className="w-10 h-10 flex items-center justify-center mx-auto mb-2 bg-gray-100 rounded-lg">
                <LogOut className="h-5 w-5 text-gray-600" />
              </div>
              <h3 className="text-sm font-semibold mb-1" style={{
                fontFamily: 'Inter, sans-serif',
                color: '#1e293b'
              }}>Logout Confirmation</h3>
              <p className="text-xs mb-3" style={{
                fontFamily: 'Inter, sans-serif',
                color: '#64748b'
              }}>Are you sure you want to logout?</p>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-3 py-1.5 font-medium text-xs bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200"
                  style={{
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="flex-1 px-3 py-1.5 font-medium text-xs bg-black text-white border border-black rounded-lg hover:bg-gray-800"
                  style={{
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;