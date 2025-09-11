import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [, setOtpSent] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Please enter your mobile number');
      return;
    }

    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    setError('');

    // For test phone number 1234567890, skip OTP sending and go directly to OTP screen
    if (phone === '1234567890') {
      
      setOtpSent(true);
      setStep('otp');
      setIsLoading(false);
      return;
    }

    try {
      // Send phone number with +91 prefix to backend
      
      const response = await authService.sendOTP(phone);
      
      setOtpSent(true);
      setStep('otp');
    } catch (error: any) {
      
      setError(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    // For test phone number 1234567890, accept OTP 1234 directly
    if (phone === '1234567890' && otp === '1234') {
      try {
        await login(phone, otp);
        navigate(from, { replace: true });
        return;
      } catch (error: any) {
        // If backend verification fails, still proceed for test user
        
        navigate(from, { replace: true });
        return;
      }
    }

    try {
      await login(phone, otp);
      navigate(from, { replace: true });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Invalid OTP';
      
      // If the error is about name being required for new users, redirect to signup
      if (errorMessage.includes('Name is required for new users')) {
        navigate('/signup', { 
          state: { 
            phone: phone,
            message: 'Please complete your registration to continue'
          }
        });
        return;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');

    try {
      await authService.sendOTP(phone);
      setError('');
      // Show success message or toast
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setError('');
    setOtpSent(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {step === 'phone' ? 'Sign in to your account' : 'Verify your phone'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 'phone' 
            ? 'Enter your mobile number to receive an OTP'
            : `We sent a verification code to +91 ${phone}`
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Mobile Number
                </label>
                <div className="mt-1 relative">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={`+91 ${phone}`}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.startsWith('+91 ')) {
                        const phoneNumber = value.slice(4).replace(/\D/g, ''); // Remove +91 and non-digits
                        if (phoneNumber.length <= 10) {
                          setPhone(phoneNumber);
                        }
                      }
                    }}
                    onFocus={(e) => {
                      // Position cursor after +91 
                      if (e.target.value === '+91 ') {
                        setTimeout(() => {
                          e.target.setSelectionRange(4, 4);
                        }, 0);
                      }
                    }}
                    placeholder="+91 9876543210"
                    className="input-field"
                    disabled={isLoading}
                    maxLength={14}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter your 10-digit mobile number
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 4-digit code"
                    maxLength={4}
                    className="input-field pl-10 text-center text-lg tracking-widest"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleBackToPhone}
                  className="text-primary-600 hover:text-primary-500"
                >
                  Change mobile number
                </button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-primary-600 hover:text-primary-500 disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to Shoppers9?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/signup"
                className="w-full flex justify-center py-2 px-4 border border-primary-600 rounded-md shadow-sm text-sm font-medium text-primary-600 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Create new account
              </Link>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                By continuing, you agree to our{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;