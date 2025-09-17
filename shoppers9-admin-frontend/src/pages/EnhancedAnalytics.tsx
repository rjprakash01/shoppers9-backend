import React, { useState, useEffect, useCallback } from 'react';
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
  Package,
  Globe,
  Smartphone,
  Monitor,
  Brain,
  TrendingUp as Growth,
  Users as UserIcon,
  MapPin,
  Lightbulb
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import type {
  AnalyticsDashboard,
  RevenueReport,
  CustomerReport,
  ConversionReport
} from '../services/analyticsService';

// Chart components (you can replace these with actual chart libraries like Chart.js or Recharts)
const LineChartComponent: React.FC<{ data: any[]; title: string; color?: string }> = ({ data, title, color = '#3B82F6' }) => (
  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
    <div className="text-center">
      <LineChart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
      <p className="text-sm text-gray-500">{title} Chart</p>
      <p className="text-xs text-gray-400">{data.length} data points</p>
    </div>
  </div>
);

const BarChartComponent: React.FC<{ data: any[]; title: string; color?: string }> = ({ data, title, color = '#10B981' }) => (
  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
    <div className="text-center">
      <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
      <p className="text-sm text-gray-500">{title} Chart</p>
      <p className="text-xs text-gray-400">{data.length} data points</p>
    </div>
  </div>
);

const PieChartComponent: React.FC<{ data: any[]; title: string }> = ({ data, title }) => (
  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
    <div className="text-center">
      <PieChart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
      <p className="text-sm text-gray-500">{title} Chart</p>
      <p className="text-xs text-gray-400">{data.length} segments</p>
    </div>
  </div>
);

const EnhancedAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'customers' | 'conversion' | 'realtime' | 'insights'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 90 days to include existing orders
    endDate: new Date().toISOString().split('T')[0]
  });
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'range'>('daily');
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Data states
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);
  const [customerReport, setCustomerReport] = useState<CustomerReport | null>(null);
  const [conversionReport, setConversionReport] = useState<ConversionReport | null>(null);
  const [realtimeData, setRealtimeData] = useState<any>(null);
  const [geographicData, setGeographicData] = useState<any[]>([]);
  const [deviceData, setDeviceData] = useState<any>(null);
  const [hourlyTrends, setHourlyTrends] = useState<any[]>([]);
  const [cohortData, setCohortData] = useState<any[]>([]);
  const [predictiveInsights, setPredictiveInsights] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        period
      };

      const [dashboardData, realtimeAnalytics, geoData, deviceAnalytics, hourlyData, cohortAnalysis, insights] = await Promise.all([
        analyticsService.getDashboard(filters),
        analyticsService.getRealtimeAnalytics(),
        analyticsService.getGeographicAnalytics(filters),
        analyticsService.getDeviceAnalytics(filters),
        analyticsService.getHourlyTrends(filters),
        analyticsService.getCohortAnalysis(filters),
        analyticsService.getPredictiveInsights(filters)
      ]);

      setDashboard(dashboardData);
      setRealtimeData(realtimeAnalytics);
      setGeographicData(geoData);
      setDeviceData(deviceAnalytics);
      setHourlyTrends(hourlyData);
      setCohortData(cohortAnalysis);
      setPredictiveInsights(insights);

      // Load tab-specific data
      if (activeTab === 'revenue') {
        const revenue = await analyticsService.getRevenueReport(filters);
        setRevenueReport(revenue);
      } else if (activeTab === 'customers') {
        const customers = await analyticsService.getCustomerReport(filters);
        setCustomerReport(customers);
      } else if (activeTab === 'conversion') {
        const conversion = await analyticsService.getConversionReport(filters);
        setConversionReport(conversion);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [dateRange, period, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Smart date range logic
  const handlePeriodChange = (newPeriod: 'daily' | 'weekly' | 'monthly' | 'range') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (newPeriod === 'daily') {
      setDateRange({
        startDate: todayStr,
        endDate: todayStr
      });
    } else if (newPeriod === 'weekly') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      setDateRange({
        startDate: weekAgo.toISOString().split('T')[0],
        endDate: todayStr
      });
    } else if (newPeriod === 'monthly') {
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setDateRange({
        startDate: firstOfMonth.toISOString().split('T')[0],
        endDate: todayStr
      });
    }
    
    setPeriod(newPeriod);
  };
  
  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
    // Auto-switch to 'range' when dates are manually changed
    if (period !== 'range') {
      setPeriod('range');
    }
  };

  // Auto-reload data when date range or period changes
  useEffect(() => {
    loadData();
  }, [dateRange.startDate, dateRange.endDate, period]);

  // Auto-refresh for real-time data
  useEffect(() => {
    if (autoRefresh && activeTab === 'realtime') {
      const interval = setInterval(async () => {
        try {
          const realtimeAnalytics = await analyticsService.getRealtimeAnalytics();
          setRealtimeData(realtimeAnalytics);
        } catch (error) {
          console.error('Error refreshing real-time data:', error);
        }
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, activeTab]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    } else if (growth < 0) {
      return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    }
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'conversion', label: 'Conversion', icon: Target },
    { id: 'realtime', label: 'Real-time', icon: Activity },
    { id: 'insights', label: 'AI Insights', icon: Brain }
  ];

  if (loading) {
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
            onClick={loadData}
            className="ml-4 text-red-600 hover:text-red-800"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
            />
          </div>
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value as 'daily' | 'weekly' | 'monthly' | 'range')}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="range">Date Range</option>
          </select>
          <button
            onClick={loadData}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && dashboard && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard.overview.totalRevenue)}</p>
                  <div className="flex items-center mt-1">
                    {getGrowthIcon(dashboard.overview.growthRate)}
                    <span className={`text-sm ml-1 ${getGrowthColor(dashboard.overview.growthRate)}`}>
                      {formatPercentage(Math.abs(dashboard.overview.growthRate))}
                    </span>
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(dashboard.overview.totalOrders)}</p>
                  <div className="flex items-center mt-1">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-blue-600 ml-1">Active</span>
                  </div>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(dashboard.overview.totalCustomers)}</p>
                  <div className="flex items-center mt-1">
                    <UserIcon className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-purple-600 ml-1">
                      {dashboard.overview.newVsReturning?.newPercentage || 0}% new
                    </span>
                  </div>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPercentage(dashboard.overview.conversionRate)}</p>
                  <div className="flex items-center mt-1">
                    <Target className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-orange-600 ml-1">Optimized</span>
                  </div>
                </div>
                <Target className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Trends</h3>
              <LineChartComponent data={dashboard.salesTrends} title="Revenue Over Time" />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Traffic Sources</h3>
              <PieChartComponent data={dashboard.trafficSources} title="Traffic Distribution" />
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Top Performing Products</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboard.topProducts.slice(0, 5).map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.productName}</p>
                        <p className="text-sm text-gray-500">{formatPercentage(product.conversionRate)} conversion rate</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(product.revenue)}</p>
                      <p className="text-sm text-gray-500">{formatNumber(product.orders)} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Tab */}
      {activeTab === 'realtime' && realtimeData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Real-time Analytics</h2>
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Auto-refresh</span>
              </label>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-xs text-gray-500">Live</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-3xl font-bold text-gray-900">{formatNumber(realtimeData.activeUsers)}</p>
                  <p className="text-xs text-gray-500 mt-1">Last hour</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Orders (24h)</p>
                  <p className="text-3xl font-bold text-gray-900">{formatNumber(realtimeData.ordersLast24h)}</p>
                  <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue (24h)</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(realtimeData.revenueLast24h)}</p>
                  <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Live Events */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Live Events</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {realtimeData.topEvents.map((event: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-900">{event._id}</span>
                    </div>
                    <span className="text-sm text-gray-500">{event.count} events</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Tab */}
      {activeTab === 'insights' && predictiveInsights && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">AI-Powered Insights</h2>
          </div>

          {/* Predictive Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Revenue Growth Trend</p>
                  <p className="text-3xl font-bold">{formatPercentage(predictiveInsights.revenueGrowthTrend)}</p>
                  <p className="text-purple-100 text-sm mt-1">Predicted trend</p>
                </div>
                <Growth className="w-8 h-8 text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Next Month Revenue</p>
                  <p className="text-3xl font-bold">{formatCurrency(predictiveInsights.predictedNextMonthRevenue)}</p>
                  <p className="text-blue-100 text-sm mt-1">AI prediction</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Customer Segments</p>
                  <p className="text-3xl font-bold">{predictiveInsights.customerSegmentInsights.length}</p>
                  <p className="text-green-100 text-sm mt-1">Active segments</p>
                </div>
                <Users className="w-8 h-8 text-green-200" />
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-medium text-gray-900">AI Recommendations</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {predictiveInsights.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-900">{recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAnalytics;