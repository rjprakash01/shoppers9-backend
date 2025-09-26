import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Edit,
  Lock,
  Unlock,
  Bell,
  Eye,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  RotateCcw,
  MapPin,
  Settings as SettingsIcon
} from 'lucide-react';

interface Customer {
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
  savedAddresses: number;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  accountStatus: 'active' | 'blocked' | 'inactive';
  isVerified: boolean;
}

interface CustomersResponse {
  customers: Customer[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCustomers: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const CustomerManagement: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCustomers: 0,
    hasNext: false,
    hasPrev: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('dateOfRegistration');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Mock data for development
  const mockCustomers: Customer[] = [
    {
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
      savedAddresses: 3,
      notificationPreferences: {
        email: true,
        sms: true,
        push: false
      },
      accountStatus: 'active',
      isVerified: true
    },
    {
      _id: '2',
      name: 'Jane Smith',
      customerId: 'CUST002',
      phone: '+91 9876543211',
      email: 'jane.smith@email.com',
      dateOfRegistration: '2024-01-10T08:20:00Z',
      totalSpends: 45000,
      totalOrders: 28,
      totalReturns: 1,
      lastLogin: '2024-01-21T16:45:00Z',
      lastOrderDate: '2024-01-19T11:30:00Z',
      savedAddresses: 2,
      notificationPreferences: {
        email: true,
        sms: false,
        push: true
      },
      accountStatus: 'active',
      isVerified: true
    },
    {
      _id: '3',
      name: 'Mike Johnson',
      customerId: 'CUST003',
      phone: '+91 9876543212',
      email: 'mike.johnson@email.com',
      dateOfRegistration: '2024-01-05T12:00:00Z',
      totalSpends: 8500,
      totalOrders: 5,
      totalReturns: 0,
      lastLogin: '2024-01-15T10:20:00Z',
      lastOrderDate: '2024-01-12T15:45:00Z',
      savedAddresses: 1,
      notificationPreferences: {
        email: false,
        sms: true,
        push: true
      },
      accountStatus: 'inactive',
      isVerified: false
    }
  ];

  const fetchCustomers = async (page: number = 1, search: string = '') => {
    try {
      setIsLoading(true);
      setError('');
      
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let filteredCustomers = mockCustomers;
      
      if (search) {
        filteredCustomers = mockCustomers.filter(customer => 
          customer.name.toLowerCase().includes(search.toLowerCase()) ||
          customer.phone.includes(search) ||
          customer.email?.toLowerCase().includes(search.toLowerCase()) ||
          customer.customerId.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      if (statusFilter) {
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.accountStatus === statusFilter
        );
      }
      
      setCustomers(filteredCustomers);
      setPagination({
        currentPage: page,
        totalPages: Math.ceil(filteredCustomers.length / 10),
        totalCustomers: filteredCustomers.length,
        hasNext: page < Math.ceil(filteredCustomers.length / 10),
        hasPrev: page > 1
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(currentPage, searchTerm);
  }, [currentPage, searchTerm, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCustomers(1, searchTerm);
  };

  const handleCustomerAction = async (customerId: string, action: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (action === 'block' || action === 'unblock') {
        setCustomers(customers.map(customer => 
          customer._id === customerId 
            ? { ...customer, accountStatus: action === 'block' ? 'blocked' : 'active' }
            : customer
        ));
      } else if (action === 'edit') {
        // Navigate to customer profile page for editing
        navigate(`/customer/${customerId}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${action} customer`);
    }
  };

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
      active: 'bg-green-100 text-green-800',
      blocked: 'bg-red-100 text-red-800',
      inactive: 'bg-yellow-100 text-yellow-800'
    };
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800';
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c._id));
    }
  };

  const handleSelectCustomer = (customerId: string) => {
    if (selectedCustomers.includes(customerId)) {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId));
    } else {
      setSelectedCustomers([...selectedCustomers, customerId]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">Manage customer accounts, orders, and engagement metrics</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => fetchCustomers(currentPage, searchTerm)}
            className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, email, or customer ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </form>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dateOfRegistration">Registration Date</option>
              <option value="totalSpends">Total Spends</option>
              <option value="totalOrders">Total Orders</option>
              <option value="lastLogin">Last Login</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setSortBy('dateOfRegistration');
                setSortOrder('desc');
              }}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedCustomers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedCustomers.length} customer(s) selected
            </span>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Send Notification
              </button>
              <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                Block Selected
              </button>
              <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                Export Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Customers ({pagination.totalCustomers})
            </h3>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === customers.length && customers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders & Spending
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer._id)}
                        onChange={() => handleSelectCustomer(customer._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => navigate(`/customer/${customer._id}`)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-900"
                          >
                            {customer.name}
                          </button>
                          <div className="text-sm text-gray-500">ID: {customer.customerId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {customer.phone}
                        </div>
                        {customer.email && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(customer.dateOfRegistration)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <ShoppingBag className="h-4 w-4 mr-2 text-gray-400" />
                          {customer.totalOrders} orders
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(customer.totalSpends)}
                        </div>
                        {customer.totalReturns > 0 && (
                          <div className="flex items-center text-sm text-orange-600">
                            <RotateCcw className="h-4 w-4 mr-1" />
                            {customer.totalReturns} returns
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {customer.lastLogin && (
                          <div className="text-sm text-gray-500">
                            Last login: {formatDate(customer.lastLogin)}
                          </div>
                        )}
                        {customer.lastOrderDate && (
                          <div className="text-sm text-gray-500">
                            Last order: {formatDate(customer.lastOrderDate)}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {customer.savedAddresses} addresses
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(customer.accountStatus)}`}>
                        {customer.accountStatus.charAt(0).toUpperCase() + customer.accountStatus.slice(1)}
                      </span>
                      {customer.isVerified && (
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Verified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/customer/${customer._id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleCustomerAction(customer._id, 'edit')}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit Customer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleCustomerAction(customer._id, customer.accountStatus === 'blocked' ? 'unblock' : 'block')}
                          className={`${customer.accountStatus === 'blocked' ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}`}
                          title={customer.accountStatus === 'blocked' ? 'Unblock Customer' : 'Block Customer'}
                        >
                          {customer.accountStatus === 'blocked' ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </button>
                        <button
                          className="text-purple-600 hover:text-purple-900"
                          title="Send Notification"
                        >
                          <Bell className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && customers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManagement;