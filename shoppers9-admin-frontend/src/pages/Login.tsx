import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Mail,
  Lock,
  Phone,
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  Smartphone,
  Key,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import axios from 'axios';

interface DemoCredentials {
  superAdmin: {
    email: string;
    phone: string;
    password: string;
    role: string;
    description: string;
  };
  admin: {
    email: string;
    phone: string;
    password: string;
    role: string;
    description: string;
  };
  subAdmin: {
    email: string;
    phone: string;
    password: string;
    role: string;
    description: string;
  };
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, user, token } = useAuth();
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [demoCredentials, setDemoCredentials] = useState<DemoCredentials | null>(null);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);
  
  // Form states
  const [emailForm, setEmailForm] = useState({
    email: '',
    password: ''
  });
  
  const [phoneForm, setPhoneForm] = useState({
    phone: '',
    otp: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // OTP timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Redirect if already authenticated
  useEffect(() => {
    console.log('🚀 Login: useEffect triggered - user:', !!user, 'token:', !!token);
    if (user && token) {
      console.log('🚀 Login: User authenticated, waiting before redirect...');
      // Add a small delay to prevent request abortion
      const timer = setTimeout(() => {
        console.log('🚀 Login: Now redirecting to dashboard...');
        navigate('/dashboard', { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, token, navigate]);

  // Load demo credentials
  useEffect(() => {
    loadDemoCredentials();
  }, []);

  const loadDemoCredentials = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/demo-credentials`);
      if (response.data.success) {
        setDemoCredentials(response.data.data);
      }
    } catch (error) {
      console.error('Error loading demo credentials:', error);
      // Fallback to working credentials if API fails
      setDemoCredentials({
        superAdmin: {
          email: 'superadmin@shoppers9.com',
          phone: '9999999999',
          password: 'SuperAdmin@123',
          role: 'Super Administrator',
          description: 'Complete platform control with all permissions'
        },
        admin: {
          email: 'admin1@shoppers9.com',
          phone: '9876543210',
          password: 'admin123',
          role: 'Administrator',
          description: 'Administrative access with configurable permissions'
        },
        subAdmin: {
          email: 'admin2@shoppers9.com',
          phone: '9876543211',
          password: 'admin123',
          role: 'Sub Administrator',
          description: 'Limited administrative access with specific modules'
        }
      });
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setMessage(null);

    // Validation
    const newErrors: Record<string, string> = {};
    if (!emailForm.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(emailForm.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!emailForm.password) {
      newErrors.password = 'Password is required';
    } else if (emailForm.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setMessage(null); // Clear any previous messages
      console.log('🔑 Login: Starting login process for:', emailForm.email);
      await login(emailForm.email, emailForm.password);
      console.log('🔑 Login: Login completed successfully');
      setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
      // Navigation will be handled by the useEffect when user state is set
    } catch (error: any) {
      console.log('🔑 Login: Login failed with error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.message || 'Login failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setErrors({});
    setMessage(null);

    if (!phoneForm.phone) {
      setErrors({ phone: 'Phone number is required' });
      return;
    }
    if (!validatePhone(phoneForm.phone)) {
      setErrors({ phone: 'Please enter a valid 10-digit mobile number' });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/send-otp`,
        { phone: phoneForm.phone }
      );
      
      if (response.data.success) {
        setOtpSent(true);
        setOtpTimer(300); // 5 minutes
        setMessage({ 
          type: 'success', 
          text: 'OTP sent successfully! Please check your phone.' 
        });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to send OTP. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setMessage(null);

    if (!phoneForm.otp) {
      setErrors({ otp: 'OTP is required' });
      return;
    }
    if (phoneForm.otp.length !== 6) {
      setErrors({ otp: 'OTP must be 6 digits' });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/verify-otp`,
        { phone: phoneForm.phone, otp: phoneForm.otp }
      );
      
      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('adminToken', response.data.data.accessToken);
        setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Invalid OTP. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (credentials: any) => {
    setEmailForm({
      email: credentials.email,
      password: credentials.password
    });
    setAuthMethod('email');
    setShowDemoCredentials(false);
    
    // Auto-login with demo credentials
    try {
      setLoading(true);
      setMessage(null); // Clear any previous messages
      console.log('🔑 Demo Login: Starting demo login for:', credentials.email);
      await login(credentials.email, credentials.password);
      console.log('🔑 Demo Login: Demo login completed successfully');
      setMessage({ type: 'success', text: 'Demo login successful! Redirecting...' });
      // Navigation will be handled by the useEffect when user state is set
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Demo login failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Sign in to access your dashboard</p>
        </div>

        {/* Demo Credentials Button */}
        {demoCredentials && (
          <div className="mb-6">
            <button
              onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Info className="w-4 h-4" />
              {showDemoCredentials ? 'Hide' : 'Show'} Demo Credentials
            </button>
          </div>
        )}

        {/* Demo Credentials Panel */}
        {showDemoCredentials && demoCredentials && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-3">Demo Accounts</h3>
            <div className="space-y-3">
              {Object.entries(demoCredentials).map(([key, cred]) => (
                <div key={key} className="p-3 bg-white rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{cred.role}</span>
                    <button
                      onClick={() => handleDemoLogin(cred)}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                    >
                      Login
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Email: {cred.email}</div>
                    <div>Phone: {cred.phone}</div>
                    <div>Password: {cred.password}</div>
                    <div className="text-blue-600">{cred.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Auth Method Toggle */}
          <div className="flex mb-6 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => {
                setAuthMethod('email');
                setOtpSent(false);
                setErrors({});
                setMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
                authMethod === 'email'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => {
                setAuthMethod('phone');
                setOtpSent(false);
                setErrors({});
                setMessage(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
                authMethod === 'phone'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Phone
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
              message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
               message.type === 'error' ? <AlertCircle className="w-4 h-4" /> :
               <Info className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          {/* Email Login Form */}
          {authMethod === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={emailForm.email}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={emailForm.password}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Phone Login Form */}
          {authMethod === 'phone' && (
            <div className="space-y-4">
              {!otpSent ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={phoneForm.phone}
                      onChange={(e) => setPhoneForm(prev => ({ ...prev, phone: e.target.value }))}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                  
                  <button
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Send OTP
                        <Smartphone className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOTP}>
                  <div className="text-center mb-4">
                    <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-2">
                      <Key className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600">
                      OTP sent to +91 {phoneForm.phone}
                    </p>
                    {otpTimer > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        Expires in {formatTime(otpTimer)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      value={phoneForm.otp}
                      onChange={(e) => setPhoneForm(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '') }))}
                      className={`w-full py-3 px-4 border rounded-lg text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.otp ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="000000"
                      maxLength={6}
                    />
                    {errors.otp && (
                      <p className="mt-1 text-sm text-red-600">{errors.otp}</p>
                    )}
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setPhoneForm(prev => ({ ...prev, otp: '' }));
                        setOtpTimer(0);
                      }}
                      className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Change Number
                    </button>
                    <button
                      type="submit"
                      disabled={loading || phoneForm.otp.length !== 6}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Verify
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>

                  {otpTimer === 0 && (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="w-full mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Resend OTP
                    </button>
                  )}
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 Shoppers9. All rights reserved.</p>
          <p className="mt-1">Secure admin access with role-based permissions</p>
        </div>
      </div>
    </div>
  );
};

export default Login;