import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Eye,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Percent,
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Copy,
  Settings,
  BarChart3
} from 'lucide-react';
import { couponService } from '../services/couponService';
import type {
  Coupon,
  CouponAnalytics
} from '../services/couponService';

const Coupons: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'coupons' | 'create' | 'analytics'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Overview data
  const [analytics, setAnalytics] = useState<CouponAnalytics | null>(null);
  
  // Coupons data
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsPage, setCouponsPage] = useState(1);
  const [couponsTotalPages, setCouponsTotalPages] = useState(1);
  const [couponsFilters, setCouponsFilters] = useState({
    isActive: '',
    discountType: '',
    search: ''
  });
  
  // Create/Edit coupon
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    maxBonusCap: 0,
    usageLimit: 1,
    validFrom: '',
    validUntil: '',
    isActive: true,
    showOnWebsite: true
  });

  useEffect(() => {
    loadData();
  }, [activeTab, couponsPage, couponsFilters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      switch (activeTab) {
        case 'overview':
        case 'analytics':
          const analyticsData = await couponService.getCouponAnalytics();
          setAnalytics(analyticsData);
          break;
          
        case 'coupons':
          // Convert string filters to proper types for API
          const apiFilters: any = {
            page: couponsPage,
            limit: 20,
            search: couponsFilters.search || undefined,
            discountType: couponsFilters.discountType || undefined
          };
          
          // Handle isActive filter conversion
          if (couponsFilters.isActive === 'true') {
            apiFilters.isActive = true;
          } else if (couponsFilters.isActive === 'false') {
            apiFilters.isActive = false;
          }
          // If empty string, don't include isActive (show all)
          
          const couponsData = await couponService.getCoupons(apiFilters);
          setCoupons(couponsData.coupons);
          setCouponsTotalPages(couponsData.pagination.pages);
          break;
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingCoupon) {
        await couponService.updateCoupon(editingCoupon._id, couponForm);
      } else {
        await couponService.createCoupon(couponForm);
      }
      
      setShowCouponModal(false);
      setEditingCoupon(null);
      resetCouponForm();
      loadData();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      await couponService.deleteCoupon(couponId);
      loadData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleToggleCouponStatus = async (couponId: string) => {
    try {
      await couponService.toggleCouponStatus(couponId);
      loadData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleCloneCoupon = (coupon: Coupon) => {
    // Generate a new code by appending _COPY to the original
    const newCode = `${coupon.code}_COPY`;
    
    // Pre-fill the form with cloned data
    setCouponForm({
      code: newCode,
      description: `${coupon.description} (Copy)`,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      maxBonusCap: coupon.maxBonusCap || 0,
      usageLimit: coupon.usageLimit,
      validFrom: new Date().toISOString().split('T')[0], // Set to today
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      isActive: true,
      showOnWebsite: coupon.showOnWebsite ?? true
    });
    
    // Clear editing state and open modal for creating new coupon
    setEditingCoupon(null);
    setShowCouponModal(true);
  };

  const resetCouponForm = () => {
    setCouponForm({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      maxBonusCap: 0,
      usageLimit: 1,
      validFrom: '',
      validUntil: '',
      isActive: true,
      showOnWebsite: true
    });
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      maxBonusCap: coupon.maxBonusCap || 0,
      usageLimit: coupon.usageLimit,
      validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
      validUntil: new Date(coupon.validUntil).toISOString().split('T')[0],
      isActive: coupon.isActive,
      showOnWebsite: coupon.showOnWebsite ?? true
    });
    setShowCouponModal(true);
  };

  const getStatusIcon = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    
    if (!coupon.isActive) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    
    if (now < validFrom) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }
    
    if (now > validUntil) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    
    if (coupon.usedCount >= coupon.usageLimit) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    
    if (!coupon.isActive) return 'Inactive';
    if (now < validFrom) return 'Scheduled';
    if (now > validUntil) return 'Expired';
    if (coupon.usedCount >= coupon.usageLimit) return 'Exhausted';
    return 'Active';
  };

  const getStatusColor = (coupon: Coupon) => {
    const status = getStatusText(coupon);
    switch (status) {
      case 'Active':
        return 'text-green-600 bg-green-100';
      case 'Scheduled':
        return 'text-yellow-600 bg-yellow-100';
      case 'Inactive':
      case 'Expired':
      case 'Exhausted':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (loading && !analytics && !coupons.length) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading coupon data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discount & Coupon Management</h1>
        <p className="text-gray-600">Create and manage promotional coupons and discount codes</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'coupons', label: 'Coupons', icon: Ticket },
              { id: 'create', label: 'Create Coupon', icon: Plus },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
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
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
            <button
              onClick={loadData}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Coupons</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalCoupons}</p>
                </div>
                <Ticket className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Coupons</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.activeCoupons}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expired Coupons</p>
                  <p className="text-2xl font-bold text-red-600">{analytics.expiredCoupons}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Usage</p>
                  <p className="text-2xl font-bold text-purple-600">{analytics.totalUsage}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Top Coupons */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Top Performing Coupons</h3>
            <div className="space-y-3">
              {analytics.topCoupons.map((coupon, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{coupon.code}</div>
                      <div className="text-sm text-gray-500">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} discount
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{coupon.usedCount} uses</div>
                    <div className="text-sm text-gray-500">Total redemptions</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Coupons</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalCoupons}</p>
                </div>
                <Ticket className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Coupons</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.activeCoupons}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expired Coupons</p>
                  <p className="text-2xl font-bold text-red-600">{analytics.expiredCoupons}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Usage</p>
                  <p className="text-2xl font-bold text-purple-600">{analytics.totalUsage}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Coupons */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                Top Performing Coupons
              </h3>
              <div className="space-y-3">
                {analytics.topCoupons.map((coupon, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{coupon.code}</div>
                        <div className="text-sm text-gray-500">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} discount
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{coupon.usedCount} uses</div>
                      <div className="text-sm text-gray-500">Total redemptions</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coupon Performance Metrics */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
                Performance Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Active Rate</div>
                    <div className="text-sm text-gray-500">Percentage of active coupons</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      {analytics.totalCoupons > 0 ? Math.round((analytics.activeCoupons / analytics.totalCoupons) * 100) : 0}%
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Average Usage</div>
                    <div className="text-sm text-gray-500">Average uses per coupon</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-blue-600">
                      {analytics.totalCoupons > 0 ? Math.round(analytics.totalUsage / analytics.totalCoupons) : 0}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Expiry Rate</div>
                    <div className="text-sm text-gray-500">Percentage of expired coupons</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-red-600">
                      {analytics.totalCoupons > 0 ? Math.round((analytics.expiredCoupons / analytics.totalCoupons) * 100) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Distribution */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-indigo-500" />
              Usage Distribution
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{analytics.activeCoupons}</div>
                <div className="text-sm text-green-700">Active & Available</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{analytics.totalUsage}</div>
                <div className="text-sm text-yellow-700">Total Redemptions</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{analytics.expiredCoupons}</div>
                <div className="text-sm text-red-700">Expired/Inactive</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coupons Tab */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search coupons..."
                    value={couponsFilters.search}
                    onChange={(e) => setCouponsFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <select
                  value={couponsFilters.isActive}
                  onChange={(e) => setCouponsFilters(prev => ({ ...prev, isActive: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              
              <div>
                <select
                  value={couponsFilters.discountType}
                  onChange={(e) => setCouponsFilters(prev => ({ ...prev, discountType: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              
              <button
                onClick={() => {
                  setShowCouponModal(true);
                  setEditingCoupon(null);
                  resetCouponForm();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Coupon</span>
              </button>
            </div>
          </div>

          {/* Coupons Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {coupons.length === 0 ? (
              <div className="p-8 text-center">
                <Ticket className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Coupons Found</h3>
                <p className="text-gray-600">Create your first coupon to start offering discounts.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Coupon Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Discount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valid Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Website
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {coupons.map((coupon) => (
                        <tr key={coupon._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">{coupon.description}</div>
                              </div>
                              <button
                                onClick={() => copyToClipboard(coupon.code)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Copy code"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {coupon.discountType === 'percentage' ? (
                                <span className="flex items-center">
                                  <Percent className="w-4 h-4 mr-1" />
                                  {coupon.discountValue}%
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  ₹{coupon.discountValue}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              Min: ₹{coupon.minOrderAmount}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {coupon.usedCount} / {coupon.usageLimit}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min((coupon.usedCount / coupon.usageLimit) * 100, 100)}%`
                                }}
                              ></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{new Date(coupon.validFrom).toLocaleDateString()}</div>
                            <div>to {new Date(coupon.validUntil).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              getStatusColor(coupon)
                            }`}>
                              {getStatusIcon(coupon)}
                              <span className="ml-1">{getStatusText(coupon)}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              coupon.showOnWebsite ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {coupon.showOnWebsite ? (
                                <Eye className="w-3 h-3 mr-1" />
                              ) : (
                                <Eye className="w-3 h-3 mr-1 opacity-50" />
                              )}
                              {coupon.showOnWebsite ? 'Visible' : 'Hidden'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openEditModal(coupon)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit coupon"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleToggleCouponStatus(coupon._id)}
                                className={`${coupon.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                                title={coupon.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {coupon.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => handleCloneCoupon(coupon)}
                                className="text-purple-600 hover:text-purple-900"
                                title="Clone coupon"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(coupon._id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete coupon"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {couponsTotalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCouponsPage(Math.max(1, couponsPage - 1))}
                        disabled={couponsPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCouponsPage(Math.min(couponsTotalPages, couponsPage + 1))}
                        disabled={couponsPage === couponsTotalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Page <span className="font-medium">{couponsPage}</span> of{' '}
                          <span className="font-medium">{couponsTotalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          {Array.from({ length: Math.min(5, couponsTotalPages) }, (_, i) => {
                            const page = i + 1;
                            return (
                              <button
                                key={page}
                                onClick={() => setCouponsPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  couponsPage === page
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </h2>
              <button
                onClick={() => {
                  setShowCouponModal(false);
                  setEditingCoupon(null);
                  resetCouponForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., SAVE20"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, discountType: e.target.value as 'percentage' | 'fixed' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={couponForm.description}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe what this coupon offers..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step={couponForm.discountType === 'percentage' ? '1' : '0.01'}
                    max={couponForm.discountType === 'percentage' ? '100' : undefined}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Order Amount
                  </label>
                  <input
                    type="number"
                    value={couponForm.minOrderAmount}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, minOrderAmount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                {couponForm.discountType === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Discount Amount
                    </label>
                    <input
                      type="number"
                      value={couponForm.maxDiscountAmount}
                      onChange={(e) => setCouponForm(prev => ({ ...prev, maxDiscountAmount: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usage Limit *
                  </label>
                  <input
                    type="number"
                    value={couponForm.usageLimit}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, usageLimit: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid From *
                  </label>
                  <input
                    type="date"
                    value={couponForm.validFrom}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, validFrom: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Until *
                  </label>
                  <input
                    type="date"
                    value={couponForm.validUntil}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, validUntil: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Bonus Cap
                </label>
                <input
                  type="number"
                  value={couponForm.maxBonusCap}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, maxBonusCap: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                  placeholder="Maximum bonus amount for this coupon"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Maximum bonus amount that can be earned from this coupon
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={couponForm.isActive}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active (coupon can be used immediately)
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showOnWebsite"
                    checked={couponForm.showOnWebsite}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, showOnWebsite: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showOnWebsite" className="ml-2 block text-sm text-gray-900">
                    Show on Website (display this coupon to customers)
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCouponModal(false);
                    setEditingCoupon(null);
                    resetCouponForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingCoupon ? 'Update Coupon' : 'Create Coupon')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;