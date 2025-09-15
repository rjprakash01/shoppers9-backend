import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
  text,
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-400'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 
        className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`} 
      />
      {text && (
        <p className={`mt-2 ${textSizeClasses[size]} ${colorClasses[color]} font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

// Button Loading Spinner
export const ButtonSpinner: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <Loader2 className={`w-4 h-4 animate-spin ${className}`} />
  );
};

// Inline Loading Spinner
export const InlineSpinner: React.FC<{ text?: string; className?: string }> = ({ 
  text = 'Loading...', 
  className = '' 
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
};

// Page Loading Overlay
export const PageLoadingOverlay: React.FC<{ text?: string }> = ({ 
  text = 'Loading...' 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm mx-4">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">{text}</p>
          <p className="text-sm text-gray-600 text-center">
            Please wait while we process your request...
          </p>
        </div>
      </div>
    </div>
  );
};

// Card Loading State
export const CardLoadingState: React.FC<{ 
  title?: string; 
  description?: string;
  className?: string;
}> = ({ 
  title = 'Loading...', 
  description = 'Please wait while we fetch your data.',
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center ${className}`}>
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
};

// Table Loading State
export const TableLoadingState: React.FC<{ 
  columns?: number;
  rows?: number;
}> = ({ columns = 4, rows = 5 }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-sm text-gray-600">Loading table data...</p>
      </div>
    </div>
  );
};

// Search Loading State
export const SearchLoadingState: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">Searching...</p>
        <p className="text-sm text-gray-600">Finding the best results for you.</p>
      </div>
    </div>
  );
};

// Upload Loading State
export const UploadLoadingState: React.FC<{ progress?: number }> = ({ progress }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">Uploading...</p>
        {progress !== undefined && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <p className="text-sm text-gray-600">
          {progress !== undefined ? `${progress}% complete` : 'Please wait...'}
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;