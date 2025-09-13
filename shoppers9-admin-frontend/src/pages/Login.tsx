import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAdminLogin = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    setIsLoading(true);
    
    try {
      // Clear any existing tokens before login
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      
      await login('admin@shoppers9.com', 'admin123', 'email');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      alert(`Login failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      console.log('Testing backend connection...');
      const response = await fetch('/api/test-connection');
      const data = await response.json();
      console.log('Connection test result:', data);
      alert(`Connection test: ${data.message}`);
    } catch (error) {
      console.error('Connection test failed:', error);
      alert(`Connection test failed: ${error}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Shoppers9 Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Click below to access the admin panel
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div>
            <button
              onClick={testConnection}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 mb-4"
            >
              Test Backend Connection
            </button>
            
            <button
              onClick={handleAdminLogin}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Accessing Admin Panel...
                </div>
              ) : (
                'Enter Admin Panel'
              )}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              No credentials required - instant access for demo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;