import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  overview: {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalAdmins: number;
  };
  recentStats: {
    newUsers: number;
    newOrders: number;
    recentRevenue: number;
  };
  charts: {
    salesTrend: Array<{
      _id: {
        year: number;
        month: number;
        day: number;
      };
      orders: number;
      revenue: number;
    }>;
    topProducts: Array<{
      _id: string;
      name: string;
      totalSold: number;
      revenue: number;
    }>;
  };
  recentActivity: {
    latestOrders: Array<{
      _id: string;
      orderNumber: string;
      totalAmount: number;
      orderStatus: string;
      createdAt: string;
      userId: {
        firstName: string;
        lastName: string;
        email: string;
      };
    }>;
  };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30d');

  const fetchDashboardStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }
      
      const data = await authService.getDashboardStats(
        startDate.toISOString(),
        endDate.toISOString()
      );
      setStats(data);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard stats');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchDashboardStats();
  }, [dateRange, fetchDashboardStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
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

  const getStatusColor = (status: string) => {
    if (!status) {
      return 'bg-gray-100 text-gray-800';
    }
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <div className="flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchDashboardStats}
            className="ml-4 text-red-600 hover:text-red-800"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with date range selector */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={fetchDashboardStats}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Users</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{(stats.overview.totalUsers || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Products</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{(stats.overview.totalProducts || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Orders</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{(stats.overview.totalOrders || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Revenue</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {formatCurrency(stats.overview.totalRevenue || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Admins</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{(stats.overview.totalAdmins || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Stats */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Recent Activity ({dateRange})</h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">New Users</p>
                  <p className="text-xs text-gray-500 truncate">Recent registrations</p>
                </div>
              </div>
              <p className="text-base sm:text-lg font-semibold text-gray-900 ml-2">{stats.recentStats.newUsers || 0}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">New Orders</p>
                  <p className="text-xs text-gray-500 truncate">Recent orders</p>
                </div>
              </div>
              <p className="text-base sm:text-lg font-semibold text-gray-900 ml-2">{stats.recentStats.newOrders || 0}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Recent Revenue</p>
                  <p className="text-xs text-gray-500 truncate">Revenue in period</p>
                </div>
              </div>
              <p className="text-sm sm:text-lg font-semibold text-gray-900 ml-2">{formatCurrency(stats.recentStats.recentRevenue || 0)}</p>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Top Selling Products</h3>
          <div className="space-y-2 sm:space-y-3">
            {stats.charts.topProducts.length > 0 ? (
              stats.charts.topProducts.slice(0, 5).map((product, index) => (
                <div key={product._id} className="flex items-center justify-between py-2">
                  <div className="flex items-center min-w-0 flex-1">
                    <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 text-xs font-medium rounded-full flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="ml-2 sm:ml-3 text-xs sm:text-sm text-gray-900 truncate">{product.name || 'Unknown Product'}</span>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">{product.totalSold} sold</div>
                    <div className="text-xs text-gray-500">{formatCurrency(product.revenue)}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No product data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Customer
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentActivity.latestOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">{order.orderNumber}</div>
                    <div className="text-xs text-gray-500 sm:hidden">
                      {order.userId?.firstName || 'N/A'} {order.userId?.lastName || ''}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.userId?.firstName || 'N/A'} {order.userId?.lastName || ''}</div>
                      <div className="text-sm text-gray-500">{order.userId?.email || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm text-gray-900 font-medium">{formatCurrency(order.totalAmount)}</div>
                    <div className="text-xs text-gray-500 md:hidden">{formatDate(order.createdAt)}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;