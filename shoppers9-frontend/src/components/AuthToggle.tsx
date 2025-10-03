import React, { useState } from 'react';
import { Phone, Mail, Eye, EyeOff, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthToggleProps {
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
}

const AuthToggle: React.FC<AuthToggleProps> = ({ mode, onModeChange }) => {
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('email');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    otp: ''
  });
  
  const { login, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };
  
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  const validatePhone = (phone: string) => {
    return phone === '1234567890' || /^[6-9]\d{9}$/.test(phone);
  };
  
  const validatePassword = (password: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password) && password.length >= 8;
  };
  
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (mode === 'register') {
        // Email registration
        if (!formData.name.trim()) {
          throw new Error('Name is required');
        }
        if (!validateEmail(formData.email)) {
          throw new Error('Please enter a valid email address');
        }
        if (!validatePassword(formData.password)) {
          throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
        }
        
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.toLowerCase().trim(),
            password: formData.password
          })
        });
        
        let data;
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          throw new Error('Server response error. Please try again.');
        }
        
        if (!response.ok) {
          throw new Error(data.message || `Registration failed (${response.status})`);
        }
        
        // Store tokens and update auth context
        localStorage.setItem('authToken', data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Update auth context with user data
        setUser(data.data.user);
        
        navigate(from, { replace: true });
        
      } else {
        // Email login
        if (!validateEmail(formData.email)) {
          throw new Error('Please enter a valid email address');
        }
        if (!formData.password) {
          throw new Error('Password is required');
        }
        
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email.toLowerCase().trim(),
            password: formData.password
          })
        });
        
        let data;
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          throw new Error('Server response error. Please try again.');
        }
        
        if (!response.ok) {
          throw new Error(data.message || `Login failed (${response.status})`);
        }
        
        // Store tokens and update auth context
        localStorage.setItem('authToken', data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Update auth context with user data
        setUser(data.data.user);
        
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (step === 'input') {
        // Send OTP
        if (!validatePhone(formData.phone)) {
          throw new Error('Please enter a valid 10-digit phone number');
        }
        
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: formData.phone })
        });
        
        let data;
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          throw new Error('Server response error. Please try again.');
        }
        
        if (!response.ok) {
          throw new Error(data.message || `Failed to send OTP (${response.status})`);
        }
        
        setStep('otp');
      } else {
        // Verify OTP
        if (!formData.otp || formData.otp.length !== 4) {
          throw new Error('Please enter a valid 4-digit OTP');
        }
        
        const requestBody: any = {
          phone: formData.phone,
          otp: formData.otp
        };
        
        if (mode === 'register' && formData.name.trim()) {
          requestBody.name = formData.name.trim();
        }
        
        await login(formData.phone, formData.otp);
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', password: '', otp: '' });
    setStep('input');
    setError('');
  };
  
  const switchAuthMethod = (method: 'phone' | 'email') => {
    setAuthMethod(method);
    resetForm();
  };
  
  const switchMode = (newMode: 'login' | 'register') => {
    onModeChange(newMode);
    resetForm();
  };
  
  return (
    <div className="w-full">
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Sign-In</h2>
        </div>
        
        {/* Auth Method Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <button
            onClick={() => switchAuthMethod('email')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition-all ${
              authMethod === 'email'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Mail className="w-4 h-4 mr-2" />
            Email
          </button>
          <button
            onClick={() => switchAuthMethod('phone')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition-all ${
              authMethod === 'phone'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Phone className="w-4 h-4 mr-2" />
            Phone
          </button>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        {/* Email Authentication Form */}
        {authMethod === 'email' && (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {mode === 'register' && (
                <p className="text-xs text-gray-500 mt-1">
                  Must contain uppercase, lowercase, number, and special character
                </p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>
        )}
        
        {/* Phone Authentication Form */}
        {authMethod === 'phone' && (
          <form onSubmit={handlePhoneAuth} className="space-y-4">
            {step === 'input' ? (
              <>
                {mode === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter 10-digit phone number"
                      maxLength={10}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Use 1234567890 for testing
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={formData.otp}
                    onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g, ''))}
                    className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                    placeholder="1234"
                    maxLength={4}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    OTP sent to {formData.phone.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3')}
                  </p>
                  <p className="text-xs text-blue-600 mt-1 text-center">
                    Use 1234 for testing
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Verify OTP
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="w-full text-blue-600 py-2 text-sm hover:text-blue-700"
                >
                  Change Phone Number
                </button>
              </>
            )}
          </form>
        )}
        
      </div>
    </div>
  );
};

export default AuthToggle;