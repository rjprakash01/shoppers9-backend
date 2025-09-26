import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Lock,
  Unlock,
  Bell,
  Download,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  RotateCcw,
  MapPin,
  CreditCard,
  User,
  Activity,
  DollarSign,
  TrendingUp,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Settings as SettingsIcon
} from 'lucide-react';

interface CustomerProfile {
  _id: string;
  name: string;
  customerId: string;
  phone: string;
  email?: string;
  dateOfRegistration: string;
  totalSpends: number;
  totalOrders: number;
  totalReturns: number;
  lastLogin?: string;
  lastOrderDate?: string;
  savedAddresses: Address[];
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    newsletter: boolean;
    offers: boolean;
  };
  accountStatus: 'active' | 'blocked' | 'inactive';
  isVerified: boolean;
  averageOrderValue: number;
  returnPercentage: number;
  paymentMethods: PaymentMethod[];
  orderHistory: Order[];
  returnHistory: Return[];
  loginHistory: LoginRecord[];
}

interface Address {
  _id: string;
  name: string;
  type: 'home' | 'office' | 'other';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface PaymentMethod {
  type: 'card' | 'upi' | 'netbanking' | 'wallet' | 'cod';
  lastUsed: string;
  frequency: number;
}

interface Order {
  _id: string;
  orderId: string;
  date: string;
  amount: number;
  status: 'delivered' | 'cancelled' | 'returned' | 'pending' | 'shipped';
  paymentMethod: string;
  items: number;
}

interface Return {
  _id: string;
  orderId: string;
  returnId: string;
  date: string;
  amount: number;
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
}

interface LoginRecord {
  date: string;
  device: string;
  browser: string;
  location?: string;
}

const CustomerProfile: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for development
  const mockCustomer: CustomerProfile = {
    _id: '1',
    name: 'John Doe',
    customerId: 'CUST001',
    phone: '+91 9876543210',
    email: 'john.doe@email.com',
    dateOfRegistration: '2024-01-15T10:30:00Z',
    totalSpends: 25000,
    totalOrders: 15,
    totalReturns: 2,
    lastLogin: '2024-01-20T14:30:00Z',
    lastOrderDate: '2024-01-18T09:15:00Z',
    savedAddresses: [
      {
        _id: '1',
        name: 'Home',
        type: 'home',
        addressLine1: '123 Main Street',
        addressLine2: 'Apartment 4B',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        isDefault: true
      },
      {
        _id: '2',
        name: 'Office',
        type: 'office',
        addressLine1: '456 Business Park',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400002',
        isDefault: false
      }
    ],
    notificationPreferences: {
      email: true,
      sms: true,
      push: false,
      newsletter: true,
      offers: false
    },
    accountStatus: 'active',
    isVerified: true,
    averageOrderValue: 1667,
    returnPercentage: 13.3,
    paymentMethods: [
      { type: 'card', lastUsed: '2024-01-18T09:15:00Z', frequency: 8 },
      { type: 'upi', lastUsed: '2024-01-15T14:20:00Z', frequency: 5 },
      { type: 'cod', lastUsed: '2024-01-10T11:30:00Z', frequency: 2 }
    ],
    orderHistory: [
      {
        _id: '1',
        orderId: 'ORD001',
        date: '2024-01-18T09:15:00Z',
        amount: 2500,
        status: 'delivered',
        paymentMethod: 'Card',
        items: 3
      },
      {
        _id: '2',
        orderId: 'ORD002',
        date: '2024-01-15T14:20:00Z',
        amount: 1800,
        status: 'delivered',
        paymentMethod: 'UPI',
        items: 2
      },
      {
        _id: '3',
        orderId: 'ORD003',
        date: '2024-01-12T16:45:00Z',
        amount: 3200,
        status: 'returned',
        paymentMethod: 'Card',
        items: 4
      }
    ],
    returnHistory: [
      {
        _id: '1',
        orderId: 'ORD003',
        returnId: 'RET001',
        date: '2024-01-14T10:30:00Z',
        amount: 3200,
        reason: 'Product defective',
        status: 'approved'
      },
      {
        _id: '2',
        orderId: 'ORD005',
        returnId: 'RET002',
        date: '2024-01-08T15:20:00Z',
        amount: 1500,
        reason: 'Wrong size',
        status: 'approved'
      }
    ],
    loginHistory: [
      {
        date: '2024-01-20T14:30:00Z',
        device: 'Mobile',
        browser: 'Chrome Mobile',
        location: 'Mumbai, Maharashtra'
      },
      {
        date: '2024-01-19T09:15:00Z',
        device: 'Desktop',
        browser: 'Chrome',
        location: 'Mumbai, Maharashtra'
      },
      {
        date: '2024-01-18T20:45:00Z',
        device: 'Mobile',
        browser: 'Safari',
        location: 'Mumbai, Maharashtra'
      }
    ]
  };

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setCustomer(mockCustomer);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch customer profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      blocked: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      inactive: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      returned: { bg: 'bg-orange-100', text: 'text-orange-800', icon: RotateCcw },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      shipped: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Package }
    };
    return statusConfig[status as keyof typeof statusConfig] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle };
  };

  const handleCustomerAction = async (action: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (action === 'block' || action === 'unblock') {
        setCustomer(prev => prev ? {
          ...prev,
          accountStatus: action === 'block' ? 'blocked' : 'active'
        } : null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${action} customer`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error || 'Customer not found'}
      </div>
    );
  }

  const statusConfig = getStatusBadge(customer.accountStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/customer-management')}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600">Customer ID: {customer.customerId}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
          <button
            onClick={() => handleCustomerAction(customer.accountStatus === 'blocked' ? 'unblock' : 'block')}
            className={`flex items-center px-4 py-2 text-sm rounded-md ${
              customer.accountStatus === 'blocked'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {customer.accountStatus === 'blocked' ? (
              <><Unlock className="h-4 w-4 mr-2" />Unblock</>
            ) : (
              <><Lock className="h-4 w-4 mr-2" />Block</>
            )}
          </button>
          <button className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Bell className="h-4 w-4 mr-2" />
            Notify
          </button>
          <button className="flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Customer Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Spends</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(customer.totalSpends)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{customer.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(customer.averageOrderValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <RotateCcw className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Return Rate</p>
              <p className="text-2xl font-bold text-gray-900">{customer.returnPercentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                <StatusIcon className="h-4 w-4 mr-1" />
                {customer.accountStatus.charAt(0).toUpperCase() + customer.accountStatus.slice(1)}
              </span>
              {customer.isVerified && (
                <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-3 text-gray-400" />
                  <span>{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-3 text-gray-400" />
                    <span>{customer.email}</span>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                  <span>Joined {formatDate(customer.dateOfRegistration)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Activity</h4>
              <div className="space-y-2">
                {customer.lastLogin && (
                  <div className="flex items-center text-sm">
                    <Activity className="h-4 w-4 mr-3 text-gray-400" />
                    <span>Last login: {formatDate(customer.lastLogin)}</span>
                  </div>
                )}
                {customer.lastOrderDate && (
                  <div className="flex items-center text-sm">
                    <ShoppingBag className="h-4 w-4 mr-3 text-gray-400" />
                    <span>Last order: {formatDate(customer.lastOrderDate)}</span>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                  <span>{customer.savedAddresses.length} saved addresses</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Preferences</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Email notifications</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${customer.notificationPreferences.email ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {customer.notificationPreferences.email ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>SMS notifications</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${customer.notificationPreferences.sms ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {customer.notificationPreferences.sms ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Push notifications</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${customer.notificationPreferences.push ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {customer.notificationPreferences.push ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'orders', label: 'Order History', count: customer.orderHistory.length },
              { id: 'returns', label: 'Returns & Refunds', count: customer.returnHistory.length },
              { id: 'addresses', label: 'Saved Addresses', count: customer.savedAddresses.length },
              { id: 'payments', label: 'Payment Methods', count: customer.paymentMethods.length },
              { id: 'activity', label: 'Login History', count: customer.loginHistory.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Order History Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Recent Orders</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customer.orderHistory.map((order) => {
                      const statusConfig = getStatusBadge(order.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <tr key={order._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {order.orderId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(order.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(order.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.items} items
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.paymentMethod}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Returns Tab */}
          {activeTab === 'returns' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Returns & Refunds</h4>
              <div className="space-y-4">
                {customer.returnHistory.map((returnItem) => (
                  <div key={returnItem._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Return ID: {returnItem.returnId}</p>
                        <p className="text-sm text-gray-500">Order: {returnItem.orderId}</p>
                        <p className="text-sm text-gray-500">Date: {formatDate(returnItem.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(returnItem.amount)}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          returnItem.status === 'approved' ? 'bg-green-100 text-green-800' :
                          returnItem.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Reason: {returnItem.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Saved Addresses</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer.savedAddresses.map((address) => (
                  <div key={address._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{address.name}</h5>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          address.type === 'home' ? 'bg-blue-100 text-blue-800' :
                          address.type === 'office' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
                        </span>
                        {address.isDefault && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>{address.addressLine1}</p>
                      {address.addressLine2 && <p>{address.addressLine2}</p>}
                      <p>{address.city}, {address.state} - {address.pincode}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Payment Methods</h4>
              <div className="space-y-3">
                {customer.paymentMethods.map((method, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{method.type}</p>
                        <p className="text-sm text-gray-500">Used {method.frequency} times</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Last used</p>
                      <p className="text-sm text-gray-900">{formatDate(method.lastUsed)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Login History Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Recent Login Activity</h4>
              <div className="space-y-3">
                {customer.loginHistory.map((login, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{login.device}</p>
                        <p className="text-sm text-gray-500">{login.browser}</p>
                        {login.location && (
                          <p className="text-sm text-gray-500">{login.location}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{formatDate(login.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;