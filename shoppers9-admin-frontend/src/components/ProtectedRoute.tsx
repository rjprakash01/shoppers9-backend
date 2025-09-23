import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, token, isLoading } = useAuth();

  console.log('🛡️ ProtectedRoute: isLoading:', isLoading, 'user:', !!user, 'token:', !!token);
  
  if (isLoading) {
    console.log('🛡️ ProtectedRoute: Still loading, showing spinner...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !token) {
    console.log('🛡️ ProtectedRoute: No user or token, redirecting to login...');
    return <Navigate to="/login" replace />;
  }

  console.log('🛡️ ProtectedRoute: User authenticated, rendering protected content...');
  return <>{children}</>;
};

export default ProtectedRoute;