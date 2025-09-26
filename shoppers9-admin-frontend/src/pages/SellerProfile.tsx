import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Pause,
  Play,
  Bell,
  Download,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  Package,
  DollarSign,
  TrendingUp,
  Store,
  FileText,
  CreditCard,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Users,
  BarChart3,
  Truck,
  RotateCcw
} from 'lucide-react';

interface SellerProfile {
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
  totalPaidOut: number;
  productCategories: ProductCategory[];
  recentProducts: Product[];
  orderHistory: SellerOrder[];
  payoutHistory: Payout[];
  performanceMetrics: PerformanceMetrics;
  complianceInfo: ComplianceInfo;
  bankDetails: BankDetails;
}

interface ProductCategory {
  category: string;
  count: number;
  activeCount: number;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  addedDate: string;
}

interface SellerOrder {
  _id: string;
  orderId: string;
  date: string;
  productName: string;
  quantity: number;
  amount: number;
  status: 'delivered' | 'cancelled' | 'returned' | 'pending' | 'shipped';
  commission: number;
}

interface Payout {
  _id: string;
  payoutId: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  transactionId?: string;
}

interface PerformanceMetrics {
  averageFulfillmentTime: number; // in hours
  returnRate: number; // percentage
  rating: number;
  totalReviews: number;
  onTimeDeliveryRate: number; // percentage
  customerSatisfactionScore: number;
}

interface ComplianceInfo {
  kycDocuments: {
    panCard: { status: 'verified' | 'pending' | 'rejected'; uploadDate?: string };
    gstCertificate: { status: 'verified' | 'pending' | 'rejected'; uploadDate?: string };
    businessLicense: { status: 'verified' | 'pending' | 'rejected'; uploadDate?: string };
  };
  taxCompliance: boolean;
  agreementSigned: boolean;
}

interface BankDetails {
  accountNumber: string; // masked
  bankName: string;
  ifscCode: string;
  accountHolderName: string;
  isVerified: boolean;
}

const SellerProfile: React.FC = () => {
  const { sellerId } = useParams<{ sellerId: string }>();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for development
  const mockSeller: SellerProfile = {
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
    lastPayoutDate: '2024-01-15T09:00:00Z',
    totalPaidOut: 380000,
    productCategories: [
      { category: 'Electronics', count: 85, activeCount: 78 },
      { category: 'Mobile Accessories', count: 45, activeCount: 42 },
      { category: 'Computers', count: 20, activeCount: 18 }
    ],
    recentProducts: [
      {
        _id: '1',
        name: 'Wireless Bluetooth Headphones',
        sku: 'WBH001',
        category: 'Electronics',
        price: 2999,
        status: 'active',
        addedDate: '2024-01-18T10:30:00Z'
      },
      {
        _id: '2',
        name: 'USB-C Fast Charger',
        sku: 'UFC002',
        category: 'Mobile Accessories',
        price: 1299,
        status: 'active',
        addedDate: '2024-01-17T14:20:00Z'
      },
      {
        _id: '3',
        name: 'Gaming Mouse',
        sku: 'GM003',
        category: 'Computers',
        price: 1899,
        status: 'out_of_stock',
        addedDate: '2024-01-16T09:15:00Z'
      }
    ],
    orderHistory: [
      {
        _id: '1',
        orderId: 'ORD001',
        date: '2024-01-20T14:30:00Z',
        productName: 'Wireless Bluetooth Headphones',
        quantity: 2,
        amount: 5998,
        status: 'delivered',
        commission: 599.8
      },
      {
        _id: '2',
        orderId: 'ORD002',
        date: '2024-01-19T11:20:00Z',
        productName: 'USB-C Fast Charger',
        quantity: 3,
        amount: 3897,
        status: 'shipped',
        commission: 389.7
      },
      {
        _id: '3',
        orderId: 'ORD003',
        date: '2024-01-18T16:45:00Z',
        productName: 'Gaming Mouse',
        quantity: 1,
        amount: 1899,
        status: 'returned',
        commission: 0
      }
    ],
    payoutHistory: [
      {
        _id: '1',
        payoutId: 'PAY001',
        date: '2024-01-15T09:00:00Z',
        amount: 45000,
        status: 'completed',
        transactionId: 'TXN123456789'
      },
      {
        _id: '2',
        payoutId: 'PAY002',
        date: '2024-01-08T10:30:00Z',
        amount: 38000,
        status: 'completed',
        transactionId: 'TXN123456788'
      },
      {
        _id: '3',
        payoutId: 'PAY003',
        date: '2024-01-01T11:15:00Z',
        amount: 42000,
        status: 'completed',
        transactionId: 'TXN123456787'
      }
    ],
    performanceMetrics: {
      averageFulfillmentTime: 24,
      returnRate: 8.5,
      rating: 4.3,
      totalReviews: 127,
      onTimeDeliveryRate: 92.5,
      customerSatisfactionScore: 4.2
    },
    complianceInfo: {
      kycDocuments: {
        panCard: { status: 'verified', uploadDate: '2024-01-10T10:30:00Z' },
        gstCertificate: { status: 'verified', uploadDate: '2024-01-10T10:35:00Z' },
        businessLicense: { status: 'verified', uploadDate: '2024-01-10T10:40:00Z' }
      },
      taxCompliance: true,
      agreementSigned: true
    },
    bankDetails: {
      accountNumber: '****1234',
      bankName: 'State Bank of India',
      ifscCode: 'SBIN0001234',
      accountHolderName: 'TechStore Electronics Pvt Ltd',
      isVerified: true
    }
  };

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSeller(mockSeller);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch seller profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeller();
  }, [sellerId]);

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
      suspended: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      under_review: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      verified: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      returned: { bg: 'bg-orange-100', text: 'text-orange-800', icon: RotateCcw },
      shipped: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Truck },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      out_of_stock: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock }
    };
    return statusConfig[status as keyof typeof statusConfig] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle };
  };

  const handleSellerAction = async (action: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (action === 'suspend' || action === 'activate') {
        setSeller(prev => prev ? {
          ...prev,
          accountStatus: action === 'suspend' ? 'suspended' : 'active'
        } : null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${action} seller`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error || 'Seller not found'}
      </div>
    );
  }

  const statusConfig = getStatusBadge(seller.accountStatus);
  const kycConfig = getStatusBadge(seller.kycStatus);
  const StatusIcon = statusConfig.icon;
  const KycIcon = kycConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/seller-management')}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sellers
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{seller.name}</h1>
            <p className="text-gray-600">Seller ID: {seller.sellerId} • {seller.businessType.charAt(0).toUpperCase() + seller.businessType.slice(1)}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
          <button
            onClick={() => handleSellerAction(seller.accountStatus === 'suspended' ? 'activate' : 'suspend')}
            className={`flex items-center px-4 py-2 text-sm rounded-md ${
              seller.accountStatus === 'suspended'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {seller.accountStatus === 'suspended' ? (
              <><Play className="h-4 w-4 mr-2" />Activate</>
            ) : (
              <><Pause className="h-4 w-4 mr-2" />Suspend</>
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

      {/* Seller Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Billing</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(seller.totalBilling)}</p>
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
              <p className="text-2xl font-bold text-gray-900">{seller.totalOrdersReceived}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Products Listed</p>
              <p className="text-2xl font-bold text-gray-900">{seller.totalProductsAdded}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(seller.averageOrderValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Seller Information</h3>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                <StatusIcon className="h-4 w-4 mr-1" />
                {seller.accountStatus.replace('_', ' ').charAt(0).toUpperCase() + seller.accountStatus.replace('_', ' ').slice(1)}
              </span>
              <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${kycConfig.bg} ${kycConfig.text}`}>
                <KycIcon className="h-4 w-4 mr-1" />
                KYC {seller.kycStatus.charAt(0).toUpperCase() + seller.kycStatus.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-3 text-gray-400" />
                  <span>{seller.phone}</span>
                </div>
                {seller.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-3 text-gray-400" />
                    <span>{seller.email}</span>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                  <span>Joined {formatDate(seller.dateOfJoining)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Business Details</h4>
              <div className="space-y-2">
                {seller.gstNumber && (
                  <div className="flex items-center text-sm">
                    <FileText className="h-4 w-4 mr-3 text-gray-400" />
                    <span>GST: {seller.gstNumber}</span>
                  </div>
                )}
                {seller.panNumber && (
                  <div className="flex items-center text-sm">
                    <FileText className="h-4 w-4 mr-3 text-gray-400" />
                    <span>PAN: {seller.panNumber}</span>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <Store className="h-4 w-4 mr-3 text-gray-400" />
                  <span className="capitalize">{seller.businessType}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Performance</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Star className="h-4 w-4 mr-3 text-yellow-400" />
                  <span>{seller.performanceMetrics.rating}/5 ({seller.performanceMetrics.totalReviews} reviews)</span>
                </div>
                <div className="flex items-center text-sm">
                  <Truck className="h-4 w-4 mr-3 text-gray-400" />
                  <span>{seller.performanceMetrics.onTimeDeliveryRate}% on-time delivery</span>
                </div>
                <div className="flex items-center text-sm">
                  <RotateCcw className="h-4 w-4 mr-3 text-gray-400" />
                  <span>{seller.performanceMetrics.returnRate}% return rate</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Financials</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <DollarSign className="h-4 w-4 mr-3 text-gray-400" />
                  <span>Pending: {formatCurrency(seller.pendingBalance)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <CreditCard className="h-4 w-4 mr-3 text-gray-400" />
                  <span>Paid: {formatCurrency(seller.totalPaidOut)}</span>
                </div>
                {seller.lastPayoutDate && (
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                    <span>Last payout: {formatDate(seller.lastPayoutDate)}</span>
                  </div>
                )}
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
              { id: 'products', label: 'Products', count: seller.totalProductsAdded },
              { id: 'orders', label: 'Order History', count: seller.orderHistory.length },
              { id: 'payouts', label: 'Payout History', count: seller.payoutHistory.length },
              { id: 'performance', label: 'Performance Metrics', count: null },
              { id: 'compliance', label: 'Compliance & KYC', count: null }
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
                {tab.label} {tab.count !== null && `(${tab.count})`}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Product Categories</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {seller.productCategories.map((category, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900">{category.category}</h5>
                      <p className="text-sm text-gray-500">{category.activeCount} active of {category.count} total</p>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(category.activeCount / category.count) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-4">Recent Products</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {seller.recentProducts.map((product) => {
                        const statusConfig = getStatusBadge(product.status);
                        const StatusIcon = statusConfig.icon;
                        return (
                          <tr key={product._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {product.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.sku}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(product.price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {product.status.replace('_', ' ').charAt(0).toUpperCase() + product.status.replace('_', ' ').slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(product.addedDate)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Recent Orders</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {seller.orderHistory.map((order) => {
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
                            {order.productName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(order.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(order.commission)}
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

          {/* Payouts Tab */}
          {activeTab === 'payouts' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Total Paid Out</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(seller.totalPaidOut)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Pending Balance</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(seller.pendingBalance)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Bank Account</p>
                  <p className="text-sm text-gray-900">{seller.bankDetails.bankName}</p>
                  <p className="text-sm text-gray-500">{seller.bankDetails.accountNumber}</p>
                </div>
              </div>

              <h4 className="font-medium text-gray-900">Payout History</h4>
              <div className="space-y-3">
                {seller.payoutHistory.map((payout) => {
                  const statusConfig = getStatusBadge(payout.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div key={payout._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Payout ID: {payout.payoutId}</p>
                          <p className="text-sm text-gray-500">Date: {formatDate(payout.date)}</p>
                          {payout.transactionId && (
                            <p className="text-sm text-gray-500">Transaction: {payout.transactionId}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(payout.amount)}</p>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h4 className="font-medium text-gray-900">Performance Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 mr-2" />
                    <p className="font-medium text-gray-900">Rating</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{seller.performanceMetrics.rating}/5</p>
                  <p className="text-sm text-gray-500">{seller.performanceMetrics.totalReviews} reviews</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-400 mr-2" />
                    <p className="font-medium text-gray-900">Avg Fulfillment Time</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{seller.performanceMetrics.averageFulfillmentTime}h</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Truck className="h-5 w-5 text-green-400 mr-2" />
                    <p className="font-medium text-gray-900">On-Time Delivery</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{seller.performanceMetrics.onTimeDeliveryRate}%</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <RotateCcw className="h-5 w-5 text-orange-400 mr-2" />
                    <p className="font-medium text-gray-900">Return Rate</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{seller.performanceMetrics.returnRate}%</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-purple-400 mr-2" />
                    <p className="font-medium text-gray-900">Customer Satisfaction</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{seller.performanceMetrics.customerSatisfactionScore}/5</p>
                </div>
              </div>
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">KYC Documents</h4>
                <div className="space-y-3">
                  {Object.entries(seller.complianceInfo.kycDocuments).map(([docType, doc]) => {
                    const statusConfig = getStatusBadge(doc.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <div key={docType} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900 capitalize">
                              {docType.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            {doc.uploadDate && (
                              <p className="text-sm text-gray-500">Uploaded: {formatDate(doc.uploadDate)}</p>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                          <StatusIcon className="h-4 w-4 mr-1" />
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-4">Compliance Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                      <p className="font-medium text-gray-900">Tax Compliance</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      seller.complianceInfo.taxCompliance ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {seller.complianceInfo.taxCompliance ? 'Compliant' : 'Non-Compliant'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-blue-400 mr-3" />
                      <p className="font-medium text-gray-900">Agreement Signed</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      seller.complianceInfo.agreementSigned ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {seller.complianceInfo.agreementSigned ? 'Signed' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-4">Bank Details</h4>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Account Holder</p>
                      <p className="text-sm text-gray-900">{seller.bankDetails.accountHolderName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Bank Name</p>
                      <p className="text-sm text-gray-900">{seller.bankDetails.bankName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Account Number</p>
                      <p className="text-sm text-gray-900">{seller.bankDetails.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">IFSC Code</p>
                      <p className="text-sm text-gray-900">{seller.bankDetails.ifscCode}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${
                      seller.bankDetails.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {seller.bankDetails.isVerified ? (
                        <><CheckCircle className="h-4 w-4 mr-1" />Verified</>
                      ) : (
                        <><Clock className="h-4 w-4 mr-1" />Pending Verification</>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;