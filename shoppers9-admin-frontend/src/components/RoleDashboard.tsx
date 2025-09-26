import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

import CountUp from 'react-countup';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface DashboardData {
  overview: {
    [key: string]: number | string;
  };
  recentOrders?: any[];
  topProducts?: any[];
  charts?: {
    userGrowth?: any[];
    salesTrend?: any[];
  };
  userRole: string;
  scope: string;
  lastUpdated: string;
}

const RoleDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard/analytics', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      });
      setDashboardData(response.data.data);
      setError(null);
    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getMetricIcon = (key: string) => {
    switch (key) {
      case 'totalUsers':
      case 'myCustomers':
        return <Users className="h-6 w-6" />;
      case 'totalProducts':
      case 'myProducts':
        return <Package className="h-6 w-6" />;
      case 'totalOrders':
      case 'myOrders':
      case 'pendingOrders':
        return <ShoppingCart className="h-6 w-6" />;
      case 'totalRevenue':
      case 'myRevenue':
      case 'totalSpent':
      case 'averageOrderValue':
        return <DollarSign className="h-6 w-6" />;
      case 'supportTickets':
        return <AlertCircle className="h-6 w-6" />;
      case 'processingRate':
        return <CheckCircle className="h-6 w-6" />;
      default:
        return <TrendingUp className="h-6 w-6" />;
    }
  };

  const formatMetricValue = (key: string, value: number | string) => {
    if (typeof value === 'string') return value;
    
    if (key.includes('Revenue') || key.includes('Spent') || key.includes('Value')) {
      return `$${value.toLocaleString()}`;
    }
    if (key.includes('Rate')) {
      return `${value}%`;
    }
    return value.toLocaleString();
  };

  const getMetricLabel = (key: string) => {
    const labels: { [key: string]: string } = {
      totalUsers: 'Total Users',
      totalProducts: 'Total Products',
      totalOrders: 'Total Orders',
      totalRevenue: 'Total Revenue',
      myProducts: 'My Products',
      myOrders: 'My Orders',
      myRevenue: 'My Revenue',
      myCustomers: 'My Customers',
      totalSpent: 'Total Spent',
      pendingOrders: 'Pending Orders',
      supportTickets: 'Support Tickets',
      processingRate: 'Processing Rate',
      averageOrderValue: 'Avg Order Value'
    };
    return labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const getScopeTitle = (scope: string, role: string) => {
    switch (scope) {
      case 'global':
        return 'Global System Overview';
      case 'own':
        return role === 'admin' ? 'My Business Dashboard' : 'My Shop Dashboard';
      case 'operational':
        return 'Operations Dashboard';
      case 'personal':
        return 'My Account Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const getScopeDescription = (scope: string, role: string) => {
    switch (scope) {
      case 'global':
        return 'Complete overview of all platform activity and metrics';
      case 'own':
        return role === 'admin' ? 'Your personal business metrics and performance' : 'Your shop performance and sales data';
      case 'operational':
        return 'System operations and support metrics';
      case 'personal':
        return 'Your personal order history and account activity';
      default:
        return 'Dashboard overview';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <h3 className="text-red-800 font-medium">Error Loading Dashboard</h3>
        </div>
        <p className="text-red-600 mt-2">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No dashboard data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-black mb-1">
                {getScopeTitle(dashboardData.scope, dashboardData.userRole)}
              </h1>
              <p className="text-gray-600 text-sm">
                {getScopeDescription(dashboardData.scope, dashboardData.userRole)}
              </p>
              <div className="flex items-center mt-2 space-x-2">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">
                  {dashboardData.userRole.replace('_', ' ').toUpperCase()}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">
                  {dashboardData.scope.toUpperCase()} SCOPE
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded p-2">
                <div className="flex items-center space-x-1">
                  <label className="text-xs font-medium text-gray-600">From:</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-black focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  />
                </div>
                <div className="flex items-center space-x-1">
                  <label className="text-xs font-medium text-gray-600">To:</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-black focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {Object.entries(dashboardData.overview).map(([key, value], index) => {
          return (
            <div 
              key={key} 
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              <div className="p-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      {getMetricLabel(key)}
                    </p>
                    <div className="flex items-baseline">
                      <p className="text-xl font-bold text-black">
                        {typeof value === 'number' ? (
                          key.includes('Revenue') || key.includes('Spent') || key.includes('Value') ? (
                            <span>
                              $<CountUp end={value} duration={2} separator="," />
                            </span>
                          ) : key.includes('Rate') ? (
                            <span>
                              <CountUp end={value} duration={2} />%
                            </span>
                          ) : (
                            <CountUp end={value} duration={2} separator="," />
                          )
                        ) : (
                          value
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <div className="text-gray-600">
                      {getMetricIcon(key)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      {dashboardData.charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {dashboardData.charts.salesTrend && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="bg-gray-50 border-b border-gray-200 p-2">
                <h3 className="text-lg font-bold text-black flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-gray-600" />
                  Sales Trend
                </h3>
                <p className="text-gray-600 mt-1 text-sm">Revenue performance over time</p>
              </div>
              <div className="p-2">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={dashboardData.charts.salesTrend}>

                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="_id.day" 
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        color: 'black',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="totalSales" 
                      stroke="#6b7280" 
                      strokeWidth={2}
                      fill="#6b7280"
                      fillOpacity={0.1}
                      dot={{ fill: '#6b7280', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#6b7280', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {dashboardData.charts.userGrowth && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="bg-gray-50 border-b border-gray-200 p-2">
                <h3 className="text-lg font-bold text-black flex items-center">
                  <Users className="h-5 w-5 mr-2 text-gray-600" />
                  User Growth
                </h3>
                <p className="text-gray-600 mt-1 text-sm">New user registrations</p>
              </div>
              <div className="p-2">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dashboardData.charts.userGrowth}>

                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="_id.day" 
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        color: 'black',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#6b7280"
                      fillOpacity={0.7}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Orders */}
      {dashboardData.recentOrders && dashboardData.recentOrders.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-3 py-2">
            <h3 className="text-lg font-bold text-black flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2 text-gray-600" />
              Recent Orders
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {dashboardData.recentOrders.slice(0, 10).map((order, index) => (
                  <tr 
                    key={order._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-xs font-bold text-black">
                        #{order.orderNumber || order._id.slice(-8)}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                          <span className="text-gray-600 text-xs font-bold">
                            {(order.userId?.firstName || 'U')[0]}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-black">
                          {order.userId?.firstName} {order.userId?.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-xs font-bold text-black">
                        ${order.finalAmount?.toLocaleString() || order.totalAmount?.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Products */}
      {dashboardData.topProducts && dashboardData.topProducts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-3 py-2">
            <h3 className="text-lg font-bold text-black flex items-center">
              <Package className="h-5 w-5 mr-2 text-gray-600" />
              Top Products
            </h3>
          </div>
          <div className="p-3">
            <div className="space-y-2">
              {dashboardData.topProducts.slice(0, 5).map((item, index) => {
                return (
                  <div 
                    key={item._id} 
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-700">#{index + 1}</span>
                      </div>
                      <div className="ml-2">
                        <p className="text-sm font-bold text-black">
                          {item.product?.[0]?.name || 'Product Name'}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-gray-600 mr-2">
                            <CountUp end={item.totalSold} duration={2} /> sold
                          </span>
                          <div className="flex items-center">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1"></div>
                            <span className="text-xs text-gray-600 font-medium">Active</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-black">
                        $<CountUp end={item.totalRevenue || 0} duration={2} separator="," />
                      </p>
                      <div className="flex items-center justify-end mt-1">
                        <span className="text-xs text-gray-600 font-medium">Revenue</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default RoleDashboard;