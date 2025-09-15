import React, { useState } from 'react';
import { Ticket, X, Check, AlertCircle, Loader } from 'lucide-react';
import { couponService } from '../services/couponService';

interface CouponInputProps {
  onCouponApplied: (discount: number, couponCode: string) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: string;
  appliedDiscount?: number;
  disabled?: boolean;
  className?: string;
}

const CouponInput: React.FC<CouponInputProps> = ({
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
  appliedDiscount = 0,
  disabled = false,
  className = ''
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const result = await couponService.applyCoupon(couponCode.trim());
      
      if (result.success) {
        setSuccess(result.message || 'Coupon applied successfully!');
        setCouponCode('');
        onCouponApplied(result.discount, result.coupon?.code || couponCode.trim());
      } else {
        setError(result.message || 'Failed to apply coupon');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to apply coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await couponService.removeCoupon();
      setSuccess('Coupon removed successfully');
      onCouponRemoved();
    } catch (error: any) {
      setError(error.message || 'Failed to remove coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && !disabled && !appliedCoupon) {
      handleApplyCoupon();
    }
  };

  // Clear messages after 3 seconds
  React.useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Applied Coupon Display */}
      {appliedCoupon && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Ticket className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-green-900">
                  Coupon Applied: {appliedCoupon}
                </div>
                <div className="text-sm text-green-700">
                  You saved ₹{appliedDiscount.toFixed(2)}
                </div>
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              disabled={loading || disabled}
              className="text-green-600 hover:text-green-800 disabled:opacity-50"
              title="Remove coupon"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Coupon Input */}
      {!appliedCoupon && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Ticket className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Have a coupon code?</span>
          </div>
          
          <div className="flex space-x-2">
            <div className="flex-1">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setError(null);
                  setSuccess(null);
                }}
                onKeyPress={handleKeyPress}
                placeholder="Enter coupon code"
                disabled={loading || disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <button
              onClick={handleApplyCoupon}
              disabled={loading || disabled || !couponCode.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Apply</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponInput;