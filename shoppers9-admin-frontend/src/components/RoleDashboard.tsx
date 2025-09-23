import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { motion } from 'framer-motion';
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
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 rounded-lg shadow-lg overflow-hidden"
      >
        <div className="relative p-3">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl font-bold text-white mb-1"
              >
                {getScopeTitle(dashboardData.scope, dashboardData.userRole)}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-slate-300 text-sm"
              >
                {getScopeDescription(dashboardData.scope, dashboardData.userRole)}
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex items-center mt-2 space-x-2"
              >
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {dashboardData.userRole.replace('_', ' ').toUpperCase()}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {dashboardData.scope.toUpperCase()} SCOPE
                </span>
              </motion.div>
            </div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center space-x-2"
            >
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg p-2">
                <div className="flex items-center space-x-1">
                  <label className="text-xs font-medium text-slate-300">From:</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="bg-white/20 border border-white/30 rounded px-2 py-1 text-xs text-white placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-1">
                  <label className="text-xs font-medium text-slate-300">To:</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="bg-white/20 border border-white/30 rounded px-2 py-1 text-xs text-white placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {Object.entries(dashboardData.overview).map(([key, value], index) => {
          const gradients = [
            'from-blue-500 to-blue-600',
            'from-emerald-500 to-emerald-600', 
            'from-purple-500 to-purple-600',
            'from-orange-500 to-orange-600',
            'from-pink-500 to-pink-600',
            'from-indigo-500 to-indigo-600',
            'from-teal-500 to-teal-600',
            'from-red-500 to-red-600'
          ];
          const gradient = gradients[index % gradients.length];
          
          return (
            <motion.div 
              key={key} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group"
            >
              <div className="p-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      {getMetricLabel(key)}
                    </p>
                    <div className="flex items-baseline">
                      <p className="text-xl font-bold text-gray-900">
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
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="ml-2"
                      >
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      </motion.div>
                    </div>
                  </div>
                  <div className={`p-2 bg-gradient-to-br ${gradient} rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <div className="text-white">
                      {getMetricIcon(key)}
                    </div>
                  </div>
                </div>
              </div>
              <div className={`h-1 bg-gradient-to-r ${gradient}`}></div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      {dashboardData.charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {dashboardData.charts.salesTrend && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Sales Trend
                </h3>
                <p className="text-blue-100 mt-1 text-sm">Revenue performance over time</p>
              </div>
              <div className="p-2">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={dashboardData.charts.salesTrend}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
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
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="totalSales" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      fill="url(#salesGradient)"
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {dashboardData.charts.userGrowth && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-3">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  User Growth
                </h3>
                <p className="text-emerald-100 mt-1 text-sm">New user registrations</p>
              </div>
              <div className="p-3">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dashboardData.charts.userGrowth}>
                    <defs>
                      <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
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
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="url(#userGradient)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Recent Orders */}
      {dashboardData.recentOrders && dashboardData.recentOrders.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3">
            <h3 className="text-lg font-bold text-white flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Recent Orders
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
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
                  <motion.tr 
                    key={order._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 + index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-xs font-bold text-indigo-600">
                        #{order.orderNumber || order._id.slice(-8)}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-6 w-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-2">
                          <span className="text-white text-xs font-bold">
                            {(order.userId?.firstName || 'U')[0]}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-gray-900">
                          {order.userId?.firstName} {order.userId?.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-xs font-bold text-gray-900">
                        ${order.finalAmount?.toLocaleString() || order.totalAmount?.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full ${
                        order.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        order.orderStatus === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Top Products */}
      {dashboardData.topProducts && dashboardData.topProducts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-orange-500 to-pink-600 px-4 py-3">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Top Products
            </h3>
          </div>
          <div className="p-3">
            <div className="space-y-2">
              {dashboardData.topProducts.slice(0, 5).map((item, index) => {
                const rankColors = [
                  'from-yellow-400 to-orange-500', // Gold
                  'from-gray-300 to-gray-500',     // Silver
                  'from-orange-400 to-red-500',    // Bronze
                  'from-blue-400 to-indigo-500',   // Blue
                  'from-purple-400 to-pink-500'    // Purple
                ];
                const rankColor = rankColors[index] || 'from-gray-400 to-gray-600';
                
                return (
                  <motion.div 
                    key={item._id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                    className="flex items-center justify-between p-2 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 w-8 h-8 bg-gradient-to-br ${rankColor} rounded-lg flex items-center justify-center shadow-md`}>
                        <span className="text-sm font-bold text-white">#{index + 1}</span>
                      </div>
                      <div className="ml-2">
                        <p className="text-sm font-bold text-gray-900">
                          {item.product?.[0]?.name || 'Product Name'}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-gray-600 mr-2">
                            <CountUp end={item.totalSold} duration={2} /> sold
                          </span>
                          <div className="flex items-center">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></div>
                            <span className="text-xs text-green-600 font-medium">Active</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        $<CountUp end={item.totalRevenue || 0} duration={2} separator="," />
                      </p>
                      <div className="flex items-center justify-end mt-1">
                        <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-xs text-green-600 font-medium">Revenue</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}


    </div>
  );
};

export default RoleDashboard;