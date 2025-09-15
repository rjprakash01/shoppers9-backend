import React from 'react';
import { Link } from 'react-router-dom';
import { Home, RefreshCw, AlertTriangle, Mail } from 'lucide-react';

interface ServerErrorProps {
  error?: Error;
  resetError?: () => void;
}

const ServerError: React.FC<ServerErrorProps> = ({ error, resetError }) => {
  const handleRefresh = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* 500 Number */}
          <div className="text-9xl font-bold text-red-600 mb-4">
            500
          </div>
          
          {/* Error Icon */}
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
          
          {/* Error Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Server Error
          </h1>
          
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            Oops! Something went wrong on our end. 
            We're working to fix this issue. Please try again in a few moments.
          </p>
          
          {/* Error Details (Development Mode) */}
          {error && process.env.NODE_ENV === 'development' && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left max-w-lg mx-auto">
              <h3 className="text-sm font-medium text-red-800 mb-2">Error Details (Development)</h3>
              <p className="text-xs text-red-700 font-mono break-all">
                {error.message}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-red-700 cursor-pointer">Stack Trace</summary>
                  <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <button
              onClick={handleRefresh}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </button>
            
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Link>
          </div>
          
          {/* Contact Support */}
          <div className="mt-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-sm mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Need Help?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                If this problem persists, please contact our support team.
              </p>
              <Link
                to="/support"
                className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerError;