import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Ticket, 
  Copy, 
  Clock, 
  Tag, 
  Percent, 
  DollarSign, 
  ShoppingCart,
  ArrowLeft,
  Gift,
  Star,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import { couponService } from '../services/couponService';
import { formatPrice } from '../utils/currency';
import { useAuth } from '../contexts/AuthContext';

interface Coupon {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  validUntil: string;
}

const Coupons: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Auth state:', { isAuthenticated, user: !!user });
      
      // Always try public coupons first, then fall back to authenticated if needed
      try {
        const publicCoupons = await couponService.getPublicCoupons();
        console.log('Public coupons fetched:', publicCoupons);
        setCoupons(publicCoupons);
      } catch (publicError) {
        console.error('Public coupons failed, trying authenticated:', publicError);
        if (isAuthenticated) {
          const availableCoupons = await couponService.getAvailableCoupons();
          console.log('Authenticated coupons fetched:', availableCoupons);
          setCoupons(availableCoupons);
        } else {
          throw publicError;
        }
      }
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      setError('Failed to load coupons. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleApplyCoupon = async (code: string) => {
    if (!isAuthenticated) {
      // Store the coupon code for after login
      localStorage.setItem('pendingCouponCode', code);
      const shouldLogin = confirm(`To apply coupon "${code}", you need to login first. Would you like to login now?`);
      if (shouldLogin) {
        navigate('/login?redirect=coupons&coupon=' + encodeURIComponent(code));
      }
      return;
    }

    try {
      setApplyingCoupon(code);
      const result = await couponService.applyCoupon(code);
      
      if (result.success) {
        // Clear any pending coupon
        localStorage.removeItem('pendingCouponCode');
        alert(`🎉 Coupon "${code}" applied successfully! You saved ${formatPrice(result.discount)}`);
        navigate('/cart');
      } else {
        alert(result.message || 'Failed to apply coupon');
      }
    } catch (error: any) {
      console.error('Error applying coupon:', error);
      if (error.response?.status === 401) {
        alert('Your session has expired. Please login again to apply coupons.');
        localStorage.setItem('pendingCouponCode', code);
        navigate('/login?redirect=coupons&coupon=' + encodeURIComponent(code));
      } else if (error.response?.status === 400) {
        alert(error.response?.data?.message || 'Invalid coupon code or coupon requirements not met.');
      } else {
        alert('Failed to apply coupon. Please check your internet connection and try again.');
      }
    } finally {
      setApplyingCoupon(null);
    }
  };

  const getCouponIcon = (discountType: string) => {
    switch (discountType) {
      case 'percentage':
        return <Percent className="w-5 h-5" />;
      case 'fixed':
        return <DollarSign className="w-5 h-5" />;
      default:
        return <Tag className="w-5 h-5" />;
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}% OFF`;
    } else {
      return `${formatPrice(coupon.discountValue)} OFF`;
    }
  };

  const formatValidUntil = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isExpiringSoon = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  const isExpired = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    return date < now;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center">
                <Gift className="w-6 h-6 text-blue-600 mr-2" />
                <h1 className="text-xl font-semibold text-gray-900">All Coupons</h1>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {coupons.length} {coupons.length === 1 ? 'coupon' : 'coupons'} available
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-blue-500 mr-2" />
              <div>
                <p className="text-blue-700 font-medium">Login Required</p>
                <p className="text-blue-600 text-sm">Please login to view and apply available coupons.</p>
              </div>
            </div>
          </div>
        )}

        {coupons.length === 0 && !error ? (
          <div className="text-center py-12">
            <Ticket className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isAuthenticated ? 'No Coupons Available' : 'Login to View Coupons'}
            </h3>
            <p className="text-gray-600 mb-6">
              {isAuthenticated 
                ? 'Add items to your cart to see applicable coupons.' 
                : 'Please login and add items to your cart to see available coupons.'}
            </p>
            <button
              onClick={() => navigate(isAuthenticated ? '/' : '/login')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isAuthenticated ? 'Continue Shopping' : 'Login Now'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon, index) => {
              const expired = isExpired(coupon.validUntil);
              const expiringSoon = isExpiringSoon(coupon.validUntil);
              const isCopied = copiedCode === coupon.code;
              const isApplying = applyingCoupon === coupon.code;

              return (
                <div
                  key={index}
                  className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
                    expired ? 'border-gray-200 opacity-60' : 'border-blue-100 hover:border-blue-200'
                  }`}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg ${
                          expired ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {getCouponIcon(coupon.discountType)}
                        </div>
                        <div className="ml-3">
                          <h3 className={`font-semibold ${
                            expired ? 'text-gray-400' : 'text-gray-900'
                          }`}>
                            {formatDiscount(coupon)}
                          </h3>
                          {expiringSoon && !expired && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Expires Soon
                            </span>
                          )}
                          {expired && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Expired
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className={`text-sm mb-4 ${
                      expired ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {coupon.description}
                    </p>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className={`flex items-center text-xs ${
                        expired ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Minimum order: {formatPrice(coupon.minOrderAmount)}
                      </div>
                      {coupon.maxDiscountAmount && (
                        <div className={`flex items-center text-xs ${
                          expired ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          <Star className="w-3 h-3 mr-1" />
                          Max discount: {formatPrice(coupon.maxDiscountAmount)}
                        </div>
                      )}
                      <div className={`flex items-center text-xs ${
                        expired ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <Clock className="w-3 h-3 mr-1" />
                        Valid until: {formatValidUntil(coupon.validUntil)}
                      </div>
                    </div>

                    {/* Coupon Code */}
                    <div className={`border-2 border-dashed rounded-lg p-3 mb-4 ${
                      expired ? 'border-gray-200 bg-gray-50' : 'border-blue-200 bg-blue-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-mono font-bold text-lg ${
                          expired ? 'text-gray-400' : 'text-blue-600'
                        }`}>
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          disabled={expired}
                          className={`flex items-center px-3 py-1 rounded text-xs font-medium transition-colors ${
                            expired 
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : isCopied
                                ? 'bg-green-100 text-green-700'
                                : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-200'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleApplyCoupon(coupon.code)}
                      disabled={expired || isApplying || !isAuthenticated}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        expired || !isAuthenticated
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : isApplying
                            ? 'bg-blue-400 text-white cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isApplying ? (
                        <div className="flex items-center justify-center">
                          <Loader className="w-4 h-4 animate-spin mr-2" />
                          Applying...
                        </div>
                      ) : expired ? (
                        'Expired'
                      ) : !isAuthenticated ? (
                        'Login to Apply'
                      ) : (
                        <div className="flex items-center justify-center">
                          <Zap className="w-4 h-4 mr-2" />
                          Apply Coupon
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Coupons;