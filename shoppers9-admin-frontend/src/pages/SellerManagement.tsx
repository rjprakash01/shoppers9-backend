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
  Pause,
  Play,
  Bell,
  Eye,
  Phone,
  Mail,
  Calendar,
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  FileText,
  Store
} from 'lucide-react';

interface Seller {
  _id: string;
  name: string;
  sellerId: string;
  phone: string;
  email?: string;
  dateOfJoining: string;
  totalProductsAdded: number;
  totalOrdersReceived: number;
  totalBilling: number;
  lastOrderReceived?: string;
  averageOrderValue: number;
  accountStatus: 'active' | 'under_review' | 'suspended';
  businessType: 'individual' | 'business';
  kycStatus: 'pending' | 'verified' | 'rejected';
  gstNumber?: string;
  panNumber?: string;
  pendingBalance: number;
  lastPayoutDate?: string;
}

interface SellersResponse {
  sellers: Seller[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalSellers: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const SellerManagement: React.FC = () => {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalSellers: 0,
    hasNext: false,
    hasPrev: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [sortBy, setSortBy] = useState('dateOfJoining');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Mock data for development
  const mockSellers: Seller[] = [
    {
      _id: '1',
      name: 'TechStore Electronics',
      sellerId: 'SELL001',
      phone: '+91 9876543210',
      email: 'contact@techstore.com',
      dateOfJoining: '2024-01-10T10:30:00Z',
      totalProductsAdded: 150,
      totalOrdersReceived: 85,
      totalBilling: 450000,
      lastOrderReceived: '2024-01-20T14:30:00Z',
      averageOrderValue: 5294,
      accountStatus: 'active',
      businessType: 'business',
      kycStatus: 'verified',
      gstNumber: '27AABCT1332L1ZZ',
      panNumber: 'AABCT1332L',
      pendingBalance: 25000,
      lastPayoutDate: '2024-01-15T09:00:00Z'
    },
    {
      _id: '2',
      name: 'Fashion Hub',
      sellerId: 'SELL002',
      phone: '+91 9876543211',
      email: 'info@fashionhub.com',
      dateOfJoining: '2024-01-05T08:20:00Z',
      totalProductsAdded: 320,
      totalOrdersReceived: 156,
      totalBilling: 780000,
      lastOrderReceived: '2024-01-21T16:45:00Z',
      averageOrderValue: 5000,
      accountStatus: 'active',
      businessType: 'business',
      kycStatus: 'verified',
      gstNumber: '29AABCF2834M1Z1',
      panNumber: 'AABCF2834M',
      pendingBalance: 45000,
      lastPayoutDate: '2024-01-18T10:30:00Z'
    },
    {
      _id: '3',
      name: 'John Handmade Crafts',
      sellerId: 'SELL003',
      phone: '+91 9876543212',
      email: 'john.crafts@email.com',
      dateOfJoining: '2024-01-15T12:00:00Z',
      totalProductsAdded: 45,
      totalOrdersReceived: 12,
      totalBilling: 35000,
      lastOrderReceived: '2024-01-19T11:20:00Z',
      averageOrderValue: 2917,
      accountStatus: 'under_review',
      businessType: 'individual',
      kycStatus: 'pending',
      pendingBalance: 8500,
      lastPayoutDate: '2024-01-10T14:00:00Z'
    },
    {
      _id: '4',
      name: 'Sports Arena',
      sellerId: 'SELL004',
      phone: '+91 9876543213',
      email: 'contact@sportsarena.com',
      dateOfJoining: '2023-12-20T15:30:00Z',
      totalProductsAdded: 89,
      totalOrdersReceived: 34,
      totalBilling: 125000,
      lastOrderReceived: '2024-01-12T09:15:00Z',
      averageOrderValue: 3676,
      accountStatus: 'suspended',
      businessType: 'business',
      kycStatus: 'rejected',
      gstNumber: '19AABCS5432N1Z8',
      panNumber: 'AABCS5432N',
      pendingBalance: 0,
      lastPayoutDate: '2024-01-05T11:45:00Z'
    }
  ];

  const fetchSellers = async (page: number = 1, search: string = '') => {
    try {
      setIsLoading(true);
      setError('');
      
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let filteredSellers = mockSellers;
      
      if (search) {
        filteredSellers = mockSellers.filter(seller => 
          seller.name.toLowerCase().includes(search.toLowerCase()) ||
          seller.phone.includes(search) ||
          seller.email?.toLowerCase().includes(search.toLowerCase()) ||
          seller.sellerId.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      if (statusFilter) {
        filteredSellers = filteredSellers.filter(seller => 
          seller.accountStatus === statusFilter
        );
      }
      
      if (kycFilter) {
        filteredSellers = filteredSellers.filter(seller => 
          seller.kycStatus === kycFilter
        );
      }
      
      setSellers(filteredSellers);
      setPagination({
        currentPage: page,
        totalPages: Math.ceil(filteredSellers.length / 10),
        totalSellers: filteredSellers.length,
        hasNext: page < Math.ceil(filteredSellers.length / 10),
        hasPrev: page > 1
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sellers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers(currentPage, searchTerm);
  }, [currentPage, searchTerm, statusFilter, kycFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSellers(1, searchTerm);
  };

  const handleSellerAction = async (sellerId: string, action: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (action === 'suspend' || action === 'activate') {
        setSellers(sellers.map(seller => 
          seller._id === sellerId 
            ? { ...seller, accountStatus: action === 'suspend' ? 'suspended' : 'active' }
            : seller
        ));
      } else if (action === 'edit') {
        // Navigate to seller profile page for editing
        navigate(`/seller/${sellerId}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${action} seller`);
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
      suspended: 'bg-red-100 text-red-800',
      under_review: 'bg-yellow-100 text-yellow-800'
    };
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800';
  };

  const getKycBadge = (status: string) => {
    const statusConfig = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800';
  };

  const handleSelectAll = () => {
    if (selectedSellers.length === sellers.length) {
      setSelectedSellers([]);
    } else {
      setSelectedSellers(sellers.map(s => s._id));
    }
  };

  const handleSelectSeller = (sellerId: string) => {
    if (selectedSellers.includes(sellerId)) {
      setSelectedSellers(selectedSellers.filter(id => id !== sellerId));
    } else {
      setSelectedSellers([...selectedSellers, sellerId]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seller Management</h1>
          <p className="text-gray-600">Manage seller accounts, products, and business metrics</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => fetchSellers(currentPage, searchTerm)}
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
                placeholder="Search by name, phone, email, or seller ID..."
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="under_review">Under Review</option>
            </select>
            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All KYC Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dateOfJoining">Joining Date</option>
              <option value="totalBilling">Total Billing</option>
              <option value="totalOrdersReceived">Total Orders</option>
              <option value="averageOrderValue">Avg Order Value</option>
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
                setKycFilter('');
                setSortBy('dateOfJoining');
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
      {selectedSellers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedSellers.length} seller(s) selected
            </span>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Send Notification
              </button>
              <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                Suspend Selected
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

      {/* Sellers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Sellers ({pagination.totalSellers})
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
                      checked={selectedSellers.length === sellers.length && sellers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Financials
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
                {sellers.map((seller) => (
                  <tr key={seller._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedSellers.includes(seller._id)}
                        onChange={() => handleSelectSeller(seller._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                            <Store className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => navigate(`/seller/${seller._id}`)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-900"
                          >
                            {seller.name}
                          </button>
                          <div className="text-sm text-gray-500">ID: {seller.sellerId}</div>
                          <div className="text-xs text-gray-400 capitalize">{seller.businessType}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {seller.phone}
                        </div>
                        {seller.email && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {seller.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {formatDate(seller.dateOfJoining)}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Package className="h-4 w-4 mr-2 text-gray-400" />
                          {seller.totalProductsAdded} products
                        </div>
                        {seller.gstNumber && (
                          <div className="text-xs text-gray-400">
                            GST: {seller.gstNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <ShoppingBag className="h-4 w-4 mr-2 text-gray-400" />
                          {seller.totalOrdersReceived} orders
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <TrendingUp className="h-4 w-4 mr-2 text-gray-400" />
                          AOV: {formatCurrency(seller.averageOrderValue)}
                        </div>
                        {seller.lastOrderReceived && (
                          <div className="text-xs text-gray-400">
                            Last: {formatDate(seller.lastOrderReceived)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                          {formatCurrency(seller.totalBilling)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Pending: {formatCurrency(seller.pendingBalance)}
                        </div>
                        {seller.lastPayoutDate && (
                          <div className="text-xs text-gray-400">
                            Last payout: {formatDate(seller.lastPayoutDate)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(seller.accountStatus)}`}>
                          {seller.accountStatus.replace('_', ' ').charAt(0).toUpperCase() + seller.accountStatus.replace('_', ' ').slice(1)}
                        </span>
                        <div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getKycBadge(seller.kycStatus)}`}>
                            KYC: {seller.kycStatus.charAt(0).toUpperCase() + seller.kycStatus.slice(1)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/seller/${seller._id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleSellerAction(seller._id, 'edit')}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit Seller"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleSellerAction(seller._id, seller.accountStatus === 'suspended' ? 'activate' : 'suspend')}
                          className={`${seller.accountStatus === 'suspended' ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}`}
                          title={seller.accountStatus === 'suspended' ? 'Activate Seller' : 'Suspend Seller'}
                        >
                          {seller.accountStatus === 'suspended' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                        </button>
                        <button
                          className="text-purple-600 hover:text-purple-900"
                          title="Send Notification"
                        >
                          <Bell className="h-4 w-4" />
                        </button>
                        <button
                          className="text-orange-600 hover:text-orange-900"
                          title="View Products"
                        >
                          <Package className="h-4 w-4" />
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
        {!isLoading && sellers.length > 0 && (
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

export default SellerManagement;