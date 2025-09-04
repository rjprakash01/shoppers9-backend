import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  revenueGrowth: number;
  orderGrowth: number;
  userGrowth: number;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    totalSold: number;
    revenue: number;
  }>;
  orderStatusBreakdown: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  categoryPerformance: Array<{
    categoryName: string;
    productCount: number;
    totalSales: number;
    revenue: number;
  }>;
}

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (period: string = '30d') => {
    try {
      setIsLoading(true);
      setError('');
      
      const data = await authService.getSalesAnalytics(period);
      setAnalyticsData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(dateRange);
  }, [dateRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics(dateRange);
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
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
        {error}
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data available</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Detailed insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analyticsData.totalRevenue)}
              </p>
              <div className={`flex items-center mt-2 ${getGrowthColor(analyticsData.revenueGrowth)}`}>
                {getGrowthIcon(analyticsData.revenueGrowth)}
                <span className="text-sm ml-1">
                  {analyticsData.revenueGrowth > 0 ? '+' : ''}{(analyticsData.revenueGrowth || 0).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(analyticsData.totalOrders)}
              </p>
              <div className={`flex items-center mt-2 ${getGrowthColor(analyticsData.orderGrowth)}`}>
                {getGrowthIcon(analyticsData.orderGrowth)}
                <span className="text-sm ml-1">
                  {analyticsData.orderGrowth > 0 ? '+' : ''}{(analyticsData.orderGrowth || 0).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(analyticsData.totalUsers)}
              </p>
              <div className={`flex items-center mt-2 ${getGrowthColor(analyticsData.userGrowth)}`}>
                {getGrowthIcon(analyticsData.userGrowth)}
                <span className="text-sm ml-1">
                  {analyticsData.userGrowth > 0 ? '+' : ''}{(analyticsData.userGrowth || 0).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(analyticsData.totalProducts)}
              </p>
              <div className="flex items-center mt-2 text-gray-600">
                <Package className="h-4 w-4" />
                <span className="text-sm ml-1">Active products</span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Order Status Breakdown</h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {(analyticsData.orderStatusBreakdown || []).map((status, index) => (
              <div key={status.status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ 
                      backgroundColor: `hsl(${index * 45}, 70%, 50%)` 
                    }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {status.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{status.count}</div>
                  <div className="text-xs text-gray-500">{(status.percentage || 0).toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Top Selling Products</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {(analyticsData.topSellingProducts || []).slice(0, 5).map((product, index) => (
              <div key={product.productId} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {product.productName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {product.totalSold} sold
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(product.revenue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Revenue Trend */}
      {analyticsData.monthlyRevenue && Array.isArray(analyticsData.monthlyRevenue) && analyticsData.monthlyRevenue.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Monthly Revenue Trend</h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Month</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Revenue</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Orders</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Avg Order Value</th>
                </tr>
              </thead>
              <tbody>
                {(analyticsData.monthlyRevenue || []).map((month, index) => (
                  <tr key={`month-${month.month}`} className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-900">{month.month}</td>
                    <td className="py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(month.revenue)}
                    </td>
                    <td className="py-3 text-sm text-gray-900 text-right">
                      {formatNumber(month.orders)}
                    </td>
                    <td className="py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(month.orders > 0 ? month.revenue / month.orders : 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Performance */}
      {analyticsData.categoryPerformance && Array.isArray(analyticsData.categoryPerformance) && analyticsData.categoryPerformance.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Category Performance</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Category</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Products</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Sales</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(analyticsData.categoryPerformance || []).map((category, index) => (
                  <tr key={`category-${category.categoryName}`} className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-900">{category.categoryName}</td>
                    <td className="py-3 text-sm text-gray-900 text-right">
                      {formatNumber(category.productCount)}
                    </td>
                    <td className="py-3 text-sm text-gray-900 text-right">
                      {formatNumber(category.totalSales)}
                    </td>
                    <td className="py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(category.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;