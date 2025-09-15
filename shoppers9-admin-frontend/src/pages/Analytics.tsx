import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Eye,
  MousePointer,
  Target,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  PieChart,
  LineChart,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Package
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import type {
  AnalyticsDashboard,
  RevenueReport,
  CustomerReport,
  ConversionReport
} from '../services/analyticsService';

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'customers' | 'conversion' | 'products'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // Data states
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);
  const [customerReport, setCustomerReport] = useState<CustomerReport | null>(null);
  const [conversionReport, setConversionReport] = useState<ConversionReport | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab, dateRange, period]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        period
      };
      
      switch (activeTab) {
        case 'overview':
          const dashboardData = await analyticsService.getDashboard(filters);
          setDashboard(dashboardData);
          break;
          
        case 'revenue':
          const revenueData = await analyticsService.getRevenueReport(filters);
          setRevenueReport(revenueData);
          break;
          
        case 'customers':
          const customerData = await analyticsService.getCustomerReport(filters);
          setCustomerReport(customerData);
          break;
          
        case 'conversion':
          const conversionData = await analyticsService.getConversionReport(filters);
          setConversionReport(conversionData);
          break;
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (value: number) => {
    if (value > 0) {
      return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    } else if (value < 0) {
      return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    }
    return <div className="w-4 h-4" />;
  };

  const getGrowthColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading && !dashboard && !revenueReport && !customerReport && !conversionReport) {
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

  if (activeTab === 'overview' && !dashboard) {
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
            onClick={loadData}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
                {dashboard ? formatCurrency(dashboard.overview.totalRevenue) : '$0'}
              </p>
              <div className={`flex items-center mt-2 ${dashboard ? getGrowthColor(dashboard.overview.growthRate) : 'text-gray-600'}`}>
                {dashboard ? getGrowthIcon(dashboard.overview.growthRate) : null}
                <span className="text-sm ml-1">
                  {dashboard ? formatPercentage(dashboard.overview.growthRate) : '0%'}
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
                {dashboard ? dashboard.overview.totalOrders.toLocaleString() : '0'}
              </p>
              <div className="flex items-center mt-2 text-gray-600">
                <span className="text-sm ml-1">
                  Total orders
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
                {dashboard ? dashboard.overview.totalCustomers.toLocaleString() : '0'}
              </p>
              <div className="flex items-center mt-2 text-gray-600">
                <span className="text-sm ml-1">
                  Total customers
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
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboard ? dashboard.overview.conversionRate.toFixed(1) + '%' : '0%'}
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
            {(dashboard?.conversionFunnel || []).map((status, index) => (
              <div key={status.stage} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ 
                      backgroundColor: `hsl(${index * 45}, 70%, 50%)` 
                    }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {status.stage.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{status.count}</div>
                  <div className="text-xs text-gray-500">{(status.conversionRate || 0).toFixed(1)}%</div>
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
            {(dashboard?.topProducts || []).slice(0, 5).map((product, index) => (
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
                      {product.orders} orders
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
      {dashboard?.salesTrends && Array.isArray(dashboard.salesTrends) && dashboard.salesTrends.length > 0 && (
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
                {(dashboard?.salesTrends || []).map((month, index) => (
                  <tr key={`month-${month.date}`} className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-900">{month.date}</td>
                    <td className="py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(month.revenue)}
                    </td>
                    <td className="py-3 text-sm text-gray-900 text-right">
                      {month.orders.toLocaleString()}
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
      {dashboard?.customerSegments && Array.isArray(dashboard.customerSegments) && dashboard.customerSegments.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Customer Segments</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Segment</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Customers</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Percentage</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Avg Value</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard?.customerSegments || []).map((category, index) => (
                  <tr key={`segment-${category.segment}`} className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-900 capitalize">{category.segment}</td>
                    <td className="py-3 text-sm text-gray-900 text-right">
                      {category.count}
                    </td>
                    <td className="py-3 text-sm text-gray-900 text-right">
                      {category.percentage}%
                    </td>
                    <td className="py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(category.averageValue)}
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